// ─── FlowMind Backend — Neo4j Graph Service ────────────────────────────────────
import neo4j, { Driver } from 'neo4j-driver'

const driver: Driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
)

// ── Team ────────────────────────────────────────────────────────────────────────

export async function mergeTeam(teamCode: string, name: string): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      `MERGE (t:Team {code: $teamCode})
       SET t.name = $name, t.updatedAt = datetime()`,
      { teamCode, name }
    )
  } finally {
    await session.close()
  }
}

// ── Member ──────────────────────────────────────────────────────────────────────

export async function mergeMember(
  teamCode: string,
  memberId: string,
  name: string,
  role: string
): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      `MERGE (t:Team {code: $teamCode})
       MERGE (m:Member {id: $memberId})
       SET m.name = $name, m.role = $role, m.updatedAt = datetime()
       MERGE (m)-[:BELONGS_TO]->(t)`,
      { teamCode, memberId, name, role }
    )
  } finally {
    await session.close()
  }
}

// ── Task ────────────────────────────────────────────────────────────────────────
// assignedTo is the member's display name (not an ID), so we match on name.

export async function mergeTask(
  teamCode: string,
  taskId: string,
  title: string,
  status: string,
  assignedTo: string
): Promise<void> {
  const session = driver.session()
  try {
    // Always create / update the task node and link it to the team
    await session.run(
      `MERGE (t:Team {code: $teamCode})
       MERGE (task:Task {id: $taskId})
       SET task.title = $title, task.status = $status, task.updatedAt = datetime()
       MERGE (task)-[:BELONGS_TO]->(t)`,
      { teamCode, taskId, title, status }
    )

    // Link the assignee (by name) if they exist — this is a separate query
    // so a missing member doesn't prevent the task from being created
    if (assignedTo) {
      await session.run(
        `MATCH (m:Member {name: $assignedTo})-[:BELONGS_TO]->(:Team {code: $teamCode})
         MATCH (task:Task {id: $taskId})
         MERGE (m)-[:ASSIGNED_TO]->(task)`,
        { teamCode, taskId, assignedTo }
      )
    }
  } finally {
    await session.close()
  }
}

// ── Graph Insight Queries ────────────────────────────────────────────────────────

export interface MemberWorkload {
  name: string
  role: string
  totalTasks: number
  todoCount: number
  inProgressCount: number
  doneCount: number
  taskTitles: string[]
}

export interface TaskChain {
  memberName: string
  tasks: string[]
  statuses: string[]
}

export interface GraphInsightData {
  memberWorkloads: MemberWorkload[]
  taskChains: TaskChain[]
  overloadedMembers: string[]
  idleMembers: string[]
  totalNodes: number
  totalRelationships: number
}

export async function queryTeamGraph(teamCode: string): Promise<GraphInsightData> {
  const session = driver.session()
  try {
    // 1. Member workload distribution
    const workloadResult = await session.run(
      `MATCH (m:Member)-[:BELONGS_TO]->(:Team {code: $teamCode})
       OPTIONAL MATCH (m)-[:ASSIGNED_TO]->(task:Task)-[:BELONGS_TO]->(:Team {code: $teamCode})
       WITH m,
            collect(task) AS tasks,
            count(task) AS totalTasks
       RETURN m.name AS name,
              m.role AS role,
              totalTasks,
              size([t IN tasks WHERE t.status = 'todo']) AS todoCount,
              size([t IN tasks WHERE t.status = 'in-progress']) AS inProgressCount,
              size([t IN tasks WHERE t.status = 'done']) AS doneCount,
              [t IN tasks | t.title] AS taskTitles
       ORDER BY totalTasks DESC`,
      { teamCode }
    )

    const memberWorkloads: MemberWorkload[] = workloadResult.records.map(r => ({
      name: r.get('name'),
      role: r.get('role'),
      totalTasks: (r.get('totalTasks') as any).toNumber?.() ?? r.get('totalTasks'),
      todoCount: (r.get('todoCount') as any).toNumber?.() ?? r.get('todoCount'),
      inProgressCount: (r.get('inProgressCount') as any).toNumber?.() ?? r.get('inProgressCount'),
      doneCount: (r.get('doneCount') as any).toNumber?.() ?? r.get('doneCount'),
      taskTitles: r.get('taskTitles'),
    }))

    // 2. Task chains: members who share multiple tasks (potential bottlenecks)
    const chainResult = await session.run(
      `MATCH (m:Member)-[:ASSIGNED_TO]->(task:Task)-[:BELONGS_TO]->(:Team {code: $teamCode})
       WITH m, collect(task.title) AS tasks, collect(task.status) AS statuses
       WHERE size(tasks) >= 2
       RETURN m.name AS memberName, tasks, statuses
       ORDER BY size(tasks) DESC`,
      { teamCode }
    )

    const taskChains: TaskChain[] = chainResult.records.map(r => ({
      memberName: r.get('memberName'),
      tasks: r.get('tasks'),
      statuses: r.get('statuses'),
    }))

    // 3. Graph stats
    const statsResult = await session.run(
      `MATCH (n)-[:BELONGS_TO]->(:Team {code: $teamCode})
       WITH count(n) AS nodes
       OPTIONAL MATCH ()-[r]->()-[:BELONGS_TO]->(:Team {code: $teamCode})
       RETURN nodes, count(r) AS rels`,
      { teamCode }
    )

    const totalNodes = statsResult.records.length > 0
      ? ((statsResult.records[0].get('nodes') as any).toNumber?.() ?? 0)
      : 0
    const totalRelationships = statsResult.records.length > 0
      ? ((statsResult.records[0].get('rels') as any).toNumber?.() ?? 0)
      : 0

    // Derive overloaded and idle members
    const avgTasks = memberWorkloads.length > 0
      ? memberWorkloads.reduce((sum, m) => sum + m.totalTasks, 0) / memberWorkloads.length
      : 0

    const overloadedMembers = memberWorkloads
      .filter(m => m.totalTasks > avgTasks * 1.5 && m.totalTasks >= 2)
      .map(m => m.name)

    const idleMembers = memberWorkloads
      .filter(m => m.totalTasks === 0)
      .map(m => m.name)

    return {
      memberWorkloads,
      taskChains,
      overloadedMembers,
      idleMembers,
      totalNodes,
      totalRelationships,
    }
  } finally {
    await session.close()
  }
}

// ── Graceful shutdown ───────────────────────────────────────────────────────────

export async function closeDriver(): Promise<void> {
  await driver.close()
}

export { driver }
