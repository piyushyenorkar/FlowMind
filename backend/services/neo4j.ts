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

// ── Graceful shutdown ───────────────────────────────────────────────────────────

export async function closeDriver(): Promise<void> {
  await driver.close()
}

export { driver }
