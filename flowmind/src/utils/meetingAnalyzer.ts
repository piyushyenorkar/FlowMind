// ─── Meeting Analyzer — Groq AI for transcript analysis ─────────────────────
import { groqChat } from '../services/api'

function buildMemberContext(attendees, memberProfiles) {
  return attendees.map(name => {
    const p = memberProfiles?.[name]
    if (p) {
      return `- ${name} | Title: ${p.title || 'N/A'} | Skills: ${(p.skills || []).join(', ')} | Experience: ${p.pastWork || 'N/A'} | Prefers: ${(p.preferredTypes || []).join(', ')} | Availability: ${p.availability || 'Available'}`
    }
    return `- ${name} | No profile set up yet`
  }).join('\n')
}

function buildTaskHistory(pastTasks) {
  if (!pastTasks?.length) return 'No previous tasks.'
  const done = pastTasks.filter(t => t.status === 'done').map(t => `${t.title} (${t.assignedTo})`).join(', ') || 'None'
  const inProg = pastTasks.filter(t => t.status === 'in-progress').map(t => `${t.title} (${t.assignedTo})`).join(', ') || 'None'
  return `Completed: ${done}\nIn Progress: ${inProg}`
}

function generateMock(attendees, memberProfiles) {
  const names = attendees.length > 0 ? attendees : ['Team Member']
  const tasks = names.slice(0, 3).map((name, i) => {
    const p = memberProfiles?.[name]
    const types = ['frontend', 'backend', 'design', 'research', 'testing', 'documentation']
    return {
      title: [`Set up project dashboard`, `Write API documentation`, `Design mobile layout`, `Create test suite`, `Build authentication flow`][i % 5],
      description: `Implement and deliver this task based on the meeting discussion.`,
      assignedTo: name,
      assignmentReason: p?.skills?.length
        ? `${name} has skills in ${p.skills.slice(0, 2).join(' and ')}, making them ideal for this task.`
        : `${name} was discussed in the meeting as the best fit for this task.`,
      estimatedHours: [4, 6, 3, 8, 5][i % 5],
      priority: ['high', 'medium', 'low'][i % 3],
      deadline: null,
      taskType: p?.preferredTypes?.[0] || types[i % types.length],
    }
  })

  return {
    summary: `The team discussed project progress and upcoming deliverables. Key areas covered include task assignments, timeline adjustments, and technical decisions. ${names.length} team members participated.`,
    keyTopics: ['Project Progress', 'Task Assignments', 'Timeline Review'],
    tasks,
    decisions: [{
      decision: 'Use the current tech stack for the next sprint',
      reason: 'The team agreed the existing tools are sufficient for upcoming features.',
      impact: 'medium',
      involvedPeople: names.slice(0, 2).join(', '),
    }],
    followUpItems: ['Review task progress in next meeting', 'Share updated designs by Friday'],
  }
}

export async function analyzeMeeting({ transcript, attendees, memberProfiles, pastTasks, pastDecisions }) {
  if (!transcript || transcript.trim().length < 20) {
    return generateMock(attendees, memberProfiles)
  }

  const memberContext = buildMemberContext(attendees, memberProfiles)
  const taskHistory = buildTaskHistory(pastTasks)

  const systemPrompt = `You are an expert AI project manager. Your job is to analyze meeting transcripts and intelligently assign tasks to team members.

You have access to each member's skill profile including their technical skills, past work experience, task type preferences, and current availability.

Assignment rules you MUST follow:
1. Match task type to member skills — if a task needs React, assign to someone with React in their skills
2. Respect availability — never assign multiple heavy tasks to someone marked as Busy
3. Prefer members whose preferredTypes match the task category
4. Look at past task history — prefer members who completed similar tasks successfully
5. Distribute work fairly — avoid giving everything to one person
6. If a member has no profile, you may still assign them tasks but note the uncertainty

Always return ONLY raw valid JSON. No markdown. No explanation. No text before or after the JSON object.`

  const userPrompt = `Analyze this meeting and extract all tasks and decisions.

MEETING TRANSCRIPT:
${transcript}

TEAM MEMBER PROFILES:
${memberContext}

PAST TASK HISTORY:
${taskHistory}

Return this exact JSON structure:
{
  "summary": "string — 3-4 sentence summary of what was discussed",
  "keyTopics": ["string", "string"],
  "tasks": [
    {
      "title": "string — clear actionable task title",
      "description": "string — detailed description of what to do",
      "assignedTo": "string — exact attendee name from the list",
      "assignmentReason": "string — one sentence explaining WHY this person was chosen based on their profile and skills",
      "estimatedHours": number,
      "priority": "high" or "medium" or "low",
      "deadline": "YYYY-MM-DD or null if not mentioned",
      "taskType": "frontend" or "backend" or "design" or "research" or "testing" or "documentation" or "other"
    }
  ],
  "decisions": [
    {
      "decision": "string — what was decided",
      "reason": "string — why this decision was made",
      "impact": "high" or "medium" or "low",
      "involvedPeople": "string — names comma separated"
    }
  ],
  "followUpItems": ["string — things to check on next meeting"]
}`

  try {
    const reply = await groqChat(
      [{ role: 'user', content: userPrompt }],
      systemPrompt
    )

    if (!reply) {
      console.warn('[MeetingAnalyzer] Groq returned null, using mock')
      return generateMock(attendees, memberProfiles)
    }

    const cleaned = reply.replace(/```json|```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(cleaned)
  } catch (err) {
    console.warn('[MeetingAnalyzer] Parse error, using mock:', err.message)
    return generateMock(attendees, memberProfiles)
  }
}
