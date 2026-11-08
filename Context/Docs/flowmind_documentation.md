# FlowMind — Complete HackHazards '26 Documentation Package

---

═══ DOCUMENT 1: PROJECT SUMMARY ═══

## The Problem

Every team project starts the same way: meetings happen, decisions are made, tasks are discussed — and then everything gets lost. Notes are forgotten. Action items fall through the cracks. Team members overloaded with work don't speak up. By the time anyone notices a bottleneck, the deadline has already passed. Traditional project management tools force you to *manually* log everything, which means nothing gets logged at all.

## The Solution

**FlowMind** is an AI-powered project management system that *listens to your meetings, remembers everything, and predicts problems before they happen.* It converts live voice conversations into auto-assigned tasks, builds a persistent knowledge graph of your team's relationships, skills, and workload, and uses that graph to detect bottlenecks and at-risk deliverables in real time.

## The Core Innovation

FlowMind combines **three layers of intelligence**: (1) Groq-powered LLM analysis that extracts tasks and decisions from meeting transcripts, (2) a **Neo4j knowledge graph** that maps every relationship between team members, tasks, meetings, and skills, and (3) **persistent memory** via Hindsight that recalls past conversations and patterns to inform future decisions.

## Impact

For student hackathon teams and professional squads alike, FlowMind eliminates the gap between "we talked about it" and "it actually got done." It ensures no task is orphaned, no decision is forgotten, and no team member is silently drowning.

> **FlowMind is the project manager that never sleeps, never forgets, and sees problems before your team does.**

---

═══ DOCUMENT 2: COMPLETE TECH STACK ═══

### Frontend

| Technology | Version | Purpose | Powers |
|---|---|---|---|
| **React** | ^18.2.0 | Core UI framework | All components, routing, state |
| **TypeScript** | ^6.0.3 | Type safety | Entire codebase typed |
| **Vite** | ^5.1.4 | Build tool & dev server | HMR, bundling, production builds |
| **@vitejs/plugin-react** | ^4.2.1 | React fast-refresh for Vite | Development experience |
| **Lucide React** | ^0.383.0 | Icon library | All UI icons across dashboard |
| **CSS Modules** | (built-in) | Scoped component styling | 15+ `.module.css` files |
| **Google Fonts (Poppins)** | CDN | Typography | Global font family |
| **OGL** | ^1.0.11 | WebGL 3D graphics library | Landing page visual effects |

### Backend & Database

| Technology | Version | Purpose | Powers |
|---|---|---|---|
| **Express** | ^5.2.1 | Backend REST API server | All API routes (`/api/*`) |
| **@supabase/supabase-js** | ^2.108.2 | PostgreSQL + Realtime | Primary database, live sync |
| **Supabase Realtime** | (included) | WebSocket subscriptions | Live meeting status, transcript broadcast |
| **CORS** | ^2.8.6 | Cross-origin middleware | Frontend ↔ Backend communication |
| **dotenv** | ^17.4.2 | Environment variables | Secret management |
| **tsx** | ^4.20.3 | TypeScript execution | Backend dev server (`tsx watch`) |

### Graph Database (Neo4j — Partner Track)

| Technology | Version | Purpose | Powers |
|---|---|---|---|
| **neo4j-driver** | ^6.2.0 | Official Neo4j JavaScript driver | All graph operations |
| **Neo4j Aura** | Cloud | Managed graph database instance | Persistent graph storage |

### AI & LLM

| Technology | Version | Purpose | Powers |
|---|---|---|---|
| **Groq API** | REST | Ultra-fast LLM inference | Meeting analysis, AI Insights, AI Chat |
| **Model: llama-3.3-70b-versatile** | — | Large language model | All AI reasoning |
| **Hindsight API** | REST | Persistent memory store | Team memory recall & retention |
| **agora-token** | ^2.0.5 | Agora token generation | Secure voice channel access |

### Voice & Audio

| Technology | Version | Purpose | Powers |
|---|---|---|---|
| **agora-rtc-sdk-ng** | ^4.24.5 | WebRTC voice SDK | Live voice rooms between participants |
| **Web Speech API** | (browser native) | Speech-to-text | Real-time transcript generation |

### Deployment

| Technology | Purpose | Configuration |
|---|---|---|
| **Vercel** | Frontend hosting | Auto-deploy from Git |
| **Render / Railway** | Backend hosting | Express server |
| **Neo4j Aura** | Graph DB hosting | Cloud-managed instance |
| **Supabase Cloud** | PostgreSQL hosting | Managed Supabase project |

### Environment Variables Required

