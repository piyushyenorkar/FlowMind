// ─── FlowMind Backend — Express API Server ─────────────────────────────────────
import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { mergeTeam, mergeMember, mergeTask, queryTeamGraph, closeDriver } from './services/neo4j'
import agoraToken from 'agora-token'
const { RtcTokenBuilder, RtcRole } = agoraToken

const app = express()
app.use(cors())
app.use(express.json())

const HINDSIGHT_BASE = process.env.HINDSIGHT_BASE_URL!
const HINDSIGHT_KEY  = process.env.HINDSIGHT_API_KEY!
const GROQ_KEYS      = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean)
const AGORA_APP_ID   = process.env.AGORA_APP_ID!

let currentGroqKeyIndex = 0
const AGORA_CERT     = process.env.AGORA_APP_CERTIFICATE!

// ── Health check ────────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Hindsight Routes ────────────────────────────────────────────────────────────

app.post('/api/hindsight/retain', async (req: Request, res: Response) => {
  const { bankId, messages, metadata } = req.body
  try {
    const response = await fetch(
      `${HINDSIGHT_BASE}/v1/default/banks/${bankId}/memories`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HINDSIGHT_KEY}`,
        },
        body: JSON.stringify({ messages, metadata }),
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

    let lastError = null

    for (let i = 0; i < GROQ_KEYS.length; i++) {
      const keyIndex = (currentGroqKeyIndex + i) % GROQ_KEYS.length
      const apiKey = GROQ_KEYS[keyIndex]
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
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
      lastError = `Groq API Error ${response.status}: ${errText}`

      if (response.status === 429) {
        console.warn(`[Groq Chat] Key ${keyIndex + 1}/${GROQ_KEYS.length} rate limited. Retrying with next key...`)
        continue // Try the next key
      } else {
        throw new Error(lastError) // Non-rate limit error, fail immediately
      }
    }

    throw new Error(lastError || 'All configured Groq API keys have hit their rate limit.')
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
    console.error('[Neo4j graph-insights]', err.message)
    res.status(500).json({ error: err.message })
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
