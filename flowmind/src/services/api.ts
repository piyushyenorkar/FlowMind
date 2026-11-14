// ─── FlowMind API Service Layer ────────────────────────────────────────────────
// Routes through the backend server for secure API key handling and Neo4j integration

import { supabase } from './supabase';
const BACKEND_URL = (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000')
) + '/api'

// ── Hindsight Memory ───────────────────────────────────────────────────────────

function getBankId(teamCode: string) {
  return `flowmind-${(teamCode || 'default').toLowerCase()}`
}

/**
 * Store a memory in Hindsight via Backend
 */
export async function retainMemory(teamCode: string, content: any, metadata = {}) {
  const bankId = getBankId(teamCode)
  try {
    const res = await fetch(`${BACKEND_URL}/hindsight/retain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankId,
        messages: [{ role: 'user', content: typeof content === 'string' ? content : JSON.stringify(content) }],
        metadata: { source: 'flowmind', timestamp: new Date().toISOString(), ...metadata },
      }),
    })
    return res.ok
  } catch (err: any) {
    console.warn('[Hindsight] Retain error:', err.message)
    return false
  }
}

/**
 * Recall memories from Hindsight via Backend
 */
export async function recallMemory(teamCode: string, query: string, options: any = {}) {
  const bankId = getBankId(teamCode)
  try {
    const res = await fetch(`${BACKEND_URL}/hindsight/recall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankId, query, options }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err: any) {
    console.warn('[Hindsight] Recall error:', err.message)
    return null
  }
}

// ── Groq Chat Completions ──────────────────────────────────────────────────────

/**
 * Send a chat completion request to Groq via Backend
 */
export async function groqChat(messages: any, systemPrompt = '', options: any = {}) {
  const allMessages = []
  if (systemPrompt) allMessages.push({ role: 'system', content: systemPrompt })
  allMessages.push(...messages)

  try {
    const res = await fetch(`${BACKEND_URL}/groq/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: allMessages, options }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (err: any) {
    console.warn('[Groq] Request error:', err.message)
    return null
  }
}

// ── Gnani AI Service (Prisma STT & Timbre TTS) ────────────────────────────────

export interface GnaniTranscriptionResult {
  success: boolean
  transcript: string
  model?: string
  detected_language_code?: string
  error?: string
}

/**
 * Transcribe recorded audio with Gnani Prisma v3.0 via Backend
 */
export async function transcribeWithGnani(audioBase64: string, languageCode = 'indic-auto'): Promise<GnaniTranscriptionResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/gnani/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: audioBase64,
        languageCode,
        model: 'prisma-v3.0',
        format: 'transcribe'
      })
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      return {
        success: false,
        transcript: '',
        error: data.error || `Transcription failed with status ${res.status}`
      }
    }

    return {
      success: true,
      transcript: data.transcript || '',
      model: data.model,
      detected_language_code: data.detected_language_code
    }
  } catch (err: any) {
    console.warn('[Gnani STT Client Error]:', err.message)
    return {
      success: false,
      transcript: '',
      error: err.message || 'Network error reaching transcription service'
    }
  }
}

let activeAudio: HTMLAudioElement | null = null
let activeAudioUrl: string | null = null

export function stopGnaniAudio() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
  }
  if (activeAudioUrl) {
    try {
      URL.revokeObjectURL(activeAudioUrl)
    } catch {}
    activeAudioUrl = null
  }
}

/**
 * Synthesize and play speech using Gnani Timbre v3.0 via Backend.
 * Returns a cancel function.
 */
export async function playGnaniTTS(
  text: string,
  options?: {
    voice?: string
    language?: string
    onStart?: () => void
    onEnd?: () => void
    onError?: (err: string) => void
  }
): Promise<() => void> {
  const { voice = 'Shivani', language = 'hi-IN', onStart, onEnd, onError } = options || {}
  if (!text || !text.trim()) {
    onError?.('No text provided for speech')
    return () => {}
  }

  stopGnaniAudio()

  try {
    const res = await fetch(`${BACKEND_URL}/gnani/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), voice, language })
    })

    if (!res.ok) {
      const err = await res.text()
      onError?.(err)
      return () => {}
    }

    const blob = await res.blob()
    const audioUrl = URL.createObjectURL(blob)
    activeAudioUrl = audioUrl
    const audio = new Audio(audioUrl)
    activeAudio = audio

    audio.onplay = () => onStart?.()
    audio.onended = () => {
      if (activeAudio === audio) activeAudio = null
      try {
        URL.revokeObjectURL(audioUrl)
      } catch {}
      onEnd?.()
    }
    audio.onerror = (e) => {
      console.warn('[Gnani TTS Audio Error]', e)
      if (activeAudio === audio) activeAudio = null
      try {
        URL.revokeObjectURL(audioUrl)
      } catch {}
      onError?.('Playback error')
    }

    await audio.play()

    return () => {
      audio.pause()
      audio.currentTime = 0
      try {
        URL.revokeObjectURL(audioUrl)
      } catch {}
      if (activeAudio === audio) activeAudio = null
      onEnd?.()
    }
  } catch (err: any) {
    console.warn('[Gnani TTS Error]:', err.message)
    onError?.(err.message)
    return () => {}
  }
}

