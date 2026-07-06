<div align="center">
  <img src="flowmind/src/assets/flowmind.png" alt="Flowmind Logo" height="100"/>
  
  <h1>FlowMind — The PM That Never Forgets</h1>
  
  <p><strong>The AI project manager that learns your team and predicts failures before they happen.</strong></p>
  
  <p>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white" alt="React"></a>
    <a href="https://typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
    <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-2.108-3ECF8E?logo=supabase&logoColor=white" alt="Supabase"></a>
    <a href="https://neo4j.com"><img src="https://img.shields.io/badge/Neo4j-6.2-008CC1?logo=neo4j&logoColor=white" alt="Neo4j"></a>
    <a href="https://groq.com"><img src="https://img.shields.io/badge/Groq-llama--3.3--70b-F55036" alt="Groq"></a>
    <a href="https://agora.io"><img src="https://img.shields.io/badge/Agora-4.24-099DFD" alt="Agora"></a>
    <a href="https://flowwithmind.vercel.app"><img src="https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white" alt="Deployed on Vercel"></a>
    <a href="https://render.com"><img src="https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white" alt="Render Backend"></a>
  </p>

  <p>
    <b>Live Demo:</b> <a href="https://flowwithmind.vercel.app">flowwithmind.vercel.app</a>
  </p>
</div>

<hr/>

<div align="center">

## <img src="https://unpkg.com/lucide-static@0.419.0/icons/book-open.svg" width="24" height="24" /> What is FlowMind?

**FlowMind** is an AI-powered project management platform that listens to your meetings, auto-assigns tasks based on member skills, and uses a **Neo4j knowledge graph** to detect bottlenecks before they derail your project.

Every team has experienced it: a productive meeting ends, everyone feels aligned, and then nothing happens. FlowMind solves this by becoming your team's persistent, intelligent project manager. It records meetings using live voice rooms, transcribes them in real-time, extracts actionable items, and monitors workload via a knowledge graph.

<br/>

## <img src="https://unpkg.com/lucide-static@0.419.0/icons/sparkles.svg" width="24" height="24" /> Features

**Live Voice Meetings** — Agora SDK WebRTC voice rooms for real-time team collaboration<br/>
**Real-time Transcription** — Web Speech API with auto-reconnect capability<br/>
**AI Meeting Analysis** — Groq LLM automatically extracts tasks & decisions from transcripts<br/>
**Smart Task Assignment** — AI matches tasks to members based on individual skill profiles<br/>
**Neo4j Knowledge Graph** — Maps team relationships, tracks workloads, and detects bottlenecks<br/>
**AI Insights Dashboard** — Graph-powered bottleneck & risk detection<br/>
**Real-time Sync** — Supabase Realtime for instant updates across all members<br/>
**AI Chat Assistant** — Context-aware team chatbot with memory<br/>
**Team Management** — Skill profiles, DMs, group chat, applications

<br/>

## <img src="https://unpkg.com/lucide-static@0.419.0/icons/network.svg" width="24" height="24" /> Architecture

```text
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
              │ Member─Task │  │ Task─Team     │
              │ AI Insights │  │               │
              │ AI Chat     │  │ Cypher Queries│
              └─────────────┘  │ for Insights  │
                               └───────────────┘
```

<br/>

## <img src="https://unpkg.com/lucide-static@0.419.0/icons/layers.svg" width="24" height="24" /> Tech Stack

<br/>

<table>
  <tr>
    <td align="center" width="25%">
      <img src="https://skillicons.dev/icons?i=react,ts,vite" /><br/>
      <b>Frontend</b><br/>React 18 + TS + Vite
    </td>
    <td align="center" width="25%">
      <img src="https://skillicons.dev/icons?i=supabase,postgres" /><br/>
      <b>Database</b><br/>Supabase (Realtime)
    </td>
    <td align="center" width="25%">
      <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Neo4j-logo.png" width="90" /><br/>
      <b>Graph Database</b><br/>Neo4j Aura
    </td>
    <td align="center" width="25%">
      <img src="https://skillicons.dev/icons?i=express,nodejs" /><br/>
      <b>Backend</b><br/>Express.js + Node.js
    </td>
  </tr>
  <tr>
    <td align="center" width="25%">
      <img src="https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge" /><br/>
      <b>Artificial Intelligence</b><br/>Groq Fast Inference
    </td>
    <td align="center" width="25%">
      <img src="https://img.shields.io/badge/Agora-WebRTC-099DFD?style=for-the-badge" /><br/>
      <b>Voice & WebRTC</b><br/>Agora.io SDK
    </td>
    <td align="center" width="25%">
      <img src="https://skillicons.dev/icons?i=vercel" /><br/>
      <b>Frontend Hosting</b><br/>Vercel
    </td>
    <td align="center" width="25%">
      <img src="https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=white" /><br/>
      <b>Backend Hosting</b><br/>Render
    </td>
  </tr>
</table>

<br/>

## <img src="https://unpkg.com/lucide-static@0.419.0/icons/terminal.svg" width="24" height="24" /> Setup & Installation

</div>

### Prerequisites
- Node.js 18+
- Supabase project
- Neo4j Aura instance
- Groq API key
- Agora.io account

### 1. Clone & Install
```bash
git clone https://github.com/piyushyenorkar/FlowMind.git
cd FlowMind

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

### 3. Neo4j Setup
Create a free Neo4j Aura instance at [neo4j.com/aura](https://neo4j.com/cloud/aura). Copy the connection URI, username, and password into your backend environment variables.

### 4. Run Locally
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd flowmind
npm run dev
```

---

<div align="center">

## <img src="https://unpkg.com/lucide-static@0.419.0/icons/users.svg" width="24" height="24" /> Team

Built for **HackHazards '26** by **Team Starcy**:
- Piyush (Leader)
- Debashree

<br/>

## <img src="https://unpkg.com/lucide-static@0.419.0/icons/file-text.svg" width="24" height="24" /> License

MIT

</div>
