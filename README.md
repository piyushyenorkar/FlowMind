<img src="flowmind/src/assets/readmelogo/wave_top.svg" width="100%"/>
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
    <br/>
    <a href="https://flowwithmind.vercel.app"><img src="https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white" alt="Deployed on Vercel"></a>
    <a href="https://render.com"><img src="https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white" alt="Render Backend"></a>
  </p>

  <p>
    <b>Live Demo:</b> <a href="https://flowwithmind.vercel.app">flowwithmind.vercel.app</a>
  </p>
</div>

<hr/>

<div align="center">

## <img src="https://img.icons8.com/fluency/48/open-book.png" width="32" height="32" align="center" /> What is FlowMind?

**FlowMind** is an AI-powered project management platform that listens to your meetings, auto-assigns tasks based on member skills, and uses a **Neo4j knowledge graph** to detect bottlenecks before they derail your project.

Every team has experienced it: a productive meeting ends, everyone feels aligned, and then nothing happens. FlowMind solves this by becoming your team's persistent, intelligent project manager. It records meetings using live voice rooms, transcribes them in real-time, extracts actionable items, and monitors workload via a knowledge graph.

<br/>

## <img src="https://img.icons8.com/fluency/48/rocket.png" width="32" height="32" align="center" /> Features

<table align="center">
  <tr>
    <td align="left"><img src="https://img.icons8.com/fluency/48/microphone.png" width="20" align="absmiddle"/> <b>Live Voice Meetings</b> — Agora SDK WebRTC voice rooms for real-time team collaboration</td>
  </tr>
  <tr>
    <td align="left"><img src="https://img.icons8.com/fluency/48/audio-wave.png" width="20" align="absmiddle"/> <b>Real-time Transcription</b> — Web Speech API with auto-reconnect capability</td>
  </tr>
  <tr>
    <td align="left"><img src="https://img.icons8.com/fluency/48/artificial-intelligence.png" width="20" align="absmiddle"/> <b>AI Meeting Analysis</b> — Groq LLM automatically extracts tasks & decisions from transcripts</td>
  </tr>
  <tr>
    <td align="left"><img src="https://img.icons8.com/fluency/48/task.png" width="20" align="absmiddle"/> <b>Smart Task Assignment</b> — AI matches tasks to members based on individual skill profiles</td>
  </tr>
  <tr>
    <td align="left"><img src="https://img.icons8.com/fluency/48/network.png" width="20" align="absmiddle"/> <b>Neo4j Knowledge Graph</b> — Maps team relationships, tracks workloads, and detects bottlenecks</td>
  </tr>
  <tr>
    <td align="left"><img src="https://img.icons8.com/fluency/48/combo-chart.png" width="20" align="absmiddle"/> <b>AI Insights Dashboard</b> — Graph-powered bottleneck & risk detection</td>
  </tr>
  <tr>
    <td align="left"><img src="https://img.icons8.com/fluency/48/synchronize.png" width="20" align="absmiddle"/> <b>Real-time Sync</b> — Supabase Realtime for instant updates across all members</td>
  </tr>
  <tr>
    <td align="left"><img src="https://img.icons8.com/fluency/48/chatbot.png" width="20" align="absmiddle"/> <b>AI Chat Assistant</b> — Context-aware team chatbot with memory</td>
  </tr>
  <tr>
    <td align="left"><img src="https://img.icons8.com/fluency/48/group.png" width="20" align="absmiddle"/> <b>Team Management</b> — Skill profiles, DMs, group chat, applications</td>
  </tr>
</table>

<br/>

## <img src="https://img.icons8.com/fluency/48/flow-chart.png" width="32" height="32" align="center" /> Architecture