// ── Neo4j Graph Sync ───────────────────────────────────────────────────────────

export async function syncTeamToGraph(teamCode: string, name: string) {
    try {
        await fetch(`${BACKEND_URL}/neo4j/sync-team`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode, name }),
        });
    } catch(err) {
        console.warn('[Neo4j] Sync team error:', err);
    }
}

export async function syncMemberToGraph(teamCode: string, memberId: string, name: string, role: string) {
    try {
        await fetch(`${BACKEND_URL}/neo4j/sync-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode, memberId, name, role }),
        });
    } catch(err) {
        console.warn('[Neo4j] Sync member error:', err);
    }
}

export async function syncTaskToGraph(teamCode: string, taskId: string, title: string, status: string, assignedTo: string) {
    try {
        await fetch(`${BACKEND_URL}/neo4j/sync-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode, taskId, title, status, assignedTo }),
        });
    } catch(err) {
        console.warn('[Neo4j] Sync task error:', err);
    }
}

export async function fetchGraphInsights(teamCode: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/neo4j/graph-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamCode }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err: any) {
    console.warn('[Neo4j] Graph insights error:', err.message)
    return null
  }
}

/**
 * Generate AI insights using recalled Hindsight memories + Groq + Neo4j Graph
 */
export async function generateInsights(teamCode: string, tasks: any[], decisions: any[], members: any[]) {
  // Step 1: Recall multiple memory contexts
  const memoryQueries = [
    'team performance task completion patterns delays',
    'decisions risks bottlenecks problems encountered',
    'member skills profiles strengths weaknesses assignments',
    'meetings discussions action items follow-ups',
  ]

  let memoryContext = ''
  for (const query of memoryQueries) {
    try {
      const recalled = await recallMemory(teamCode, query, { maxTokens: 1500 })
      if (recalled) {
        const text = typeof recalled === 'string' ? recalled : JSON.stringify(recalled)
        memoryContext += text.substring(0, 1500) + '\n---\n'
      }
    } catch {}
  }
  if (!memoryContext.trim()) {
    memoryContext = 'No memories found in FlowMind Memory for this team yet.'
  }

  // Step 2: Fetch Graph Data (Neo4j)
  const graphData = await fetchGraphInsights(teamCode)

  // Step 3: Build structured data (select most relevant recent tasks & decisions)
  const taskData = (tasks || []).map(t => ({
    title: t.title, assignedTo: t.assignedTo || t.assigned_to, status: t.status, deadline: t.deadline || 'not set', estimatedHours: t.estimatedHours || t.estimated_hours || 0, createdAt: t.createdAt || t.created_at,
  }))
  const decisionData = (decisions || []).map(d => ({
    decision: d.decision, reason: d.reason, impact: d.impact, involvedPeople: d.involvedPeople || d.involved_people,
  }))
  const memberData = (members || []).map(m => ({
    name: m.name, role: m.role, isLeader: m.isLeader ?? m.is_leader,
  }))

  const systemPrompt = `You are FlowMind AI — a project intelligence engine. You analyze REAL team data stored in FlowMind Memory and Neo4j Graph Database to surface actionable insights.

CRITICAL: Your analysis must be SPECIFIC to this team. Use actual task names, member names, deadlines, and memory context. Do NOT generate generic insights. Keep each item concise (1-2 sentences).

TEAM DATA:
• ${tasks.length} tasks: ${tasks.filter(t => t.status === 'done').length} done, ${tasks.filter(t => t.status === 'in-progress').length} in-progress, ${tasks.filter(t => t.status === 'todo').length} todo
• ${decisions.length} decisions logged
• ${members.length} team members: ${members.map(m => m.name).slice(0, 12).join(', ')}

NEO4J GRAPH INSIGHTS (Bottlenecks & Workload):
${JSON.stringify(graphData)}

TASKS (Active & Recent):
${JSON.stringify(taskData.slice(-25))}
DECISIONS (Recent):
${JSON.stringify(decisionData.slice(-10))}
MEMBERS:
${JSON.stringify(memberData.slice(0, 15))}

FLOWMIND MEMORY (past events, conversations, patterns):
${memoryContext.substring(0, 2000)}

RULES:
1. Reference ACTUAL task names and member names from the data above
2. Calculate risk scores (0-100) based on deadline proximity, workload, and memory patterns
3. Identify patterns from the FlowMind Memory — recurring issues, communication gaps, workload imbalances
4. For bottlenecks, heavily rely on the Neo4j Graph Insights. If someone is overloaded or tasks are chaining, point it out explicitly.
5. Recommendation must be a specific, actionable paragraph (2-3 sentences) referencing real data

Respond with ONLY valid JSON, no markdown fences, no explanatory text:
{
  "risks": [{"member": "real name", "task": "real task title", "risk": 0-100, "reason": "concise explanation"}],
  "patterns": [{"icon": "emoji", "title": "Pattern Name", "detail": "concise detail"}],
  "bottlenecks": [{"task": "real task title", "person": "real name", "waiting": 2, "graph_insight": "concise graph insight"}],
  "recommendation": "Specific actionable recommendation paragraph referencing real team deliverables."
}
Provide exactly 2 items for risks, 2 for patterns, and 2 for bottlenecks.`

  try {
    const reply = await groqChat([{ role: 'user', content: 'Analyze this team data and FlowMind Memory.' }], systemPrompt, { maxTokens: 2500 })
    if (!reply) return null

    // Clean out think tags, code blocks, or leading/trailing commentary
    const cleaned = reply
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/```json|```/g, '')
      .trim()

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.risks || parsed.bottlenecks || parsed.recommendation) {
          // Normalize bottlenecks if empty or malformed
          if (!Array.isArray(parsed.bottlenecks)) parsed.bottlenecks = []
          if (!Array.isArray(parsed.risks)) parsed.risks = []
          if (!Array.isArray(parsed.patterns)) parsed.patterns = []
          return parsed
        }
      } catch (innerErr) {
        console.warn('[Insights] Inner parse error:', innerErr)
      }
    }
    return JSON.parse(cleaned)
  } catch (err: any) {
    console.warn('[Insights] Failed to parse Groq response:', err.message)
    return null
  }
}

