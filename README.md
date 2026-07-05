<div align="center">
  <img src="flowmind/src/assets/flowmind.png" alt="Flowmind Logo" height="100"/>
  
  <h1>🧠 FlowMind — The PM That Never Forgets</h1>
  
  <p><strong>The AI project manager that learns your team and predicts failures before they happen.</strong></p>
  
  <p>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white" alt="React"></a>
    <a href="https://typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
    <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-2.108-3ECF8E?logo=supabase&logoColor=white" alt="Supabase"></a>
    <a href="https://neo4j.com"><img src="https://img.shields.io/badge/Neo4j-6.2-008CC1?logo=neo4j&logoColor=white" alt="Neo4j"></a>
    <a href="https://groq.com"><img src="https://img.shields.io/badge/Groq-llama--3.3--70b-F55036" alt="Groq"></a>
    <a href="https://agora.io"><img src="https://img.shields.io/badge/Agora-4.24-099DFD" alt="Agora"></a>
    <a href="https://flowwithmind.vercel.app"><img src="https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white" alt="Deployed on Vercel"></a>
  </p>

  <p>
    🔗 <b>Live Demo:</b> <a href="https://flowwithmind.vercel.app">flowwithmind.vercel.app</a>
  </p>
</div>

<hr/>

## 📖 What is FlowMind?

**FlowMind** is an AI-powered project management platform that listens to your meetings, auto-assigns tasks based on member skills, and uses a **Neo4j knowledge graph** to detect bottlenecks before they derail your project.

Every team has experienced it: a productive meeting ends, everyone feels aligned, and then nothing happens. FlowMind solves this by becoming your team's persistent, intelligent project manager. It records meetings using live voice rooms, transcribes them in real-time, extracts actionable items, and monitors workload via a knowledge graph.

---

## ✨ Features

- 🎤 **Live Voice Meetings** — Agora SDK WebRTC voice rooms for real-time team collaboration
- 📝 **Real-time Transcription** — Web Speech API with auto-reconnect capability
- 🤖 **AI Meeting Analysis** — Groq LLM automatically extracts tasks & decisions from transcripts
- 🧠 **Smart Task Assignment** — AI matches tasks to members based on individual skill profiles
- 🕸️ **Neo4j Knowledge Graph** — Maps team relationships, tracks workloads, and detects bottlenecks
- 📊 **AI Insights Dashboard** — Graph-powered bottleneck & risk detection
- ⚡ **Real-time Sync** — Supabase Realtime for instant updates across all members
- 💬 **AI Chat Assistant** — Context-aware team chatbot with memory
- 👥 **Team Management** — Skill profiles, DMs, group chat, applications

---

## 🏗️ Architecture

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
              │ Meeting     │  │ Member─Task   │
              │ Analysis    │  │ Task─Team     │
              │ AI Insights │  │               │
              │ AI Chat     │  │ Cypher Queries│
              └─────────────┘  │ for Insights  │
                               └───────────────┘
```

---

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

---

## 🚀 Setup & Installation

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

### 3. Supabase Setup
Run `SQL Schema/flowmind.sql` in the Supabase SQL Editor.

### 4. Neo4j Setup
Create a free Neo4j Aura instance at [neo4j.com/aura](https://neo4j.com/cloud/aura). Copy the connection URI, username, and password into your backend environment variables.

### 5. Run Locally
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd flowmind
npm run dev
```

---

## 👥 Team

Built for **HackHazards '26** by **Team Starcy**:
- Piyush (Leader)
- Debashree

---

## 📄 License

MIT
