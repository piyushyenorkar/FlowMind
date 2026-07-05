# FlowMind PPT — Slide Analysis + NotebookLM Prompt

---

## Part 1: What Each Slide Should Contain

### Slide 1 — INTRO / TITLE SLIDE
**Purpose:** First impression. Name, tagline, hackathon branding, team.

| Element | Content |
|---|---|
| **Logo** | FlowMind logo (the stylized gradient text) |
| **Tagline** | "Your Personal AI Group Project Manager" |
| **Hackathon** | HackHazards '26 |
| **Themes** | Human Experience & Productivity · Work, Finance & Digital Economy |
| **Partner Track** | Neo4j |
| **Team** | Team Starcy — Piyush (Leader), Debashree |
| **Live URL** | flowwithmind.vercel.app |

**Design:** Clean white background. FlowMind logo centered large. Tagline below in teal. Hackathon badge in corner. Minimal — let the brand breathe.

---

### Slide 2 — THE PROBLEM
**Purpose:** Make judges feel the pain. This is the "why" slide.

| Element | Content |
|---|---|
| **Headline** | "Meetings Happen. Tasks Disappear." |
| **Pain Point 1** | 73% of meeting action items are never completed |
| **Pain Point 2** | Manual task logging has near-zero adoption — nobody opens Jira after a call |
| **Pain Point 3** | Bottlenecks are invisible until deadlines pass |
| **Pain Point 4** | No tool connects WHO said WHAT to WHO should DO it |
| **Visual** | A simple "before FlowMind" illustration: messy flow of meeting → sticky notes → forgotten tasks → missed deadline |

**Design:** White bg. Left side has the headline + 4 pain points as clean icons with one-line text. Right side has a simple visual showing the broken workflow.

---

### Slide 3 — THE SOLUTION
**Purpose:** What FlowMind is and what it does. The "aha" moment.

| Element | Content |
|---|---|
| **Headline** | "FlowMind — The PM That Never Forgets" |
| **Core Features** (4 pillars): | |
| 🎤 Live Voice Meetings | Agora SDK — team talks, AI listens |
| 📝 AI Transcription & Analysis | Groq LLM extracts tasks, decisions, summaries from conversation |
| 🧠 Smart Task Assignment | AI matches tasks to members based on skill profiles |
| 🕸️ Neo4j Graph Intelligence | Detects bottlenecks, predicts risks, suggests fixes |
| **Visual** | Clean flow: "Team Talks → AI Listens → Tasks Created → Graph Monitors" |

**Design:** White bg. 4 feature cards in a horizontal row, each with an icon + 2-line description. Below them, a clean left-to-right arrow flow showing the user journey.

---

### Slide 4 — TECHNICAL ARCHITECTURE
**Purpose:** Show judges the engineering depth. This is THE slide that needs the ISRO-style pipeline diagram.

| Element | Content |
|---|---|
| **Headline** | "System Architecture — End-to-End Pipeline" |
| **Pipeline Diagram** (clean boxes + arrows): | |
| **Stage 1 — Frontend** | React + TypeScript + Vite → User Dashboard, Voice Room, Task Board |
| **Stage 2 — Real-time Layer** | Supabase Realtime → WebSocket subscriptions + Broadcast channels |
| **Stage 3 — Voice Layer** | Agora SDK (WebRTC) → Live audio + Web Speech API → Transcript |
| **Stage 4 — AI Layer** | Transcript → Express Backend → Groq (llama-3.3-70b) → JSON (tasks, decisions, summary) |
| **Stage 5 — Intelligence Layer** | Neo4j Aura → Cypher Queries → Bottleneck Detection + AI Insights |
| **Data flow arrows** | Show how data flows: User speaks → Speech API → Transcript → Groq → Tasks → Supabase + Neo4j → Dashboard updates |