/**
 * Send a chat message using recalled Hindsight memories + Groq + live GitHub context
 */
export async function sendChatMessage(teamCode: string, userMessage: string, context: any, conversationHistory: any[]) {
  const recalled = await recallMemory(teamCode, userMessage)
  const memoryContext = recalled ? JSON.stringify(recalled).substring(0, 2000) : 'No specific memories found.'

  let repoContext = 'No repository connected.'
  if (context.githubActivity && context.githubActivity.success) {
    const gh = context.githubActivity
    const recentCommitsList = (gh.commits || []).slice(0, 15).map((c: any) => 
      `- [${c.shortSha}] "${c.message.replace(/\s+/g, ' ').trim()}" by ${c.author?.name || c.author?.username || 'Unknown'} (${c.date})`
    ).join('\n')

    const prsList = (gh.pullRequests || []).slice(0, 5).map((p: any) =>
      `- PR #${p.number}: "${p.title}" [${p.state}${p.isMerged ? ' - merged' : ''}] by ${p.author}`
    ).join('\n')

    const contributorsList = (gh.contributors || []).slice(0, 5).map((ct: any) =>
      `${ct.name || ct.username} (${ct.commitCount} commits)`
    ).join(', ')

    repoContext = `Repository: ${gh.owner}/${gh.repoName} (Branch: ${gh.defaultBranch || 'main'})
Stats: ${gh.stats?.commitsFetched || gh.commits?.length || 0} commits, ${gh.stats?.openPrCount || 0} open PRs, ${gh.stats?.stars || 0} stars
Top Contributors: ${contributorsList || 'None'}
Recent Commits (Live):
${recentCommitsList || 'No recent commits recorded.'}
${prsList ? `\nRecent Pull Requests:\n${prsList}` : ''}`
  } else if (context.repo) {
    repoContext = `Repository: ${context.repo} (connected, but activity details could not be loaded; check GitHub access token).`
  }

  const systemPrompt = `You are FlowMind AI, an intelligent project assistant with direct access to FlowMind Memory, active team tasks, decisions, and live Git repository activity.

Live Git Repository Data:
${repoContext}

Team Context:
- Tasks: ${context.tasks?.length || 0} tasks (${context.tasks?.filter((t: any) => t.status === 'done')?.length || 0} done)
- Decisions: ${context.decisions?.length || 0} logged
- Members: ${context.members?.length || 0} active
- Memory Activity: ${context.memoryFeed?.slice(0, 5).map((m: any) => m.text).join('; ') || 'None'}

FlowMind Memory Recall: ${memoryContext}
Tasks Details: ${JSON.stringify(context.tasks?.map((t: any) => ({ title: t.title, assignedTo: t.assignedTo, status: t.status })) || [])}
Decisions Details: ${JSON.stringify(context.decisions?.map((d: any) => ({ decision: d.decision, impact: d.impact })) || [])}

Rules:
1. ABSOLUTELY NO EMOJIS: Never use any emojis anywhere in your response (no 📅, 📊, ⚠️, 🔄, 📌, 💡, 🚀, etc.). FlowMind is a minimalist dark tech platform. Emojis clash with the interface and are strictly forbidden.
2. LIVE REPOSITORY ACCESS: You HAVE direct real-time access to the connected repository commits, branches, and PRs provided in "Live Git Repository Data" above. When asked about repository updates, commits, code changes, or git progress, ALWAYS provide the exact recent commits with commit hash (\`shortSha\`), author, relative time, and commit message. NEVER claim that you do not have direct access to git logs or repository history.
3. CONCISE & PROFESSIONAL: Be concise, clear, and engineering-focused. Use clean standard markdown formatting:
   - Section headers: Use **bold section headers** or '### Header' (without any emojis).
   - Bullets: Use clean standard dashes '- ' for lists.
   - Tasks: Write task titles plainly as normal text (e.g. "- In-Progress: Login work, UI Helper API, Build API"). DO NOT wrap everyday task names in backticks.
   - Code & Commits: Only use backticks for actual git commit hashes (e.g. \`c26704f\`), branch names (\`main\`), or CLI commands.
   - Notes & Highlights: Start callout lines with '> Note:' or '> Important:' or '> Recommendation:'.
4. Reference team members, tasks, and commits by name and specifics.`

  const messages = conversationHistory
    .filter(m => m.role && m.text)
    .slice(-8)
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))

  messages.push({ role: 'user', content: userMessage })

  const reply = await groqChat(messages, systemPrompt)
  let cleanReply = reply || "I've checked FlowMind records for your question."
  // Strip any accidental emojis that might have slipped through from the LLM
  cleanReply = cleanReply.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '').trim()
  return cleanReply
}

