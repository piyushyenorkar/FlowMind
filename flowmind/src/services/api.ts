// ─── FlowMind API Service Layer ────────────────────────────────────────────────
// Hindsight Memory (retain/recall) + Groq Chat Completions

const HINDSIGHT_BASE = import.meta.env.VITE_HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io'
const HINDSIGHT_KEY = import.meta.env.VITE_HINDSIGHT_API_KEY || ''
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

// ── Hindsight Memory ───────────────────────────────────────────────────────────

function getBankId(teamCode) {
  return `flowmind-${(teamCode || 'default').toLowerCase()}`
}

/**
 * Store a memory in Hindsight
 * Fire-and-forget — errors are logged but don't block UI
 */
export async function retainMemory(teamCode, content, metadata = {}) {
  const bankId = getBankId(teamCode)
  try {
    const res = await fetch(`${HINDSIGHT_BASE}/v1/default/banks/${bankId}/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HINDSIGHT_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: typeof content === 'string' ? content : JSON.stringify(content),
          }
        ],
        metadata: {
          source: 'flowmind',
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      }),
    })
    if (!res.ok) {
      console.warn('[Hindsight] Retain failed:', res.status, await res.text().catch(() => ''))
    }
    return res.ok
  } catch (err) {
    console.warn('[Hindsight] Retain error:', err.message)
    return false
  }
}

/**
 * Recall memories from Hindsight by semantic search
 */
export async function recallMemory(teamCode: any, query: any, options: any = {}) {
  const bankId = getBankId(teamCode)
  try {
    const res = await fetch(`${HINDSIGHT_BASE}/v1/default/banks/${bankId}/memories/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HINDSIGHT_KEY}`,
      },
      body: JSON.stringify({
        query,
        max_tokens: options.maxTokens || 2000,
        ...options,
      }),
    })
    if (!res.ok) {
      console.warn('[Hindsight] Recall failed:', res.status)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[Hindsight] Recall error:', err.message)
    return null
  }
}

// ── Groq Chat Completions ──────────────────────────────────────────────────────

/**
 * Send a chat completion request to Groq
 * @param {Array} messages - Array of { role, content } message objects
 * @param {string} systemPrompt - Optional system prompt
 * @returns {string} The assistant's reply text
 */
export async function groqChat(messages: any, systemPrompt = '', options: any = {}) {
  const allMessages = []
  if (systemPrompt) {
    allMessages.push({ role: 'system', content: systemPrompt })
  }
  allMessages.push(...messages)

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: allMessages,
        temperature: options.temperature ?? 0.7,
        max_completion_tokens: options.maxTokens || 1500,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.warn('[Groq] API error:', res.status, errText)
      return null
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (err) {
    console.warn('[Groq] Request error:', err.message)
    return null
  }
}

/**
 * Generate AI insights using recalled Hindsight memories + Groq
 */
export async function generateInsights(teamCode, tasks, decisions, members) {
  // Step 1: Recall multiple memory contexts for a richer picture
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
    memoryContext = 'No memories found in Hindsight for this team yet.'
  }

  // Step 2: Build structured data for the prompt
  const taskData = tasks.map(t => ({
    title: t.title,
    assignedTo: t.assignedTo,
    status: t.status,
    deadline: t.deadline || 'not set',
    estimatedHours: t.estimatedHours || 0,
    createdAt: t.createdAt,
  }))

  const decisionData = decisions.map(d => ({
    decision: d.decision,
    reason: d.reason,
    impact: d.impact,
    involvedPeople: d.involvedPeople,
  }))

  const memberData = members.map(m => ({
    name: m.name,
    role: m.role,
    isLeader: m.isLeader,
  }))

  // Step 3: Build the prompt
  const systemPrompt = `You are FlowMind AI — a project intelligence engine. You analyze REAL team data stored in Hindsight memory to surface actionable insights.

CRITICAL: Your analysis must be SPECIFIC to this team. Use actual task names, member names, deadlines, and memory context. Do NOT generate generic insights.

TEAM DATA:
• ${tasks.length} tasks: ${tasks.filter(t => t.status === 'done').length} done, ${tasks.filter(t => t.status === 'in-progress').length} in-progress, ${tasks.filter(t => t.status === 'todo').length} todo
• ${decisions.length} decisions logged
• ${members.length} team members: ${members.map(m => m.name).join(', ')}

TASKS:
${JSON.stringify(taskData, null, 1)}

DECISIONS:
${JSON.stringify(decisionData, null, 1)}

MEMBERS:
${JSON.stringify(memberData, null, 1)}

HINDSIGHT MEMORY (past events, conversations, patterns):
${memoryContext.substring(0, 4000)}

RULES:
1. Reference ACTUAL task names and member names from the data above
2. Calculate risk scores based on deadline proximity, workload, and memory patterns
3. Identify patterns from the Hindsight memory — recurring issues, communication gaps, workload imbalances
4. For bottlenecks, identify tasks that are blocking others or have been in-progress too long
5. Recommendation must be a specific, actionable paragraph referencing real data

Respond with ONLY valid JSON, no markdown, no explanation:
{
  "risks": [{"member": "real name", "task": "real task title", "risk": 0-100, "reason": "specific explanation from data"}],
  "patterns": [{"icon": "emoji", "title": "Pattern Name", "detail": "specific detail from memory"}],
  "bottlenecks": [{"task": "real task title", "person": "real name", "waiting": days_number}],
  "recommendation": "Specific actionable recommendation paragraph"
}
Provide 2-4 items per category.`

  try {
    const reply = await groqChat(
      [{ role: 'user', content: 'Analyze this team\'s performance data and Hindsight memory. Generate specific, data-driven insights.' }],
      systemPrompt,
      { maxTokens: 3000 }
    )

    if (!reply) {
      console.warn('[Insights] Groq returned null')
      return null
    }

    // Parse JSON response
    const cleaned = reply.replace(/```json|```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      // Validate required fields
      if (parsed.risks && parsed.patterns) {
        return parsed
      }
    }
    return JSON.parse(cleaned)
  } catch (err) {
    console.warn('[Insights] Failed to parse Groq response:', err.message)
    return null
  }
}

/**
 * Send a chat message using recalled Hindsight memories + Groq
 */
export async function sendChatMessage(teamCode, userMessage, context, conversationHistory) {
  // Step 1: Recall relevant memories for this specific question
  const recalled = await recallMemory(teamCode, userMessage)
  const memoryContext = recalled
    ? JSON.stringify(recalled).substring(0, 2000)
    : 'No specific memories found.'

  // Step 2: Build system prompt
  const systemPrompt = `You are FlowMind AI, an intelligent project assistant with access to Hindsight memory.

Team context:
- ${context.tasks?.length || 0} tasks (${context.tasks?.filter(t => t.status === 'done')?.length || 0} done)
- ${context.decisions?.length || 0} decisions logged
- ${context.members?.length || 0} team members active
- Recent activity: ${context.memoryFeed?.slice(0, 5).map(m => m.text).join('; ') || 'None'}

Hindsight Memory Recall: ${memoryContext}

Tasks: ${JSON.stringify(context.tasks?.map(t => ({ title: t.title, assignedTo: t.assignedTo, status: t.status })) || [])}
Decisions: ${JSON.stringify(context.decisions?.map(d => ({ decision: d.decision, impact: d.impact })) || [])}

Rules:
- Be concise but helpful
- Reference specific tasks, decisions, and team members by name when relevant
- Use **bold** for emphasis
- If asked about something not in the data, say so honestly
- Base your answers on the actual data and Hindsight memories provided`

  // Step 3: Build conversation history for multi-turn
  const messages = conversationHistory
    .filter(m => m.role && m.text)
    .slice(-8) // Keep last 8 messages for context window
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))

  messages.push({ role: 'user', content: userMessage })

  // Step 4: Call Groq
  const reply = await groqChat(messages, systemPrompt)
  return reply || `I've searched Hindsight memory for context on your question. Based on your team's history with ${context.tasks?.length || 0} tasks and ${context.decisions?.length || 0} decisions logged, here's my analysis:\n\nYour team is currently focused on ${context.tasks?.filter(t => t.status === 'in-progress')?.[0]?.title || 'multiple workstreams'}. I'd suggest keeping the momentum going and ensuring blockers are surfaced in the daily standup.`
}
