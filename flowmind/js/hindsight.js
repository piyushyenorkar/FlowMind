// ============================================================
//  FlowMind — Hindsight Memory Service
//  All interactions with Vectorize Hindsight API
// ============================================================

import CONFIG from "./config.js";

const BASE = CONFIG.HINDSIGHT_BASE_URL;
const KEY = CONFIG.HINDSIGHT_API_KEY;

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${KEY}`,
});

// ── Store a memory event ─────────────────────────────────────
export async function storeMemory({ type, content, metadata = {} }) {
  try {
    const body = {
      content,
      metadata: {
        type,
        project: metadata.project || "flowmind",
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
    const res = await fetch(`${BASE}/memories`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Hindsight store failed: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn("[Hindsight] storeMemory failed, running offline:", err.message);
    return null;
  }
}

// ── Recall memories (semantic search) ────────────────────────
export async function recallMemory({ query, limit = 10, filters = {} }) {
  try {
    const body = {
      query,
      limit,
      filters,
    };
    const res = await fetch(`${BASE}/memories/search`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Hindsight recall failed: ${res.status}`);
    const data = await res.json();
    return data.results || data.memories || [];
  } catch (err) {
    console.warn("[Hindsight] recallMemory failed, running offline:", err.message);
    return [];
  }
}

// ── Store task assigned ──────────────────────────────────────
export async function memTaskAssigned(task, projectName) {
  return storeMemory({
    type: "task_assigned",
    content: `Task "${task.title}" was assigned to ${task.assignee}. Deadline: ${task.deadline}. Estimated hours: ${task.hours}h.`,
    metadata: {
      project: projectName,
      task_id: task.id,
      assignee: task.assignee,
      task_title: task.title,
    },
  });
}

// ── Store task status update ─────────────────────────────────
export async function memTaskUpdated(task, updateText, projectName) {
  return storeMemory({
    type: "task_update",
    content: `${task.assignee} updated task "${task.title}": ${updateText}. Current status: ${task.status}.`,
    metadata: {
      project: projectName,
      task_id: task.id,
      assignee: task.assignee,
      status: task.status,
    },
  });
}

// ── Store task completed ─────────────────────────────────────
export async function memTaskCompleted(task, projectName) {
  return storeMemory({
    type: "task_completed",
    content: `${task.assignee} completed task "${task.title}". Estimated: ${task.hours}h.`,
    metadata: {
      project: projectName,
      task_id: task.id,
      assignee: task.assignee,
    },
  });
}

// ── Store a decision ─────────────────────────────────────────
export async function memDecisionLogged(decision, projectName) {
  return storeMemory({
    type: "decision_made",
    content: `Decision: "${decision.text}". Reason: ${decision.why}. Made by: ${decision.who}.`,
    metadata: {
      project: projectName,
      decision_id: decision.id,
      made_by: decision.who,
    },
  });
}

// ── Store meeting summary ────────────────────────────────────
export async function memMeetingSummary(summary, projectName) {
  return storeMemory({
    type: "meeting_summary",
    content: `Meeting summary: ${summary}`,
    metadata: {
      project: projectName,
    },
  });
}

// ── Store AI risk flag ───────────────────────────────────────
export async function memRiskFlagged(description, projectName) {
  return storeMemory({
    type: "risk_flagged",
    content: `Risk detected: ${description}`,
    metadata: {
      project: projectName,
    },
  });
}

// ── Recall context for AI Assistant ───────────────────────────────
export async function recallForChat(query, projectName) {
  const results = await recallMemory({
    query,
    limit: 12,
    filters: { project: projectName },
  });
  if (!results.length) return "";
  return results
    .map((r) => `[${r.metadata?.type || "memory"}] ${r.content}`)
    .join("\n");
}