```mermaid
flowchart TD
    %% Dark Theme Colors
    classDef box fill:#222,stroke:#444,stroke-width:2px,color:#fff;
    classDef accent fill:#3178C6,stroke:#222,stroke-width:2px,color:#fff;
    classDef db fill:#008CC1,stroke:#222,stroke-width:2px,color:#fff;
    
    Title["FLOWMIND FRONTEND (React + TS + Vite)"]:::accent

    subgraph Frontend [" "]
        L["Leader Overview"]:::box
        M["Meetings Tab"]:::box
        T["Tasks Tab"]:::box
        D["Decisions Tab"]:::box
        C["Chat Tab"]:::box
        
        State["Central State Manager\n(AppContext, AuthContext)"]:::accent
        
        S_cli["supabase.ts"]:::box
        A_cli["api.ts"]:::box
        U_cli["useAgora.ts"]:::box
        
        L & M & T & D & C --> State
        State --> S_cli & A_cli & U_cli
    end
    
    Title ~~~ T

    Supa[("☁️ SUPABASE\nPostgreSQL + Realtime\n(13 Tables, WebSockets)")]:::db
    Exp["☁️ EXPRESS BACKEND\nNode.js server.ts\n(/api/groq, /api/neo4j)"]:::box
    Agora(("📞 AGORA.IO\nWebRTC\n(Voice Channels, Token)")):::box

    S_cli ==> Supa
    A_cli ==> Exp
    U_cli ==> Agora

    Groq["🧠 GROQ API\nLlama-3.3-70b\n(Meeting Analysis)"]:::box
    Neo4j[("🕸️ NEO4J AURA\nGraph DB\n(Team-Member-Task)")]:::db

    Exp ==> Groq
    Exp ==> Neo4j
```

<br/>

## <img src="https://img.icons8.com/fluency/48/layers.png" width="32" height="32" align="center" /> Tech Stack

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
      <img src="flowmind/src/assets/readmelogo/neo4j_badge.png" height="40" /><br/>
      <b>Graph Database</b><br/>Neo4j Aura
    </td>
    <td align="center" width="25%">
      <img src="https://skillicons.dev/icons?i=express,nodejs" /><br/>
      <b>Backend</b><br/>Express.js + Node.js
    </td>
  </tr>
  <tr>
    <td align="center" width="25%">
      <img src="flowmind/src/assets/readmelogo/groq_badge.png" height="40" /><br/>
      <b>Artificial Intelligence</b><br/>Groq Fast Inference
    </td>
    <td align="center" width="25%">
      <img src="flowmind/src/assets/readmelogo/agora_badge.png" height="40" /><br/>
      <b>Voice & WebRTC</b><br/>Agora.io SDK
    </td>
    <td align="center" width="25%">
      <img src="https://skillicons.dev/icons?i=vercel" height="40" /><br/>
      <b>Frontend Hosting</b><br/>Vercel
    </td>
    <td align="center" width="25%">
      <img src="flowmind/src/assets/readmelogo/render_badge.svg" height="40" /><br/>
      <b>Backend Hosting</b><br/>Render
    </td>
  </tr>
</table>

<br/>

## <img src="https://img.icons8.com/fluency/48/console.png" width="32" height="32" align="center" /> Setup & Installation

</div>

<div align="center">

### Prerequisites

<img src="https://skillicons.dev/icons?i=nodejs" height="30" align="center" /> <b>Node.js 18+</b> &nbsp;&nbsp;|&nbsp;&nbsp;
<img src="https://skillicons.dev/icons?i=supabase" height="30" align="center" /> <b>Supabase</b> &nbsp;&nbsp;|&nbsp;&nbsp;
<img src="flowmind/src/assets/readmelogo/neo4j_badge.png" height="30" align="center" /> <b>Neo4j Aura</b> &nbsp;&nbsp;|&nbsp;&nbsp;
<img src="flowmind/src/assets/readmelogo/groq_badge.png" height="30" align="center" /> <b>Groq API</b> &nbsp;&nbsp;|&nbsp;&nbsp;
<img src="flowmind/src/assets/readmelogo/agora_badge.png" height="30" align="center" /> <b>Agora.io</b>

</div>

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

## <img src="https://img.icons8.com/fluency/48/group.png" width="32" height="32" align="center" /> Team

Built for **HackHazards '26** by **Team Starcy**:
- Piyush (Leader)
- Debashree

<br/>
<img src="flowmind/src/assets/favicon.png" height="70" width="70" align="center" alt="Flowmind Favicon" />

</div>

<img src="flowmind/src/assets/readmelogo/wave_bottom.svg" width="100%"/>