**Design:** White bg. This is the ISRO-style slide — clean labeled rectangular boxes connected by arrows. Each stage has a colored header banner (like ISRO's "STAGE 1: ..." labels). Input on left, output on right. Clear data flow. This should look like a professional research paper diagram.

---

### Slide 5 — NEO4J KNOWLEDGE GRAPH (Partner Track)
**Purpose:** Dedicated slide for Neo4j judges. Show WHY graph DB and HOW it powers intelligence.

| Element | Content |
|---|---|
| **Headline** | "Neo4j — The Intelligence Layer" |
| **Graph Schema Visual** | Clean node-relationship diagram: `(:Team) ←[:BELONGS_TO]- (:Member) -[:ASSIGNED_TO]→ (:Task) -[:BELONGS_TO]→ (:Team)` |
| **What it powers (3 items):** | |
| Workload Detection | Cypher traversal finds overloaded members (>1.5× avg tasks) |
| Bottleneck Chains | Finds members assigned to 2+ tasks creating dependency chains |
| AI Recommendations | Graph data + Groq AI → specific actionable suggestions |
| **Before vs After** | Without Neo4j: flat SQL queries, no relationship awareness. With Neo4j: single traversal query reveals hidden bottleneck patterns |
| **Quote** | "Neo4j enables FlowMind to answer: 'Who is silently drowning in work?' — in a single query." |

**Design:** White bg. Left half: graph schema diagram (nodes as circles, relationships as labeled arrows). Right half: 3 feature cards stacked vertically. Clean, no clutter.

---

### Slide 6 — KEY FEATURES DEMO
**Purpose:** Show the product in action. Screenshots + feature highlights.

| Element | Content |
|---|---|
| **Headline** | "FlowMind in Action" |
| **Feature 1** | Leader Dashboard — Team Health, Graph Insights, Task Stats, Activity Feed |
| **Feature 2** | Live Voice Meeting → Real-time Transcript → AI Analysis → Auto-assigned Tasks |
| **Feature 3** | Group Chat with AI Summarization |
| **Feature 4** | Skill-based Member Profiles that drive AI task assignment |
| **Visuals** | 3-4 actual product screenshots arranged in a clean grid or staggered layout |

**Design:** White bg. Product screenshots placed in clean device mockup frames or with subtle drop shadows. Small labels below each screenshot. No walls of text — let the product speak.

---

### Slide 7 — TECH STACK
**Purpose:** Clean visual of everything used.

| Element | Content |
|---|---|
| **Headline** | "Built With" |
| **Frontend** | React 18 · TypeScript · Vite · CSS Modules · Lucide Icons |
| **Backend** | Express 5 · Node.js |
| **Database** | Supabase (PostgreSQL + Realtime) |
| **Graph DB** | Neo4j Aura (neo4j-driver 6.2) |
| **AI** | Groq API (llama-3.3-70b-versatile) |
| **Voice** | Agora SDK (agora-rtc-sdk-ng 4.24) |
| **Speech** | Web Speech API (browser native) |
| **Deployment** | Vercel |
| **Visual** | Tech logos arranged in a clean grid, grouped by layer |

**Design:** White bg. Logo grid with technology names + version numbers below each. Grouped into rows by layer (Frontend / Backend / AI / Voice). Clean and scannable.

---

### Slide 8 — IMPACT & FUTURE
**Purpose:** Why it matters + where it's going.

| Element | Content |
|---|---|
| **Headline** | "Impact & What's Next" |
| **Who it helps (3 personas):** | |
| 🎓 Hackathon Teams | Auto-assign tasks during kickoff meetings |
| 🏫 University Groups | Track who said they'd do what — with proof |
| 🚀 Startup Teams | Detect bottlenecks before sprint ends |
| **What's Next:** | |
| Short-term | Calendar integration, task dependency tracking in Neo4j |
| Medium-term | Conflict prediction (scheduling clashes from graph), sprint velocity |
| Long-term | Self-improving PM — learns team patterns, predicts delivery timelines |

**Design:** White bg. Top half: 3 persona cards side by side. Bottom half: roadmap as a horizontal timeline with 3 milestones.

---

### Slide 9 — THANK YOU / CLOSING
**Purpose:** Leave a lasting impression. Call to action.

| Element | Content |
|---|---|
| **Headline** | "Thank You" |
| **FlowMind Logo** | Centered, large |
| **Tagline** | "The PM That Never Forgets" |
| **Live Demo** | flowwithmind.vercel.app |
| **GitHub** | [repo link] |
| **Team** | Piyush (Leader) · Debashree |
| **Partner Track** | Neo4j |

**Design:** White bg. Logo centered. URL and team info below. QR code in corner linking to live demo. Clean, confident, minimal.

---

---

## Part 2: Ready-to-Paste NotebookLM Prompt

Copy everything below this line and paste it directly into your NotebookLM / AI presentation tool:

---

```
You are an expert presentation designer. Create a professional 9-slide pitch deck for a hackathon project called "FlowMind" for the HackHazards '26 hackathon.

═══ DESIGN REQUIREMENTS ═══

THEME: Clean, professional, white background on EVERY slide. 
STYLE REFERENCE: Research paper / ISRO technical presentation style — clean labeled boxes, pipeline flow diagrams with arrows, clear visual hierarchy. NOT startup pitch deck style. Think: academic clarity meets modern product design.
COLOR PALETTE: 
- Background: Pure white (#FFFFFF)
- Primary accent: Teal/Cyan (#2DD4A8 — FlowMind brand color)  
- Secondary accent: Dark navy (#1A1A2E)
- Text: Dark charcoal (#1E1E1E) for headings, medium gray (#555555) for body
- Accent borders and arrows: Teal (#2DD4A8)
TYPOGRAPHY: Clean sans-serif (Poppins or Inter). Headings bold, body regular.
LAYOUT: Generous white space. No cluttered slides. Max 4-5 elements per slide. Use icons sparingly.

═══ PROJECT CONTEXT ═══

PROJECT NAME: FlowMind
TAGLINE: "Your Personal AI Group Project Manager"
ALTERNATE TAGLINE: "The PM That Never Forgets"
LIVE URL: flowwithmind.vercel.app
HACKATHON: HackHazards '26
THEMES: Human Experience & Productivity | Work, Finance & Digital Economy
PARTNER TRACK: Neo4j (primary focus)
TEAM: Team Starcy — Piyush (Leader), Debashree

WHAT FLOWMIND DOES:
FlowMind is an AI-powered project management platform that listens to team meetings via live voice rooms (Agora SDK), transcribes them in real-time (Web Speech API), and uses AI (Groq llama-3.3-70b) to auto-extract tasks, decisions, and summaries from the transcript. Tasks are intelligently assigned to team members based on their skill profiles. Every entity is synced to a Neo4j knowledge graph that detects workload bottlenecks, identifies idle resources, and generates AI-powered recommendations.

TECH STACK:
- Frontend: React 18 + TypeScript + Vite + CSS Modules + Lucide Icons
- Backend: Express 5 + Node.js
- Database: Supabase (PostgreSQL + Realtime WebSocket subscriptions)
- Graph Database: Neo4j Aura (neo4j-driver ^6.2.0)
- AI/LLM: Groq API (model: llama-3.3-70b-versatile)
- Voice: Agora SDK (agora-rtc-sdk-ng ^4.24.5)
- Speech: Web Speech API (browser native)
- Memory: Hindsight API (persistent team memory)
- Deployment: Vercel

═══ SLIDE-BY-SLIDE CONTENT ═══

SLIDE 1 — TITLE / INTRO
- FlowMind logo text centered prominently
- Below logo: "Your Personal AI Group Project Manager" in teal
- Bottom section: "HackHazards '26 | Team Starcy | Piyush & Debashree"
- Small badge: "Partner Track: Neo4j"
- Design: White background, logo large and centered, minimal elements, confident first impression

SLIDE 2 — THE PROBLEM
- Headline: "Meetings Happen. Tasks Disappear."
- 4 pain points with simple icons:
  • 73% of meeting action items are never completed
  • Manual task logging has near-zero adoption in real teams  
  • Bottlenecks stay invisible until deadlines pass
  • No tool connects WHO discussed WHAT to WHO should DO it
- Visual: A simple broken workflow diagram showing: Meeting → Notes? → Forgotten → Missed Deadline (with red X marks at failure points)
- Design: White background, pain points on left side, broken workflow visual on right side

SLIDE 3 — THE SOLUTION  
- Headline: "FlowMind — The PM That Never Forgets"
- 4 feature pillars as clean cards in a row:
  • 🎤 Live Voice Meetings — "Agora SDK WebRTC — team talks, AI listens"
  • 📝 AI Transcript Analysis — "Groq LLM auto-extracts tasks, decisions, summaries"
  • 🧠 Smart Assignment — "AI matches tasks to members by skill profiles"
  • 🕸️ Graph Intelligence — "Neo4j detects bottlenecks & predicts risks"
- Below: A clean horizontal flow arrow: "Team Talks → AI Listens → Tasks Created → Graph Monitors → Risks Predicted"
- Design: White background, 4 cards equally spaced, flow arrow below them

SLIDE 4 — TECHNICAL ARCHITECTURE (ISRO-STYLE PIPELINE)
- Headline: "System Architecture — End-to-End Pipeline"
- THIS IS THE MOST IMPORTANT SLIDE. Create a clean, ISRO-style staged pipeline diagram:
  
  STAGE 1 banner: "User Interface Layer"
  Box: React + TypeScript + Vite → [Dashboard, Voice Room, Task Board, Chat] → Arrow down
  
  STAGE 2 banner: "Real-time Data Layer"  
  Box: Supabase PostgreSQL → [WebSocket Subscriptions, Broadcast Channels, 13 Tables] → Arrow down
  
  STAGE 3 banner: "Voice & Transcription Layer"
  Box: [Agora SDK (WebRTC Audio)] → Arrow → [Web Speech API] → Arrow → [Live Transcript]
  
  STAGE 4 banner: "AI Processing Layer"
  Box: [Transcript + Member Profiles] → Arrow → [Express Backend] → Arrow → [Groq llama-3.3-70b] → Arrow → [JSON: Tasks, Decisions, Summary]
  
  STAGE 5 banner: "Intelligence Layer"
  Box: [Neo4j Aura Graph DB] → [Cypher Queries: Workload, Bottlenecks, Chains] → Arrow → [AI Insights Dashboard]
  
  Each stage should have a colored banner header (dark navy or teal background with white text like ISRO's "STAGE 1:" labels). Boxes should be clean rectangles with thin borders. Arrows should be clean and directional. Input on left/top, output on right/bottom. The overall look should resemble a research paper architecture diagram — clean, labeled, professional.

- Design: White background, the pipeline diagram takes up 85% of the slide, minimal text outside the diagram

SLIDE 5 — NEO4J KNOWLEDGE GRAPH (Partner Track Highlight)
- Headline: "Neo4j — The Intelligence Layer"
- Subheadline: "Partner Track: Neo4j"
- Left half: Graph schema diagram showing nodes and relationships:
  • (:Team) node at center
  • (:Member) nodes connected via -[:BELONGS_TO]→ to Team
  • (:Task) nodes connected via -[:BELONGS_TO]→ to Team  
  • (:Member) connected via -[:ASSIGNED_TO]→ to (:Task)
  Draw this as circles (nodes) with labeled arrows (relationships)
  
- Right half: What Neo4j Powers (3 items stacked):
  • "Workload Detection" — Cypher traversal finds members with >1.5× average tasks
  • "Bottleneck Chains" — Finds members assigned to 2+ incomplete tasks
  • "AI Recommendations" — Graph data fed into Groq for actionable suggestions
  
- Bottom banner: "7 Cypher queries power FlowMind's intelligence — from workload distribution to task chain detection"
- Design: White background, graph diagram on left (clean circles + arrows), feature list on right

SLIDE 6 — PRODUCT DEMO / KEY FEATURES
- Headline: "FlowMind in Action"
- Show 4 key screens/features in a 2×2 grid layout:
  • Leader Dashboard — Overview with Team Health score, Graph Insights card, Task Stats, real-time Activity Feed
  • Live Voice Meeting — Voice room with real-time transcript, mic controls, participant indicators
  • AI Meeting Analysis — Step 3 analysis screen showing AI-generated tasks with assignment reasons, decisions, summary
  • Group Chat — Real-time team messaging with AI summarization
- Each quadrant should have a small label and a brief one-line description
- Note: Leave placeholder rectangles for actual screenshots — label them "[Insert Screenshot: Dashboard]" etc.
- Design: White background, 2×2 grid with subtle rounded-corner borders, labels below each

SLIDE 7 — TECH STACK
- Headline: "Built With"
- Arrange tech logos in a clean grid grouped by layer:
  Row 1 — "Frontend": React logo + "React 18" | TypeScript logo + "TypeScript" | Vite logo + "Vite" | Lucide logo + "Lucide Icons"
  Row 2 — "Backend & Database": Express logo + "Express 5" | Supabase logo + "Supabase" | Neo4j logo + "Neo4j Aura" 
  Row 3 — "AI & Voice": Groq logo + "Groq (llama-3.3-70b)" | Agora logo + "Agora SDK" | text "Web Speech API"
  Row 4 — "Deployment": Vercel logo + "Vercel"
- Design: White background, logos arranged in rows with technology name + version below each. Clean grid, generous spacing. Each row has a subtle gray label on the left (Frontend / Backend / AI / Deploy)

SLIDE 8 — IMPACT & ROADMAP
- Headline: "Impact & What's Next"
- Top section — "Who It Helps" (3 persona cards side by side):
  • 🎓 Hackathon Teams — Auto-assign tasks during kickoff meetings
  • 🏫 University Groups — Track who committed to what, with proof
  • 🚀 Startup Teams — Detect bottlenecks before sprint deadlines
  
- Bottom section — "Roadmap" as a horizontal timeline:
  • Now: "Live voice + AI analysis + Neo4j insights" (teal dot, filled)
  • Next: "Calendar sync, task dependencies in Neo4j" (teal dot, outline)
  • Future: "Self-improving PM — learns patterns, predicts timelines" (gray dot, outline)
  
- Design: White background, persona cards on top half, timeline on bottom half

SLIDE 9 — THANK YOU / CLOSING
- FlowMind logo centered large
- Below: "The PM That Never Forgets"
- Live Demo: flowwithmind.vercel.app
- GitHub: [repository link]
- Team: "Piyush · Debashree | Team Starcy"
- Partner Track: "Neo4j"
- Small QR code in bottom-right corner linking to live demo
- Design: White background, centered layout, confident and clean

═══ GLOBAL RULES ═══

1. EVERY slide must have a pure white (#FFFFFF) background — no dark slides, no gradients
2. Use teal (#2DD4A8) for accents, highlights, arrows, and icons
3. Use dark navy (#1A1A2E) for stage banners and headings
4. Use charcoal (#1E1E1E) for body text
5. Maximum 5-6 elements per slide — do NOT overcrowd
6. The architecture diagram on Slide 4 MUST look like a clean research paper pipeline diagram — labeled boxes, directional arrows, stage banners. Reference style: ISRO technical presentation diagrams
7. Use clean sans-serif typography throughout (Poppins or Inter)
8. No stock photos, no generic clip art, no gradients in backgrounds
9. Icons should be simple line icons (like Lucide), not filled/colored illustrations
10. Slide aspect ratio: 16:9 widescreen
```

---

## Part 3: Quick Summary for You

| Slide | What It Does | Time (if presenting) |
|---|---|---|
| 1. Title | First impression, branding | 10 sec |
| 2. Problem | Make judges feel the pain | 30 sec |
| 3. Solution | What FlowMind does (4 pillars) | 45 sec |
| 4. Architecture | ISRO-style pipeline diagram — engineering depth | 60 sec |
| 5. Neo4j | Partner track spotlight — graph schema + what it powers | 45 sec |
| 6. Demo | Product screenshots — show, don't tell | 45 sec |
| 7. Tech Stack | Clean logo grid | 15 sec |
| 8. Impact + Future | Who it helps + roadmap | 30 sec |
| 9. Thank You | Closing, links, QR | 10 sec |
| **Total** | | **~5 min** |
