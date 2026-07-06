// ─── FlowMind API Service Layer ────────────────────────────────────────────────
// Routes through the backend server for secure API key handling and Neo4j integration

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000') + '/api'

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

  // Step 3: Build structured data
  const taskData = tasks.map(t => ({
    title: t.title, assignedTo: t.assignedTo, status: t.status, deadline: t.deadline || 'not set', estimatedHours: t.estimatedHours || 0, createdAt: t.createdAt,
  }))
  const decisionData = decisions.map(d => ({
    decision: d.decision, reason: d.reason, impact: d.impact, involvedPeople: d.involvedPeople,
  }))
  const memberData = members.map(m => ({
    name: m.name, role: m.role, isLeader: m.isLeader,
  }))

  const systemPrompt = `You are FlowMind AI — a project intelligence engine. You analyze REAL team data stored in FlowMind Memory and Neo4j Graph Database to surface actionable insights.

CRITICAL: Your analysis must be SPECIFIC to this team. Use actual task names, member names, deadlines, and memory context. Do NOT generate generic insights.

TEAM DATA:
• ${tasks.length} tasks: ${tasks.filter(t => t.status === 'done').length} done, ${tasks.filter(t => t.status === 'in-progress').length} in-progress, ${tasks.filter(t => t.status === 'todo').length} todo
• ${decisions.length} decisions logged
• ${members.length} team members: ${members.map(m => m.name).join(', ')}

NEO4J GRAPH INSIGHTS (Bottlenecks & Workload):
${JSON.stringify(graphData)}

TASKS:
${JSON.stringify(taskData.slice(0, 50))}
DECISIONS:
${JSON.stringify(decisionData)}
MEMBERS:
${JSON.stringify(memberData)}

FLOWMIND MEMORY (past events, conversations, patterns):
${memoryContext.substring(0, 2000)}

RULES:
1. Reference ACTUAL task names and member names from the data above
2. Calculate risk scores based on deadline proximity, workload, and memory patterns
3. Identify patterns from the FlowMind Memory — recurring issues, communication gaps, workload imbalances
4. For bottlenecks, heavily rely on the Neo4j Graph Insights. If someone is overloaded or tasks are chaining, point it out explicitly ("Task A is delayed, which is connected to Member Raj, who is also assigned to Task B, creating a bottleneck").
5. Recommendation must be a specific, actionable paragraph referencing real data

Respond with ONLY valid JSON, no markdown, no explanation:
{
  "risks": [{"member": "real name", "task": "real task title", "risk": 0-100, "reason": "specific explanation from data"}],
  "patterns": [{"icon": "emoji", "title": "Pattern Name", "detail": "specific detail from memory"}],
  "bottlenecks": [{"task": "real task title", "person": "real name", "waiting": days_number, "graph_insight": "Detailed explanation using Graph data"}],
  "recommendation": "Specific actionable recommendation paragraph"
}
Provide 2-4 items per category.`

  try {
    const reply = await groqChat([{ role: 'user', content: 'Analyze this team data and FlowMind Memory.' }], systemPrompt, { maxTokens: 1000 })
    if (!reply) return null

    const cleaned = reply.replace(/```json|```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.risks && parsed.patterns) return parsed
    }
    return JSON.parse(cleaned)
  } catch (err: any) {
    console.warn('[Insights] Failed to parse Groq response:', err.message)
    return null
  }
}

/**
 * Send a chat message using recalled Hindsight memories + Groq
 */
export async function sendChatMessage(teamCode: string, userMessage: string, context: any, conversationHistory: any[]) {
  const recalled = await recallMemory(teamCode, userMessage)
  const memoryContext = recalled ? JSON.stringify(recalled).substring(0, 2000) : 'No specific memories found.'

  const systemPrompt = `You are FlowMind AI, an intelligent project assistant with access to FlowMind Memory.
Team context:
- ${context.tasks?.length || 0} tasks (${context.tasks?.filter((t: any) => t.status === 'done')?.length || 0} done)
- ${context.decisions?.length || 0} decisions logged
- ${context.members?.length || 0} team members active
- Recent activity: ${context.memoryFeed?.slice(0, 5).map((m: any) => m.text).join('; ') || 'None'}

FlowMind Memory Recall: ${memoryContext}
Tasks: ${JSON.stringify(context.tasks?.map((t: any) => ({ title: t.title, assignedTo: t.assignedTo, status: t.status })) || [])}
Decisions: ${JSON.stringify(context.decisions?.map((d: any) => ({ decision: d.decision, impact: d.impact })) || [])}

Rules:
- Be concise but helpful
- Reference specific tasks, decisions, and team members by name when relevant
- Use **bold** for emphasis
- When you provide crucial insights, warnings, or very important information, you MUST proactively highlight it by starting the line with "> Note:" or "> Important:".
- Base your answers on the actual data and FlowMind Memories provided`

  const messages = conversationHistory
    .filter(m => m.role && m.text)
    .slice(-8)
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))

  messages.push({ role: 'user', content: userMessage })

  const reply = await groqChat(messages, systemPrompt)
  return reply || "I've searched FlowMind Memory for context on your question."
}
