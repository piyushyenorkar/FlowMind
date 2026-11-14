// ─── FlowMind Backend — Express API Server ─────────────────────────────────────
import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { mergeTeam, mergeMember, mergeTask, queryTeamGraph, closeDriver } from './services/neo4j'
import { getGitHubActivity } from './services/github'
import agoraToken from 'agora-token'
const { RtcTokenBuilder, RtcRole } = agoraToken

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

const HINDSIGHT_BASE = process.env.HINDSIGHT_BASE_URL!
const HINDSIGHT_KEY  = process.env.HINDSIGHT_API_KEY!
const GROQ_KEYS      = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean)
const GROQ_DEFAULT_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
const GROQ_FALLBACK_MODELS = [GROQ_DEFAULT_MODEL, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']
const GNANI_KEY      = process.env.GNANI_API_KEY || ''
const AGORA_APP_ID   = process.env.AGORA_APP_ID!

let currentGroqKeyIndex = 0
const AGORA_CERT     = process.env.AGORA_APP_CERTIFICATE!

// ── Health check ────────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Hindsight Routes ────────────────────────────────────────────────────────────

app.post('/api/hindsight/retain', async (req: Request, res: Response) => {
  const { bankId, messages, metadata, items } = req.body
  try {
    const payloadItems = items || (messages ? messages.map((m: any) => ({
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      metadata: metadata || {}
    })) : [])

    const response = await fetch(
      `${HINDSIGHT_BASE}/v1/default/banks/${bankId}/memories`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HINDSIGHT_KEY}`,
        },
        body: JSON.stringify({ items: payloadItems, messages, metadata }),
      }
    )
    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Hindsight Retain Error ${response.status}: ${errText}`)
    }
    res.json({ success: true })
  } catch (err: any) {
    console.error('[Hindsight Retain]', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/hindsight/recall', async (req: Request, res: Response) => {
  const { bankId, query, options } = req.body
  try {
    const response = await fetch(
      `${HINDSIGHT_BASE}/v1/default/banks/${bankId}/memories/recall`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HINDSIGHT_KEY}`,
        },
        body: JSON.stringify({
          query,
          max_tokens: options?.maxTokens || 2000,
          ...options,
        }),
      }
    )
    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Hindsight Recall Error ${response.status}: ${errText}`)
    }
    const data = await response.json()
    res.json(data)
  } catch (err: any) {
    console.error('[Hindsight Recall]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Groq Routes ─────────────────────────────────────────────────────────────────

app.post('/api/groq/chat', async (req: Request, res: Response) => {
  console.log('[API] /api/groq/chat called')
  const { messages, options } = req.body
  try {
    if (GROQ_KEYS.length === 0) throw new Error('No Groq API keys configured')

    const targetModel = options?.model || GROQ_DEFAULT_MODEL
    const modelsToTry = [targetModel, ...GROQ_FALLBACK_MODELS.filter(m => m !== targetModel)]

    let lastError = null

    for (let i = 0; i < GROQ_KEYS.length; i++) {
      const keyIndex = (currentGroqKeyIndex + i) % GROQ_KEYS.length
      const apiKey = GROQ_KEYS[keyIndex]

      for (const model of modelsToTry) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: options?.temperature ?? 0.7,
              max_completion_tokens: options?.maxTokens || 1500,
            }),
          })

          if (response.ok) {
            currentGroqKeyIndex = keyIndex // Lock in the successful key for next requests
            const data = await response.json()
            return res.json(data)
          }

          const errText = await response.text().catch(() => '')
          lastError = `Groq API Error (${model}) ${response.status}: ${errText}`

          if (response.status === 429) {
            console.warn(`[Groq Chat] Key ${keyIndex + 1}/${GROQ_KEYS.length} rate limited. Retrying with next key...`)
            break // Move to next key on rate limit
          } else if (response.status === 400 || response.status === 404) {
            console.warn(`[Groq Chat] Model ${model} returned ${response.status}. Trying fallback model...`)
            continue // Try next candidate model
          } else {
            console.warn(`[Groq Chat] Model ${model} returned error ${response.status}: ${errText}`)
            continue
          }
        } catch (fetchErr: any) {
          lastError = fetchErr.message
          continue
        }
      }
    }

    throw new Error(lastError || 'All configured Groq API keys and models failed.')
  } catch (err: any) {
    console.error('[Groq Chat]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Neo4j Routes ────────────────────────────────────────────────────────────────

app.post('/api/neo4j/sync-team', async (req: Request, res: Response) => {
  const { teamCode, name } = req.body
  try {
    await mergeTeam(teamCode, name)
    res.json({ success: true })
  } catch (err: any) {
    console.error('[Neo4j sync-team]', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/neo4j/sync-member', async (req: Request, res: Response) => {
  const { teamCode, memberId, name, role } = req.body
  try {
    await mergeMember(teamCode, memberId, name, role)
    res.json({ success: true })
  } catch (err: any) {
    console.error('[Neo4j sync-member]', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/neo4j/sync-task', async (req: Request, res: Response) => {
  const { teamCode, taskId, title, status, assignedTo } = req.body
  try {
    await mergeTask(teamCode, taskId, title, status, assignedTo)
    res.json({ success: true })
  } catch (err: any) {
    console.error('[Neo4j sync-task]', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/neo4j/graph-insights', async (req: Request, res: Response) => {
  console.log('[API] /api/neo4j/graph-insights called with', req.body)
  const { teamCode } = req.body
  try {
    const data = await queryTeamGraph(teamCode)
    console.log('[API] /api/neo4j/graph-insights SUCCESS')
    res.json(data)
  } catch (err: any) {
    console.warn('[Neo4j graph-insights] Neo4j unavailable/paused, using graceful fallback:', err.message)
    // Return fallback graph structure so Groq AI insights continue without disruption
    res.json({
      memberWorkloads: [],
      taskChains: [],
      stats: { totalNodes: 0, totalRelationships: 0 },
      source: 'fallback',
      message: 'Neo4j database instance is paused or unreachable'
    })
  }
})

// ── Gnani AI Routes (Prisma STT & Timbre TTS) ───────────────────────────────────

app.post('/api/gnani/transcribe', async (req: Request, res: Response) => {
  try {
    if (!GNANI_KEY) {
      res.status(500).json({ success: false, error: 'GNANI_API_KEY not configured in backend environment' })
      return
    }

    const { audio, languageCode, format, model } = req.body
    if (!audio) {
      res.status(400).json({ success: false, error: 'Audio data is required (base64 encoded)' })
      return
    }

    const audioBuffer = Buffer.from(audio, 'base64')
    if (audioBuffer.length === 0) {
      res.status(400).json({ success: false, error: 'Audio buffer is empty' })
      return
    }

    const formData = new FormData()
    formData.append('audio_file', new Blob([audioBuffer], { type: 'audio/wav' }), 'recording.wav')
    formData.append('model', model || 'prisma-v3.0')
    formData.append('language_code', languageCode || 'indic-auto')
    formData.append('format', format || 'transcribe')

    const response = await fetch('https://api.vachana.ai/stt/v3', {
      method: 'POST',
      headers: {
        'X-API-Key-ID': GNANI_KEY,
      },
      body: formData,
    })

    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.success) {
      const errMsg = data?.error?.message || data?.message || `Gnani STT API error ${response.status}`
      console.warn('[Gnani STT]', errMsg)
      res.status(response.status || 500).json({ success: false, error: errMsg })
      return
    }

    res.json({
      success: true,
      transcript: data.transcript || '',
      model: data.model || 'prisma-v3.0',
      detected_language_code: data.detected_language_code || null,
      processing_time: data.processing_time || null,
      end_to_end_latency: data.end_to_end_latency || null,
    })
  } catch (err: any) {
    console.error('[Gnani STT]', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

app.post('/api/gnani/tts', async (req: Request, res: Response) => {
  try {
    if (!GNANI_KEY) {
      res.status(500).json({ success: false, error: 'GNANI_API_KEY not configured in backend environment' })
      return
    }

    const { text, voice, language, speed } = req.body
    if (!text || !text.trim()) {
      res.status(400).json({ success: false, error: 'Text is required for TTS' })
      return
    }

    const response = await fetch('https://api.vachana.ai/api/v1/tts/inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key-ID': GNANI_KEY,
      },
      body: JSON.stringify({
        text: text.trim(),
        voice: voice || 'Shivani',
        model: 'timbre-v3.0',
        language: language || 'hi-IN',
        speed: speed ?? 1,
        audio_config: {
          encoding: 'linear_pcm',
          container: 'wav',
          num_channels: 1,
          sample_rate: 24000,
          sample_width: 2,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.warn('[Gnani TTS]', response.status, errText)
      res.status(response.status).json({ success: false, error: errText })
      return
    }

    const audioBuffer = await response.arrayBuffer()
    res.setHeader('Content-Type', 'audio/wav')
    res.setHeader('Content-Length', audioBuffer.byteLength)
    res.send(Buffer.from(audioBuffer))
  } catch (err: any) {
    console.error('[Gnani TTS]', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Agora Token Route ───────────────────────────────────────────────────────────

app.get('/api/agora/token', (req: Request, res: Response) => {
  const { channelName, uid } = req.query
  if (!channelName || !uid) {
    res.status(400).json({ error: 'channelName and uid are required' })
    return
  }
  if (!AGORA_APP_ID || !AGORA_CERT) {
    res.status(500).json({ error: 'Agora credentials not configured' })
    return
  }

  // Token expires in 1 hour
  const expirationInSeconds = 3600
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const privilegeExpiredTs = currentTimestamp + expirationInSeconds

  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_CERT,
    String(channelName),
    Number(uid),
    RtcRole.PUBLISHER,
    privilegeExpiredTs,
    privilegeExpiredTs
  )

  res.json({
    token,
    appId: AGORA_APP_ID,
    channel: channelName,
    uid: Number(uid),
  })
})

// ── GitHub Routes ─────────────────────────────────────────────────────────────

app.post('/api/github/activity', async (req: Request, res: Response) => {
  const { repoUrl, token } = req.body
  if (!repoUrl || !repoUrl.trim()) {
    res.status(400).json({ success: false, error: 'Repository URL or slug is required' })
    return
  }
  try {
    const activity = await getGitHubActivity(repoUrl.trim(), token)
    res.json(activity)
  } catch (err: any) {
    console.error('[GitHub API Route Error]:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Start ───────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✓ FlowMind Backend running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await closeDriver()
  process.exit(0)
})