// ── AI Chat Sessions ───────────────────────────────────────────────────────────

export async function createAiChatSession(teamCode: string, name: string = 'New Chat') {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .insert([{ team_code: teamCode, name }])
    .select('*')
    .single()
  if (error) console.error('Error creating chat session:', error)
  return data
}

export async function renameAiChatSession(sessionId: string, newName: string) {
  const { error } = await supabase
    .from('ai_chat_sessions')
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) console.error('Error renaming chat session:', error)
}

export async function deleteAiChatSession(sessionId: string) {
  const { error } = await supabase
    .from('ai_chat_sessions')
    .delete()
    .eq('id', sessionId)
  if (error) console.error('Error deleting chat session:', error)
}

export async function saveAiChatMessage(sessionId: string, role: string, text: string) {
  const { error } = await supabase
    .from('ai_chats')
    .insert([{ session_id: sessionId, role, text }])
  if (error) {
    console.error('Error saving chat message:', error)
  } else {
    // Update session updated_at
    await supabase.from('ai_chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId)
  }
}

// ── GitHub Activity Service ───────────────────────────────────────────────────

export interface GitHubCommitItem {
  sha: string
  shortSha: string
  author: {
    name: string
    username?: string
    avatarUrl?: string
  }
  message: string
  date: string
  url: string
}

export interface GitHubPullRequestItem {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  isMerged: boolean
  author: string
  authorAvatar?: string
  url: string
  createdAt: string
  updatedAt: string
}

export interface GitHubContributorItem {
  name: string
  username?: string
  avatarUrl?: string
  commitCount: number
}

export interface GitHubActivityResult {
  success: boolean
  repo: string
  owner: string
  repoName: string
  defaultBranch: string
  description?: string
  stats: {
    commitsFetched: number
    openPrCount: number
    closedPrCount: number
    stars: number
    forks: number
  }
  latestCommit?: GitHubCommitItem
  commits: GitHubCommitItem[]
  pullRequests: GitHubPullRequestItem[]
  contributors: GitHubContributorItem[]
  error?: string
}

export async function fetchGitHubActivity(repoUrl: string, token?: string): Promise<GitHubActivityResult> {
  if (!repoUrl || !repoUrl.trim()) {
    return {
      success: false,
      repo: '',
      owner: '',
      repoName: '',
      defaultBranch: 'main',
      stats: { commitsFetched: 0, openPrCount: 0, closedPrCount: 0, stars: 0, forks: 0 },
      commits: [],
      pullRequests: [],
      contributors: [],
      error: 'No repository specified.'
    }
  }

  try {
    const res = await fetch(`${BACKEND_URL}/github/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        repoUrl: repoUrl.trim(), 
        token: token?.trim() || undefined
      }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => null)
      return {
        success: false,
        repo: repoUrl,
        owner: '',
        repoName: '',
        defaultBranch: 'main',
        stats: { commitsFetched: 0, openPrCount: 0, closedPrCount: 0, stars: 0, forks: 0 },
        commits: [],
        pullRequests: [],
        contributors: [],
        error: errData?.error || `GitHub request failed (${res.status})`
      }
    }
    return await res.json()
  } catch (err: any) {
    console.warn('[GitHub Activity API Error]:', err.message)
    return {
      success: false,
      repo: repoUrl,
      owner: '',
      repoName: '',
      defaultBranch: 'main',
      stats: { commitsFetched: 0, openPrCount: 0, closedPrCount: 0, stars: 0, forks: 0 },
      commits: [],
      pullRequests: [],
      contributors: [],
      error: err.message || 'Network error reaching backend'
    }
  }
}