**Frontend** (`.env` in `flowmind/`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BACKEND_URL=
VITE_AGORA_APP_ID=
```

**Backend** (`.env` in `backend/`):
```
GROQ_API_KEYS=           # Comma-separated, supports key rotation
HINDSIGHT_BASE_URL=
HINDSIGHT_API_KEY=
NEO4J_URI=
NEO4J_USERNAME=
NEO4J_PASSWORD=
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
PORT=5000
```

---

═══ DOCUMENT 3: COMPLETE ARCHITECTURE OVERVIEW ═══

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FLOWMIND FRONTEND                            │
│                     React + TypeScript + Vite                        │
│                                                                      │
│  ┌─────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐  ┌────────┐  │
│  │ Leader  │  │ Meetings  │  │  Tasks   │  │Decisn. │  │  Chat  │  │
│  │Overview │  │   Tab     │  │   Tab    │  │  Tab   │  │  Tab   │  │
│  └────┬────┘  └─────┬─────┘  └────┬─────┘  └───┬────┘  └───┬────┘  │
│       │             │              │             │           │       │
│       └─────────────┴──────────────┴─────────────┴───────────┘       │
│                              │                                       │
│                    ┌─────────┴─────────┐                             │
│                    │   AppContext.tsx   │    ← Central State Manager  │
│                    │   AuthContext.tsx  │    ← Auth Manager           │
│                    └─────────┬─────────┘                             │
│                              │                                       │
│              ┌───────────────┼──────────────┐                        │
│              │               │              │                        │
│       ┌──────┴──────┐ ┌─────┴─────┐ ┌──────┴──────┐                 │
│       │ supabase.ts │ │  api.ts   │ │ useAgora.ts │                  │
│       └──────┬──────┘ └─────┬─────┘ └──────┬──────┘                  │
└──────────────┼──────────────┼──────────────┼─────────────────────────┘
               │              │              │
               ▼              ▼              ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│    SUPABASE      │  │ EXPRESS BACKEND  │  │  AGORA.IO    │
│  (PostgreSQL +   │  │   server.ts      │  │  (WebRTC)    │
│   Realtime)      │  │                  │  │              │
│                  │  │  /api/groq/*     │  │  Voice       │
│  13 Tables       │  │  /api/neo4j/*    │  │  Channels    │
│  WebSocket Subs  │  │  /api/hindsight/*│  │  Token Gen   │
│  Broadcast Chans │  │  /api/agora/*    │  │              │
└──────────────────┘  └───────┬──────────┘  └──────────────┘
                              │
                     ┌────────┴────────┐
                     │                 │
              ┌──────┴──────┐  ┌───────┴───────┐
              │  GROQ API   │  │   NEO4J AURA  │
              │ llama-3.3   │  │  Graph DB     │
              │ 70b-versat. │  │               │
              │             │  │ Team─Member   │
              │ Meeting     │  │ Member─Task   │
              │ Analysis    │  │ Task─Team     │
              │ AI Insights │  │               │
              │ AI Chat     │  │ Cypher Queries│
              └─────────────┘  │ for Insights  │
                               └───────────────┘
```

### Layer Breakdown

**1. Frontend Layer** — All React components in `src/components/` and `src/pages/`
- **AppContext.tsx** — Single source of truth for all team state; handles Supabase CRUD, Neo4j sync calls, and Realtime subscriptions
- **AuthContext.tsx** — Supabase Auth (email/password), session persistence, global user profiles
- **supabase.ts** — Supabase client instantiation with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- **api.ts** — All backend API calls: `groqChat()`, `syncTeamToGraph()`, `syncMemberToGraph()`, `syncTaskToGraph()`, `fetchGraphInsights()`, `generateInsights()`, `retainMemory()`, `recallMemory()`, `sendChatMessage()`
- **useAgora.ts** — Custom React hook wrapping `agora-rtc-sdk-ng` for voice channel lifecycle

**2. Backend Layer** — Express server in `backend/server.ts`
- Proxies Groq API calls with **round-robin key rotation** across multiple API keys to handle rate limits
- Proxies Hindsight memory retain/recall
- Handles Neo4j graph mutations via `services/neo4j.ts`
- Generates Agora RTC tokens with `agora-token` library

**3. Database Layer** — Supabase PostgreSQL with 13 tables
- Real-time sync via `supabase.channel()` + `postgres_changes` listener
- Broadcast channels for live meeting transcript sharing between participants
- Polling fallback (every 5 seconds) to guarantee list updates

**4. Graph Layer** — Neo4j Aura via `neo4j-driver ^6.2.0`
- Three node types: `Team`, `Member`, `Task`
- Three relationship types: `BELONGS_TO`, `ASSIGNED_TO`
- Powers the AI Insights dashboard with Cypher-based bottleneck and workload queries

**5. AI Layer** — Groq (`llama-3.3-70b-versatile`)
- **Meeting Analyzer** (`meetingAnalyzer.ts`) — Converts transcript → structured JSON (tasks, decisions, summary)
- **AI Insights** (`api.ts → generateInsights()`) — Combines Neo4j graph data + Hindsight memory + team state → risk/bottleneck/recommendation JSON
- **AI Chat** (`api.ts → sendChatMessage()`) — Context-aware team chatbot

---

═══ DOCUMENT 4: CORE FEATURE IMPLEMENTATION ═══

### 1. LIVE VOICE MEETING ROOM (Agora)

**Files:** [useAgora.ts](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/hooks/useAgora.ts), [MeetingsTab.tsx](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/components/MeetingsTab.tsx) (lines 730–1100), [server.ts](file:///c:/Users/piyus/Downloads/flowmind/backend/server.ts) (lines 184–218)

**How it works:**
1. When a meeting starts, `useAgora(meeting.id, user.name, !initialMicOn)` creates an `AgoraRTCClient` with `{ mode: 'rtc', codec: 'vp8' }`
2. The hook fetches a secure RTC token from `GET /api/agora/token?channelName=<meetingId>&uid=<randomNumericUid>`. The backend generates this with `RtcTokenBuilder.buildTokenWithUid()` (1-hour expiry, `RtcRole.PUBLISHER`)
3. The client joins with `client.join(AGORA_APP_ID, channelName, token, uid)`, then creates a local microphone audio track optimized for voice: `AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: 'speech_standard' })`
4. Remote users are tracked via `user-published`, `user-unpublished`, and `user-left` events. Remote audio tracks are auto-played with `audioTrack.play()`
5. Mute uses `setMuted()` (not `setEnabled()`) to keep the track alive on the remote side while sending silence
6. Cleanup on unmount: tracks are stopped/closed, client leaves

**Key function:** `useAgora()` returns `{ join, leave, toggleMute, isMuted, isConnected, remoteUsers, error }`

---

### 2. REAL-TIME SPEECH TRANSCRIPTION

**Files:** [MeetingsTab.tsx](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/components/MeetingsTab.tsx) (lines 905–975)

**How it works:**
1. Uses `window.webkitSpeechRecognition` (or `SpeechRecognition`) with `continuous: true`, `interimResults: true`, `lang: 'en-US'`
2. On `recognition.onresult`: iterates from `event.resultIndex`, separating `isFinal` (committed text) from interim (gray preview text)
3. Final results are formatted as `"Speaker Name: transcribed text\n"` and appended to `finalTranscriptRef.current`
4. Each final line is broadcast to all meeting participants via Supabase Broadcast Channel: `channel.send({ type: 'broadcast', event: 'speech', payload: { text } })`
5. Receiving participants merge incoming lines into their local transcript only if the line doesn't already exist (deduplication)
6. The host (meeting leader) debounce-syncs the full transcript to the `meetings` table every 1.5 seconds
7. On `recognition.onend`: if `micStatus` is still `'listening'` and `stoppedByUserRef` is false, it auto-restarts (robust reconnection)

**Fallback:** If Web Speech API is unsupported, `micStatus` is set to `'unsupported'` and a manual note input UI is shown

---

### 3. AI MEETING ANALYSIS (Groq)

**Files:** [meetingAnalyzer.ts](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/utils/meetingAnalyzer.ts), [api.ts](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/services/api.ts) (lines 58–76), [server.ts](file:///c:/Users/piyus/Downloads/flowmind/backend/server.ts) (lines 86–134)

**System prompt (exact):**
```
You are an expert AI project manager. Your job is to analyze meeting transcripts 
and intelligently assign tasks to team members.

You have access to each member's skill profile including their technical skills, 
past work experience, task type preferences, and current availability.

Assignment rules you MUST follow:
1. Match task type to member skills — if a task needs React, assign to someone with React
2. Respect availability — never assign multiple heavy tasks to someone marked as Busy
3. Prefer members whose preferredTypes match the task category
4. Look at past task history — prefer members who completed similar tasks successfully
5. Distribute work fairly — avoid giving everything to one person
6. If a member has no profile, you may still assign them tasks but note the uncertainty

Always return ONLY raw valid JSON. No markdown. No explanation.
```

**Context injection:**
- `buildMemberContext()` creates a per-attendee profile string: `"- Name | Title: X | Skills: Y | Experience: Z | Prefers: W | Availability: V"`
- `buildTaskHistory()` summarizes completed and in-progress tasks
- Both are injected into the user prompt alongside the raw transcript

**Response parsing:**
1. Strip markdown fences: `reply.replace(/```json|```/g, '')`
2. Extract JSON object: `cleaned.match(/\{[\s\S]*\}/)`
3. `JSON.parse()` the match
4. Fallback: if Groq returns null or parse fails → `generateMock()` returns realistic placeholder data

**Model config:** `llama-3.3-70b-versatile`, `temperature: 0.7`, `max_completion_tokens: 1500`

**Key rotation:** Backend rotates through comma-separated `GROQ_API_KEYS` on 429 rate-limit errors

---

### 4. SUPABASE REAL-TIME SYNC

**Files:** [AppContext.tsx](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/context/AppContext.tsx) (lines 164–243), [supabase.ts](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/services/supabase.ts)

**Realtime subscriptions (in AppContext):**
- **Meetings channel:** `supabase.channel('meetings-channel')` listens on `postgres_changes` for `INSERT`/`UPDATE` on `meetings` table filtered by `team_code`
- **Teams channel:** `supabase.channel('teams-channel')` listens for `UPDATE` on `teams` table for project name and group chat name changes
- **Polling fallback:** Every 5 seconds, fetches all meetings for the team and compares IDs+statuses; only updates state if something changed

**Broadcast channels (in VoiceRoom):**
- `supabase.channel('room-<meetingId>')` with `broadcast: { ack: true }` for three event types:
  - `speech` — transcript lines between participants
  - `mic-status` — who is listening/muted
  - `user-left` — participant departure notifications

---

### 5. NEO4J KNOWLEDGE GRAPH

**Files:** [neo4j.ts](file:///c:/Users/piyus/Downloads/flowmind/backend/services/neo4j.ts), [api.ts](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/services/api.ts) (lines 80–129), [server.ts](file:///c:/Users/piyus/Downloads/flowmind/backend/server.ts) (lines 136–182)

**Graph Schema:**

```
(:Team {code, name, updatedAt})
(:Member {id, name, role, updatedAt})
(:Task {id, title, status, updatedAt})

(Member)-[:BELONGS_TO]->(Team)
(Task)-[:BELONGS_TO]->(Team)
(Member)-[:ASSIGNED_TO]->(Task)
```

**`mergeTeam(teamCode, name)`** — Cypher:
```cypher
MERGE (t:Team {code: $teamCode})
SET t.name = $name, t.updatedAt = datetime()
```

**`mergeMember(teamCode, memberId, name, role)`** — Cypher:
```cypher
MERGE (t:Team {code: $teamCode})
MERGE (m:Member {id: $memberId})
SET m.name = $name, m.role = $role, m.updatedAt = datetime()
MERGE (m)-[:BELONGS_TO]->(t)
```

**`mergeTask(teamCode, taskId, title, status, assignedTo)`** — Two-phase Cypher:
```cypher
-- Phase 1: Create/update task and link to team
MERGE (t:Team {code: $teamCode})
MERGE (task:Task {id: $taskId})
SET task.title = $title, task.status = $status, task.updatedAt = datetime()
MERGE (task)-[:BELONGS_TO]->(t)

-- Phase 2: Link assignee (separate query so missing member doesn't block task)
MATCH (m:Member {name: $assignedTo})-[:BELONGS_TO]->(:Team {code: $teamCode})
MATCH (task:Task {id: $taskId})
MERGE (m)-[:ASSIGNED_TO]->(task)
```

**`queryTeamGraph(teamCode)`** — Three Cypher queries for AI Insights:

**Query 1 — Member Workload Distribution:**
```cypher
MATCH (m:Member)-[:BELONGS_TO]->(:Team {code: $teamCode})
OPTIONAL MATCH (m)-[:ASSIGNED_TO]->(task:Task)-[:BELONGS_TO]->(:Team {code: $teamCode})
WITH m, collect(task) AS tasks, count(task) AS totalTasks
RETURN m.name AS name, m.role AS role, totalTasks,
       size([t IN tasks WHERE t.status = 'todo']) AS todoCount,
       size([t IN tasks WHERE t.status = 'in-progress']) AS inProgressCount,
       size([t IN tasks WHERE t.status = 'done']) AS doneCount,
       [t IN tasks | t.title] AS taskTitles
ORDER BY totalTasks DESC
```

**Query 2 — Task Chains (Bottleneck Detection):**
```cypher
MATCH (m:Member)-[:ASSIGNED_TO]->(task:Task)-[:BELONGS_TO]->(:Team {code: $teamCode})
WITH m, collect(task.title) AS tasks, collect(task.status) AS statuses
WHERE size(tasks) >= 2
RETURN m.name AS memberName, tasks, statuses
ORDER BY size(tasks) DESC
```

**Query 3 — Graph Statistics:**
```cypher
MATCH (n)-[:BELONGS_TO]->(:Team {code: $teamCode})
WITH count(n) AS nodes
OPTIONAL MATCH ()-[r]->()-[:BELONGS_TO]->(:Team {code: $teamCode})
RETURN nodes, count(r) AS rels
```

**Derived insights (server-side logic):**
- **Overloaded members:** `totalTasks > avgTasks * 1.5 && totalTasks >= 2`
- **Idle members:** `totalTasks === 0`
- All data is fed into Groq's `generateInsights()` prompt for natural language analysis

---

### 6. AI INSIGHTS DASHBOARD

**Files:** [LeaderOverview.tsx](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/components/LeaderOverview.tsx) (lines 224–332), [api.ts](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/services/api.ts) (lines 131–224)

**How it works:**
1. User clicks "Graph Insights" card → triggers `generateInsights(team.code, tasks, decisions, members)`
2. `generateInsights()` executes 3 parallel operations:
   - Recalls 4 memory queries from Hindsight (performance, risks, skills, meetings)
   - Fetches Neo4j graph data via `fetchGraphInsights(teamCode)`
   - Builds structured task/decision/member JSON
3. All context is injected into a massive system prompt that instructs Groq to:
   - Reference **actual** task names and member names
   - Calculate risk scores based on deadline proximity and workload
   - Identify patterns from memory — recurring issues, communication gaps
   - Heavily rely on Neo4j Graph Insights for bottleneck detection
4. The UI displays a 2×2 grid: **Graph Bottlenecks**, **AI Recommendation**, **Detected Risks**, with a "Regenerate" button

---

### 7. MEMBER SKILL PROFILES

**Files:** [MemberProfile.tsx](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/components/MemberProfile.tsx)

**Data stored per member:**
- `title` — Job/role title
- `skills` — Array of technical skills (from 28 predefined options with logos)
- `pastWork` — Past work experience text
- `availability` — Current availability status
- `preferredTypes` — Preferred task types (Frontend, Backend, Design, Research, Testing, Documentation)
- `photoUrl` — Profile photo

**How profiles influence AI:**
- `buildMemberContext()` in `meetingAnalyzer.ts` injects all profile data into the Groq prompt
- The AI uses skills matching, availability, and preferred types to auto-assign tasks
- Profiles stored in both `member_profiles` table (Supabase) and via Hindsight memory

---

### 8. TASK MANAGEMENT

**Files:** [AppContext.tsx](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/context/AppContext.tsx) (lines 441–557), [TasksTab.tsx](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/components/TasksTab.tsx)

- **Manual creation:** `addTask()` inserts into `tasks` table + syncs to Neo4j via `syncTaskToGraph()`
- **From meetings:** `handleConfirm()` in CreateFlow creates tasks from AI analysis with `addTask()` + `storeTask()` (Hindsight)
- **Status flow:** `todo` → `in-progress` → `done` via `updateTaskStatus()`, which also syncs to Neo4j
- **Updates:** `addTaskUpdate()` stores progress logs in `task_updates` table
- **Memory:** Every task creation and status change is logged to `memory_feed` and retained in Hindsight

---

### 9. DECISION LOG

**Files:** [DecisionsTab.tsx](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/components/DecisionsTab.tsx), [AppContext.tsx](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/context/AppContext.tsx) (lines 559–601)

- **From meetings:** AI extracts decisions with `decision`, `reason`, `impact`, `involvedPeople` fields
- **Manual creation:** Users can also log decisions directly
- **Storage:** Inserted into `decisions` table with `meeting_source` linking back to originating meeting
- **Memory:** Retained in Hindsight with: `Decision made: "X". Reason: Y. Impact level: Z. People involved: W.`

---

═══ DOCUMENT 5: NEO4J PARTNER TRACK DOCUMENTATION ═══

### Why Neo4j for FlowMind

A relational database stores *data*. A graph database stores *relationships*. FlowMind needs to answer questions like "Which member is overloaded?", "Which tasks create bottleneck chains?", and "How does workload distribution look across the team?" These are fundamentally **graph traversal problems**.

In PostgreSQL, detecting that Member A has 5 tasks while Member B has 0 requires multiple JOINs. In Neo4j, it's a single MATCH traversal across `(Member)-[:ASSIGNED_TO]->(Task)`. More importantly, Neo4j enables us to query *patterns* — like finding members who are bottleneck nodes because they're assigned to multiple interdependent tasks.

### Complete Graph Data Model

```
Node Labels:
  :Team    — Properties: code (PK), name, updatedAt
  :Member  — Properties: id (PK), name, role, updatedAt
  :Task    — Properties: id (PK), title, status, updatedAt

Relationship Types:
  (Member)-[:BELONGS_TO]->(Team)
  (Task)-[:BELONGS_TO]->(Team)
  (Member)-[:ASSIGNED_TO]->(Task)
```

### Every Cypher Query Used

**1. Team creation/update** (`mergeTeam`):
```cypher
MERGE (t:Team {code: $teamCode})
SET t.name = $name, t.updatedAt = datetime()
```

**2. Member creation + team link** (`mergeMember`):
```cypher
MERGE (t:Team {code: $teamCode})
MERGE (m:Member {id: $memberId})
SET m.name = $name, m.role = $role, m.updatedAt = datetime()
MERGE (m)-[:BELONGS_TO]->(t)
```

**3. Task creation + team link** (`mergeTask` — Phase 1):
```cypher
MERGE (t:Team {code: $teamCode})
MERGE (task:Task {id: $taskId})
SET task.title = $title, task.status = $status, task.updatedAt = datetime()
MERGE (task)-[:BELONGS_TO]->(t)
```

**4. Task assignment link** (`mergeTask` — Phase 2):
```cypher
MATCH (m:Member {name: $assignedTo})-[:BELONGS_TO]->(:Team {code: $teamCode})
MATCH (task:Task {id: $taskId})
MERGE (m)-[:ASSIGNED_TO]->(task)
```

**5. Workload distribution query** (`queryTeamGraph`):
```cypher
MATCH (m:Member)-[:BELONGS_TO]->(:Team {code: $teamCode})
OPTIONAL MATCH (m)-[:ASSIGNED_TO]->(task:Task)-[:BELONGS_TO]->(:Team {code: $teamCode})
WITH m, collect(task) AS tasks, count(task) AS totalTasks
RETURN m.name AS name, m.role AS role, totalTasks,
       size([t IN tasks WHERE t.status = 'todo']) AS todoCount,
       size([t IN tasks WHERE t.status = 'in-progress']) AS inProgressCount,
       size([t IN tasks WHERE t.status = 'done']) AS doneCount,
       [t IN tasks | t.title] AS taskTitles
ORDER BY totalTasks DESC
```

**6. Task chain detection** (bottleneck query):
```cypher
MATCH (m:Member)-[:ASSIGNED_TO]->(task:Task)-[:BELONGS_TO]->(:Team {code: $teamCode})
WITH m, collect(task.title) AS tasks, collect(task.status) AS statuses
WHERE size(tasks) >= 2
RETURN m.name AS memberName, tasks, statuses
ORDER BY size(tasks) DESC
```

**7. Graph statistics**:
```cypher
MATCH (n)-[:BELONGS_TO]->(:Team {code: $teamCode})
WITH count(n) AS nodes
OPTIONAL MATCH ()-[r]->()-[:BELONGS_TO]->(:Team {code: $teamCode})
RETURN nodes, count(r) AS rels
```

### Before Neo4j vs After Neo4j

| Capability | Without Neo4j | With Neo4j |
|---|---|---|
| Workload distribution | Manual SQL `GROUP BY` + `COUNT` + JOINs | Single traversal query |
| Bottleneck detection | Impossible without complex joins | `(m)-[:ASSIGNED_TO]->(task)` chain query |
| Idle member detection | Full table scan | Direct `WHERE totalTasks = 0` from graph |
| Relationship visualization | Not possible | Native graph relationships |
| AI context for insights | Only flat task data | Rich graph topology with workloads |

### How Neo4j Powers AI Insights

The `generateInsights()` function in `api.ts` passes the full `queryTeamGraph()` result into the Groq system prompt under the header `"NEO4J GRAPH INSIGHTS (Bottlenecks & Workload)"`. The prompt explicitly instructs the AI:

> *"For bottlenecks, heavily rely on the Neo4j Graph Insights. If someone is overloaded or tasks are chaining, point it out explicitly."*

This means Neo4j data directly drives the bottleneck cards, risk scores, and AI recommendations shown in the Graph Insights modal.

### Neo4j Aura Connection Setup

```typescript
import neo4j, { Driver } from 'neo4j-driver'

const driver: Driver = neo4j.driver(
  process.env.NEO4J_URI!,       // e.g., neo4j+s://xxxxx.databases.neo4j.io
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME!, // neo4j
    process.env.NEO4J_PASSWORD!  // Aura password
  )
)
```

Graceful shutdown on `SIGTERM`: `await driver.close()`

---

═══ DOCUMENT 6: SUPABASE DATABASE SCHEMA ═══

**Source:** [flowmind.sql](file:///c:/Users/piyus/Downloads/flowmind/SQL%20Schema/flowmind.sql)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE SCHEMA (13 TABLES)                  │
├─────────────────────────────────────────────────────────────────┤

 users
 ├── email TEXT (PK)
 ├── name TEXT NOT NULL
 ├── password_hash TEXT NOT NULL
 └── created_at TIMESTAMPTZ DEFAULT NOW()

 teams
 ├── code TEXT (PK)
 ├── project_name TEXT NOT NULL
 ├── description TEXT
 ├── deadline TEXT
 ├── leader_name TEXT NOT NULL
 ├── group_chat_name TEXT
 ├── created_by TEXT → users(email)
 └── created_at TIMESTAMPTZ DEFAULT NOW()

 user_teams (Join: User ↔ Team)
 ├── id UUID (PK)
 ├── user_email TEXT → users(email) ON DELETE CASCADE
 ├── team_code TEXT → teams(code) ON DELETE CASCADE
 ├── role TEXT NOT NULL
 ├── source TEXT NOT NULL
 ├── joined_at TIMESTAMPTZ DEFAULT NOW()
 └── UNIQUE(user_email, team_code)

 team_members
 ├── id TEXT (PK)
 ├── team_code TEXT → teams(code) ON DELETE CASCADE
 ├── name TEXT NOT NULL
 ├── role TEXT NOT NULL
 ├── is_leader BOOLEAN DEFAULT FALSE
 └── joined_at TIMESTAMPTZ DEFAULT NOW()

 tasks
 ├── id TEXT (PK)
 ├── team_code TEXT → teams(code) ON DELETE CASCADE
 ├── title TEXT NOT NULL
 ├── description TEXT
 ├── assigned_to TEXT
 ├── status TEXT DEFAULT 'todo'
 ├── estimated_hours NUMERIC DEFAULT 0
 ├── actual_hours NUMERIC DEFAULT 0
 ├── deadline TEXT
 ├── priority TEXT
 ├── task_type TEXT
 ├── assignment_reason TEXT
 ├── meeting_source TEXT
 └── created_at TIMESTAMPTZ DEFAULT NOW()

 task_updates
 ├── id UUID (PK)
 ├── task_id TEXT → tasks(id) ON DELETE CASCADE
 ├── text TEXT NOT NULL
 ├── author TEXT NOT NULL
 └── timestamp TIMESTAMPTZ DEFAULT NOW()

 decisions
 ├── id TEXT (PK)
 ├── team_code TEXT → teams(code) ON DELETE CASCADE
 ├── decision TEXT NOT NULL
 ├── reason TEXT
 ├── impact TEXT
 ├── involved_people TEXT
 ├── meeting_source TEXT
 └── created_at TIMESTAMPTZ DEFAULT NOW()

 meetings
 ├── id TEXT (PK)
 ├── team_code TEXT → teams(code) ON DELETE CASCADE
 ├── title TEXT NOT NULL
 ├── date TEXT
 ├── attendees JSONB
 ├── leader TEXT
 ├── agenda TEXT
 ├── duration NUMERIC DEFAULT 0
 ├── summary TEXT
 ├── key_topics JSONB
 ├── transcript TEXT
 ├── follow_up_items JSONB
 ├── status TEXT DEFAULT 'completed'
 ├── active_attendees JSONB DEFAULT '[]'
 ├── memory_stored BOOLEAN DEFAULT TRUE
 └── analyzed_at TIMESTAMPTZ DEFAULT NOW()

 member_profiles
 ├── id UUID (PK)
 ├── team_code TEXT → teams(code) ON DELETE CASCADE
 ├── member_name TEXT NOT NULL
 ├── profile_data JSONB
 └── UNIQUE(team_code, member_name)

 memory_feed
 ├── id TEXT (PK)
 ├── team_code TEXT → teams(code) ON DELETE CASCADE
 ├── type TEXT NOT NULL
 ├── text TEXT NOT NULL
 ├── icon TEXT
 ├── meta JSONB
 └── timestamp TIMESTAMPTZ DEFAULT NOW()

 group_chats
 ├── id UUID (PK)
 ├── team_code TEXT → teams(code) ON DELETE CASCADE
 ├── from_name TEXT NOT NULL
 ├── text TEXT NOT NULL
 └── timestamp TIMESTAMPTZ DEFAULT NOW()

 direct_chats
 ├── id UUID (PK)
 ├── chat_key TEXT NOT NULL
 ├── from_name TEXT NOT NULL
 ├── text TEXT NOT NULL
 └── timestamp TIMESTAMPTZ DEFAULT NOW()

 applications
 ├── id TEXT (PK)
 ├── team_code TEXT → teams(code) ON DELETE CASCADE
 ├── team_name TEXT
 ├── applicant_email TEXT → users(email)
 ├── applicant_name TEXT NOT NULL
 ├── applied_role TEXT DEFAULT 'pending'
 ├── status TEXT DEFAULT 'pending'
 └── created_at TIMESTAMPTZ DEFAULT NOW()

 application_chats
 ├── id UUID (PK)
 ├── application_id TEXT → applications(id) ON DELETE CASCADE
 ├── from_email TEXT
 ├── from_name TEXT NOT NULL
 ├── text TEXT NOT NULL
 └── timestamp TIMESTAMPTZ DEFAULT NOW()

 team_chat_reads
 ├── team_code TEXT → teams(code) ON DELETE CASCADE
 ├── user_name TEXT NOT NULL
 ├── last_read_timestamp TIMESTAMPTZ DEFAULT NOW()
 └── PRIMARY KEY (team_code, user_name)
```

**RLS:** ALL tables have `ROW LEVEL SECURITY DISABLED` (hackathon/MVP mode)

---

═══ DOCUMENT 7: GROQ AI IMPLEMENTATION DETAILS ═══

### Model

`llama-3.3-70b-versatile` — Used for all three AI features

### Call 1: Meeting Analysis (`meetingAnalyzer.ts`)
- **Temperature:** 0.7
- **Max tokens:** 1500
- **System prompt:** Expert AI project manager with 6 strict assignment rules (skill matching, availability, fair distribution)
- **Context:** Attendee profiles + past task history + full transcript
- **Response:** JSON with `summary`, `keyTopics`, `tasks[]`, `decisions[]`, `followUpItems[]`
- **Fallback:** `generateMock()` returns realistic placeholder data with profile-based assignment reasons

### Call 2: AI Insights (`api.ts → generateInsights()`)
- **Temperature:** 0.7
- **Max tokens:** 3000
- **System prompt:** "FlowMind AI — a project intelligence engine" with instructions to use Neo4j graph data, Hindsight memory, and real team data
- **Context:** Team stats + Neo4j `queryTeamGraph()` result (JSON) + Task/Decision/Member data + 4 Hindsight memory recall queries (capped at 4000 chars)
- **Response:** JSON with `risks[]`, `patterns[]`, `bottlenecks[]`, `recommendation`

### Call 3: AI Chat (`api.ts → sendChatMessage()`)
- **Temperature:** 0.7 (default)
- **Max tokens:** 1500 (default)
- **System prompt:** "FlowMind AI, an intelligent project assistant" with team context, recent activity, recalled memories
- **Context:** Last 8 conversation messages + Hindsight recall for the user's query
- **Response:** Free-form text response

### Error Handling
- All three calls: if Groq returns `null`, return `null` and let the UI handle it gracefully
- JSON parsing: strip markdown fences → regex extract `{...}` → `JSON.parse()` → catch and warn
- Key rotation: backend cycles through `GROQ_API_KEYS` on 429 rate limits

---

═══ DOCUMENT 8: AGORA VOICE IMPLEMENTATION ═══

**Files:** [useAgora.ts](file:///c:/Users/piyus/Downloads/flowmind/flowmind/src/hooks/useAgora.ts), [server.ts](file:///c:/Users/piyus/Downloads/flowmind/backend/server.ts) (lines 184–218)

### SDK & Setup
- `agora-rtc-sdk-ng ^4.24.5` — Next-generation Agora Web SDK
- Log level set to `3` (warning only) via `AgoraRTC.setLogLevel(3)`
- Client mode: `rtc` (1:1 and small group), codec: `vp8`

### Channel naming
- Channel name = `meeting.id` (e.g., `meeting_1720123456789`)

### Token handling
- Backend generates tokens with `RtcTokenBuilder.buildTokenWithUid()`
- Token expiry: 3600 seconds (1 hour)
- Role: `RtcRole.PUBLISHER` (can both send and receive audio)
- Fallback: if token fetch fails, tries App ID-only join (testing mode)

### UID strategy
- Random numeric UID per session: `Math.floor(Math.random() * 1000000) + 1`
- Prevents `UID_CONFLICT` errors when same user reconnects

### Participant management
- `user-published` → subscribe + play remote audio track
- `user-unpublished` → mark user as muted (remove audio track reference)
- `user-left` → remove user from `remoteUsers` array

### Audio track config
- `encoderConfig: 'speech_standard'` — optimized for voice, not music
- Mute: `localAudioTrack.setMuted(true/false)` — keeps track alive, sends silence

### Edge cases handled
- Double-join prevention: `joinedRef.current` flag checked before every join
- Connection state tracking: `connection-state-change` event updates `isConnected`
- Cleanup on unmount: tracks stopped/closed, client leaves
- Auto-join: `useEffect` triggers join when `meetingState === 'active'`

---

═══ DOCUMENT 9: CHALLENGES & SOLUTIONS ═══

### Challenge 1: Agora UID Conflicts on Reconnection
**Problem:** When a user left and rejoined a voice room, Agora threw `UID_CONFLICT` errors because the same UID was already registered.
**Solution:** Generate a random numeric UID per session (`Math.floor(Math.random() * 1000000) + 1`) instead of using a deterministic mapping. Since FlowMind maps participants by name via Supabase broadcast (not by Agora UID), this has zero impact on the UI.

### Challenge 2: Speech Recognition Auto-Stopping
**Problem:** Chrome's `webkitSpeechRecognition` silently stops after ~60 seconds of silence or intermittent network issues. Users thought the mic was still on but no text was captured.
**Solution:** Implemented a declarative `useEffect` that monitors `micStatus`. On `recognition.onend`, if `micStatus` is still `'listening'` and the user hasn't manually stopped, it immediately creates a new `SpeechRecognition` instance and restarts. This makes speech recognition effectively "always-on."

### Challenge 3: Real-time Transcript Sync Between Participants
**Problem:** Multiple participants each run their own speech recognition. Transcripts diverge and overwrite each other in the database.
**Solution:** Used **Supabase Broadcast Channels** (not postgres_changes) for real-time transcript sharing. Each participant broadcasts their final lines. Recipients merge lines with deduplication (checking if the line already exists locally). Only the host syncs the canonical transcript to the database (debounced at 1.5s).

### Challenge 4: Groq Rate Limiting During Hackathon
**Problem:** With a single Groq API key, rate limits would kill the meeting analysis feature under load.
**Solution:** Backend supports comma-separated `GROQ_API_KEYS` and implements **round-robin rotation** — on a 429 error, it automatically tries the next key. The `currentGroqKeyIndex` variable persists the last successful key to minimize unnecessary rotation.

### Challenge 5: Host Ending Meeting While Other Participants Are Still in the Voice Room
**Problem:** When the host clicked "End Meeting & Analyze," the host's meeting status changed to `completed` in Supabase. A Realtime subscription on `meeting.status` would then auto-kick all participants (including the host) before the analysis could complete.
**Solution:** The auto-exit `useEffect` now fires on `meeting.status === 'completed'` but the host's own flow goes through `handleEndMeeting()` which transitions to Step 3 (analysis screen) before the status update. Participants see a graceful "Meeting ended by host" experience.

---

═══ DOCUMENT 10: DEVFOLIO SUBMISSION CONTENT ═══

### A) PROJECT DESCRIPTION (500 words)

**FlowMind — The AI Project Manager That Never Forgets**

Every team has experienced it: a productive meeting ends, everyone feels aligned, and then... nothing happens. The tasks discussed never get created. The decisions made are forgotten by next week. The developer who's drowning in work never speaks up. By the time anyone notices, the deadline is tomorrow.

FlowMind solves this by becoming your team's **persistent, intelligent project manager**. It doesn't just record meetings — it *understands* them, *remembers* everything, and *predicts* problems before they happen.

**How it works:** Team leaders create a project and invite members (via a simple team code). Each member builds a skill profile — their technical stack, preferred task types, and availability. When the team holds a meeting, FlowMind provides a **live voice room powered by Agora SDK** where everyone can speak and hear each other in real-time.

As the meeting happens, FlowMind's **Web Speech API integration** transcribes the entire conversation live, broadcasting it across all participants via Supabase Realtime. When the meeting ends, the transcript is sent to **Groq's llama-3.3-70b-versatile** model, which has been injected with every team member's skill profile and past task history.

The AI doesn't just summarize — it **extracts actionable tasks and auto-assigns them** to the most qualified team member based on their skills, availability, and track record. It logs decisions with reasoning and impact levels. Every task, decision, meeting, and member relationship is simultaneously synced to a **Neo4j knowledge graph**, creating a living map of how work flows through the team.

This graph is not decorative. FlowMind's **Graph Insights** feature runs Cypher queries to detect **workload bottlenecks** (members with disproportionately many tasks), **idle resources** (members with zero tasks), and **task chains** (patterns where one overloaded member blocks multiple deliverables). These graph results are combined with recalled memories from past meetings and fed back into Groq to generate **specific, actionable AI recommendations** like: *"Reassign 'Build auth flow' from Raj to Priya — Raj has 4 active tasks and Priya's React skills match this task type."*

The result is a project management system that grows smarter with every interaction, never loses context, and proactively surfaces the risks that humans miss.

**Tech stack:** React + TypeScript (Vite), Supabase PostgreSQL + Realtime, Neo4j Aura (graph DB), Groq API (LLM), Agora SDK (WebRTC voice), Web Speech API, Express backend, deployed on Vercel.

**Partner Track:** Neo4j — FlowMind uses Neo4j as the backbone of its intelligence layer, powering workload analysis, bottleneck detection, and AI-driven recommendations through native Cypher traversal queries.

🔗 **Live Demo:** [flowwithmind.vercel.app](https://flowwithmind.vercel.app)

---

### B) WHAT IT DOES (150 words)

FlowMind is an AI-powered project management platform that listens to your team meetings and automatically extracts tasks, decisions, and action items. It uses Agora SDK for live voice rooms, Web Speech API for real-time transcription, and Groq AI to analyze transcripts and intelligently assign tasks based on each member's skill profile. Every entity — teams, members, tasks — is synced to a Neo4j knowledge graph that detects workload bottlenecks and idle resources. The AI Insights dashboard combines graph traversal data with persistent team memory to generate specific risk assessments and actionable recommendations. Everything syncs in real-time via Supabase Realtime, so the entire team sees updates instantly. FlowMind transforms the "we talked about it" problem into "it's already assigned, tracked, and being monitored."

---

### C) HOW WE BUILT IT (200 words)

We started with React + TypeScript on Vite for the frontend, using CSS Modules for a premium glassmorphism design. Supabase PostgreSQL was chosen as our primary database for its built-in Realtime subscriptions, which we leverage for live meeting status updates and transcript broadcasting between participants.

For voice communication, we integrated Agora SDK (agora-rtc-sdk-ng) with a custom React hook (`useAgora`) that manages channel joining, audio track lifecycle, and mute state. Speech-to-text uses the browser's native Web Speech API with automatic reconnection on timeout.

Our Express backend acts as a secure proxy for three external services: Groq API (with multi-key rotation for rate limit resilience), Hindsight (persistent memory), and Neo4j (graph database). The Neo4j integration was built with the official `neo4j-driver` using MERGE-based Cypher queries that idempotently sync teams, members, and tasks with their relationships.

The AI Insights feature was the most complex — it combines Neo4j workload distribution queries, 4 Hindsight memory recall queries, and structured team data into a single Groq prompt that generates bottleneck analysis and recommendations.

Deployed on Vercel (frontend) with the backend on a separate server.

---

### D) CHALLENGES WE RAN INTO (150 words)

**Real-time transcript sync** was our biggest challenge. Multiple participants each run their own speech recognition, producing divergent transcripts. We solved this with Supabase Broadcast Channels — each participant broadcasts final speech lines, and recipients merge them with line-level deduplication.

**Agora UID conflicts** occurred when users reconnected to voice rooms. We fixed this by generating random numeric UIDs per session instead of deterministic mappings.

**Groq rate limits** during testing threatened our core meeting analysis feature. We implemented round-robin API key rotation in the backend, automatically cycling to the next key on 429 errors.

**Browser speech recognition** silently stops after ~60 seconds of silence. We built an auto-restart mechanism that detects unexpected stops and immediately creates a new recognition instance, making it effectively "always-on."

---

### E) ACCOMPLISHMENTS WE'RE PROUD OF (100 words)

The moment we held a real meeting through FlowMind, ended it, and watched the AI extract tasks and assign them to the right people based on their actual skill profiles — that was magical. Seeing Neo4j's graph bottleneck detection correctly identify that one team member was overloaded while another was idle, and watching the AI recommendation suggest a specific task reassignment — that proved the concept works. Building a full voice communication system with Agora that actually lets teammates hear each other in real-time was deeply satisfying.

---

### F) WHAT WE LEARNED (100 words)

Graph databases fundamentally change what questions you can ask about your data. The bottleneck detection that Neo4j enables with a single Cypher traversal would require complex multi-table JOINs in SQL. We learned that Supabase Broadcast Channels are more reliable than postgres_changes for high-frequency real-time data like speech transcripts. We also learned the importance of fallback strategies — mock data when Groq is slow, auto-restart when speech recognition stops, key rotation when rate limits hit.

---

### G) WHAT'S NEXT (100 words)

**Short-term:** Meeting scheduling with calendar integration, task dependency tracking in Neo4j (creating `DEPENDS_ON` relationships between tasks), and a mobile-responsive design.

**Medium-term:** Automatic conflict prediction using the knowledge graph ("Priya can't attend this meeting — she has a conflicting task deadline"), and sprint velocity tracking stored as graph metrics.

**Long-term:** FlowMind becomes a self-improving PM — the more meetings it processes, the better it understands each team member's strengths, predicts delivery timelines, and suggests optimal team compositions for new projects.

---

═══ DOCUMENT 11: GITHUB README ═══

```markdown
# FlowMind 🧠

[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-2.108-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Neo4j](https://img.shields.io/badge/Neo4j-6.2-008CC1?logo=neo4j&logoColor=white)](https://neo4j.com)
[![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b-F55036)](https://groq.com)
[![Agora](https://img.shields.io/badge/Agora-4.24-099DFD)](https://agora.io)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)](https://flowwithmind.vercel.app)

> **The AI project manager that learns your team and predicts failures before they happen.**

🔗 **Live Demo:** [flowwithmind.vercel.app](https://flowwithmind.vercel.app)

## What is FlowMind?

FlowMind is an AI-powered project management platform that listens to your 
meetings, auto-assigns tasks based on member skills, and uses a Neo4j knowledge 
graph to detect bottlenecks before they derail your project.

## ✨ Features

- 🎤 **Live Voice Meetings** — Agora SDK WebRTC voice rooms
- 📝 **Real-time Transcription** — Web Speech API with auto-reconnect
- 🤖 **AI Meeting Analysis** — Groq LLM extracts tasks & decisions from transcripts
- 🧠 **Smart Task Assignment** — AI matches tasks to members based on skill profiles
- 🕸️ **Neo4j Knowledge Graph** — Maps team relationships, detects bottlenecks
- 📊 **AI Insights Dashboard** — Graph-powered bottleneck & risk detection
- ⚡ **Real-time Sync** — Supabase Realtime for instant updates across all members
- 💬 **AI Chat Assistant** — Context-aware team chatbot with memory
- 👥 **Team Management** — Skill profiles, DMs, group chat, applications

## 🏗️ Architecture

(See DOCUMENT 3 above for ASCII diagram)

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | CSS Modules + Poppins font |
| Database | Supabase (PostgreSQL + Realtime) |
| Graph DB | Neo4j Aura (neo4j-driver ^6.2.0) |
| AI | Groq API (llama-3.3-70b-versatile) |
| Voice | Agora SDK (agora-rtc-sdk-ng ^4.24.5) |
| Speech | Web Speech API (browser native) |
| Backend | Express ^5.2.1 |
| Deploy | Vercel (frontend) |

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- Supabase project
- Neo4j Aura instance
- Groq API key
- Agora.io account

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/flowmind.git
cd flowmind

# Frontend
cd flowmind
npm install

# Backend
cd ../backend
npm install
```

### 2. Environment Variables

**Frontend** (`flowmind/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:5000
VITE_AGORA_APP_ID=your-agora-app-id
```

**Backend** (`backend/.env`):
```env
GROQ_API_KEYS=key1,key2
HINDSIGHT_BASE_URL=https://your-hindsight-url
HINDSIGHT_API_KEY=your-hindsight-key
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-cert
PORT=5000
```

### 3. Supabase Setup
Run `SQL Schema/flowmind.sql` in the Supabase SQL Editor.

### 4. Neo4j Setup
Create a free Neo4j Aura instance at [neo4j.com/aura](https://neo4j.com/cloud/aura). Copy the connection URI, username, and password.

### 5. Run Locally
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd flowmind
npm run dev
```

## 👥 Team

Built for HackHazards '26.

## 📄 License

MIT
```

---

═══ DOCUMENT 12: PRESENTATION SLIDE OUTLINE ═══

### Slide 1: Title
**Headline:** FlowMind — The AI Project Manager That Never Forgets
**Bullets:**
- Built for HackHazards '26
- Theme: Human Experience & Productivity
- Partner Track: Neo4j
- Live at flowwithmind.vercel.app

**Visual:** FlowMind logo + tagline on dark gradient
**Speaker notes:** "Hi everyone, we're Team [X], and we built FlowMind — an AI project manager that listens to your meetings, remembers everything, and predicts failures before they happen."

---

### Slide 2: The Problem
**Headline:** Meetings Happen. Tasks Disappear.
**Bullets:**
- 73% of action items from meetings are never completed (Harvard Business Review)
- Manual task logging has near-zero adoption in real teams
- Bottlenecks are invisible until deadlines pass
- No tool connects WHO said WHAT to WHO should DO it

**Visual:** Before/after split — chaotic sticky notes vs. FlowMind dashboard
**Speaker notes:** "Every team has this problem. You have a great meeting, everyone agrees on what to do, and then nobody does it. Because the gap between talking and tracking is manual — and manual means it doesn't happen."

---

### Slide 3: The Solution
**Headline:** FlowMind Listens, Learns, and Leads
**Bullets:**
- Live voice meetings with real-time AI transcription
- AI extracts tasks and auto-assigns based on skill profiles
- Neo4j knowledge graph maps team relationships
- Predicts bottlenecks and suggests fixes

**Visual:** Product screenshot — meeting → analysis → tasks board
**Speaker notes:** "FlowMind closes the loop. You talk, it listens. It extracts every task and decision from the transcript. It knows your team's skills, so it assigns the right work to the right person. And it watches for bottlenecks using a Neo4j knowledge graph."

---

### Slide 4: Architecture
**Headline:** How It's Built
**Bullets:**
- React + Supabase Realtime for instant sync
- Agora SDK for live voice communication
- Groq LLM for transcript analysis
- Neo4j Aura for relationship intelligence

**Visual:** Architecture diagram (from Document 3)
**Speaker notes:** "Here's the architecture. The frontend is React with TypeScript. Supabase handles our database and real-time sync. Agora gives us WebRTC voice rooms. Groq processes our transcripts at lightning speed. And Neo4j is our intelligence layer — it maps every relationship between team members and tasks."

---

### Slide 5: Live Demo — Voice Meeting + AI Analysis
**Headline:** Watch It Work
**Bullets:**
- Create a meeting → Pre-join mic toggle → Live voice room
- Real-time speech-to-text transcription
- End meeting → AI analysis (3-second processing)
- Tasks auto-created and assigned with reasons

**Visual:** Screen recording of the full meeting → analysis flow
**Speaker notes:** "Let me show you what happens. I start a meeting, invite my team, and we talk. The transcript builds in real time. When I end the meeting, Groq analyzes everything in about 3 seconds and extracts tasks. Look — it assigned this React task to Priya because she has React in her skill profile. It even explains why."

---

### Slide 6: Neo4j — The Memory Layer
**Headline:** A Graph That Sees What You Can't
**Bullets:**
- Every team, member, and task is a node
- BELONGS_TO and ASSIGNED_TO relationships
- Cypher queries detect overloaded and idle members
- Task chains reveal bottleneck patterns

**Visual:** Neo4j graph visualization with Team → Member → Task relationships
**Speaker notes:** "This is our Neo4j graph. Every time someone joins a team or a task is assigned, it's synced here. The magic is in the queries — we can instantly see that Raj has 5 tasks while Dev has zero. We can trace task chains to find bottlenecks. This is something a flat SQL database simply cannot do naturally."

---

### Slide 7: AI Insights — The Crystal Ball
**Headline:** Predict Failures Before They Happen
**Bullets:**
- Graph Bottlenecks: Who is blocking progress?
- Detected Risks: Which tasks are at risk and why?
- AI Recommendation: Specific, actionable paragraph
- Powered by Neo4j data + Hindsight memory + Groq AI

**Visual:** Graph Insights modal screenshot showing bottlenecks + recommendation
**Speaker notes:** "The AI Insights dashboard combines Neo4j graph data with Groq AI. It tells you things like: 'Raj is overloaded — he has 4 tasks while Priya has 0. Reassign Build Auth Flow to Priya based on her React skills.' This is specific, actionable intelligence that no other tool gives you."

---

### Slide 8: Tech Stack
**Headline:** Built With
**Bullets:**
- Frontend: React 18 + TypeScript + Vite
- Database: Supabase PostgreSQL + Realtime
- Graph: Neo4j Aura (neo4j-driver ^6.2.0)
- AI: Groq (llama-3.3-70b-versatile)

**Visual:** Tech logos in a clean grid layout
**Speaker notes:** "Here's our full stack. React and TypeScript on the frontend. Supabase for our primary database with real-time subscriptions. Neo4j Aura as our graph database — this is our Partner Track submission. Groq for ultra-fast AI inference. And Agora for WebRTC voice."

---

### Slide 9: Impact & Use Cases
**Headline:** Who Needs FlowMind?
**Bullets:**
- Hackathon teams: auto-assign tasks during kickoff meetings
- University project groups: track who said they'd do what
- Startup teams: detect bottlenecks before sprint ends
- Remote teams: voice + transcript + AI in one place

**Visual:** Three personas with their pain points solved
**Speaker notes:** "FlowMind isn't just a hackathon project. Think about every team meeting you've been in where tasks were discussed but never tracked. FlowMind solves that for hackathon teams, university groups, startups, and remote teams."

---

### Slide 10: Demo + Links
**Headline:** Try It Now
**Bullets:**
- 🔗 Live: flowwithmind.vercel.app
- 📦 GitHub: [repo link]
- 🎯 Partner Track: Neo4j
- 👥 Team: [names]

**Visual:** QR code to live demo + team photos
**Speaker notes:** "FlowMind is live right now. You can create a team, invite your friends, hold a meeting, and watch the AI do its thing. Thank you — we'd love to answer any questions."

---

═══ SUBMISSION CHECKLIST ═══

| Item | Status | Notes |
|---|---|---|
| Live deployed URL | ✅ | flowwithmind.vercel.app |
| GitHub repository | ✅ | Contains full codebase |
| Working demo | ✅ | Full flow functional |
| Supabase database connected | ✅ | 13 tables, Realtime active |
| Neo4j Partner Track integration | ✅ | 3 node types, 7 Cypher queries, AI Insights |
| Agora voice rooms working | ✅ | Multi-participant audio confirmed |
| Groq AI meeting analysis | ✅ | Transcript → tasks + decisions |
| Speech-to-text transcription | ✅ | Web Speech API with auto-restart |
| AI Insights dashboard | ✅ | Neo4j-powered bottleneck detection |
| Project description (Devfolio) | ✅ | Generated in Document 10 |
| README.md | ✅ | Generated in Document 11 |
| Presentation slides | ✅ | 10-slide outline in Document 12 |
| Team section | ⚠️ | Team member names needed |
| Demo video | ⚠️ | Needs recording |
| Screenshots | ⚠️ | Needs capture from live app |
