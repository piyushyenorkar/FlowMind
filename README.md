<div align="center">
  <img src="flowmind/src/assets/flowmind.png" alt="Flowmind Logo" height="1200"/>
  
  <h1>🧠 FlowMind — The PM That Never Forgets</h1>
  
  <p><strong>AI-POWERED PROJECT INTELLIGENCE ENGINE USING HINDSIGHT MEMORY & GROQ</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Groq%20%2F%20Llama%203.3-F55036?style=for-the-badge&logo=openai&logoColor=white" alt="Groq AI" />
    <img src="https://img.shields.io/badge/Hindsight_API-00599C?style=for-the-badge&logo=vectorworks&logoColor=white" alt="Vectorize Hindsight" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </p>
</div>

<hr/>

<h2 align="center"><em><strong>📖 Overview</strong></em></h2>

**FlowMind** is a smart project management web application designed to act as an AI-powered project manager that truly remembers everything. 

Instead of just listing tasks, FlowMind tracks decisions, bottlenecks, and team discussions while automatically saving context to **Hindsight Vector Memory**. Powered by the lightning-fast **Groq API (Llama 3.3)**, it actively analyzes your team's historical data to generate intelligent, data-driven insights and answer complex project questions by recalling semantic memories.

---

<h2 align="center"><em><strong>🚀 Key Features</strong></em></h2>

- 🧠 **Hindsight Semantic Memory:** Automatically stores team activities, discussions, and decisions in Vectorize Hindsight, enabling deep, context-aware semantic recall.
- ⚡ **Groq-Powered Insights:** Leverages Llama 3.3 via the Groq API to instantly analyze task completion patterns, calculate risk scores, and generate specific actionable recommendations.
- 💬 **Context-Aware Chat:** Ask the embedded AI questions about past project decisions, blockers, or task history. It answers accurately by semantically retrieving past team memories.
- 👥 **Role-Based Workspaces:** Distinct flows for Team Leaders (to orchestrate members, tasks, and view AI insights) and Members (to update tasks and log progress).
- 🔐 **Secure & Real-Time DB:** Powered by Supabase to handle authentication, manage team data, and ensure seamless state synchronization.

---

<h2 align="center"><em><strong>🧠 Core Architecture</strong></em></h2>

Unlike standard task trackers, FlowMind shifts heavy context retention to specialized AI memory layers:

1. **Memory Layer (Hindsight):** Integrates directly with the `api.hindsight.vectorize.io` service to `retain` and `recall` text-based memory embeddings effortlessly.
2. **AI Layer (Groq):** Uses a highly constrained system prompt with `llama-3.3-70b-versatile` to interpret JSON project data alongside semantic memory context, outputting structured JSON insights.
3. **Database Layer (Supabase):** Manages user authentication, team relationships, and structured project data reliably in real-time.
4. **Frontend Application:** Built with React and Vite for a blazing-fast, modern UI experience, utilizing React Context for state management and Lucide for iconography.

---

<h2 align="center"><em><strong>⚙️ The Pipeline Flow</strong></em></h2>

### 1️⃣ Information Capture
- **Actions:** When a user creates a task, logs a decision, or updates a status, the event is saved.
- **Memory Retention:** Background processes call the Hindsight API to store these events as semantic memories linked to the specific team.

### 2️⃣ Insight Generation
- **Semantic Recall:** When the Leader requests insights, FlowMind queries Hindsight for memories related to bottlenecks, risks, and performance.
- **Data Structuring:** React formats the recalled memories, current tasks, and member lists into a structured prompt.
- **AI Processing:** The Groq API analyzes the payload and returns targeted risks, patterns, and recommendations in strict JSON format.

### 3️⃣ Interactive Output
- **Dashboard UI:** The React frontend parses the AI's JSON and renders actionable insight cards and risk warnings on the Leader Dashboard.

---

<h2 align="center"><em><strong>💻 Setup & Usage</strong></em></h2>

Integrating and running FlowMind locally is incredibly straightforward.

```bash
# 1. Clone the repository
git clone https://github.com/piyushyenorkar/FlowMind.git
cd FlowMind/flowmind

# 2. Install dependencies
npm install

# 3. Add your API Keys
# Create a .env file in the flowmind directory:
echo "VITE_HINDSIGHT_API_KEY=your_hindsight_key_here" > .env
echo "VITE_HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io" >> .env
echo "VITE_GROQ_API_KEY=gsk_your_groq_key_here" >> .env
echo "VITE_SUPABASE_URL=your_supabase_url_here" >> .env
echo "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here" >> .env

# 4. Start the Dev Server!
npm run dev
```

### 💡 Example AI Interactions
- *"Why did we decide to change the database schema last week?"*
- *"Who is currently blocking the deployment task?"*
- *"Based on our task history, are we at risk of missing the beta launch deadline?"*

---

<h2 align="center"><em><strong>📂 File Structure</strong></em></h2>

```text
FlowMind/
│
├── README.md
└── flowmind/
    ├── package.json            ← 📦 Project dependencies
    ├── vite.config.ts          ← ⚡ Vite configuration
    ├── tsconfig.json           ← ⚙️ TypeScript configuration
    ├── index.html              ← 📄 Application entry point
    │
    └── src/
        ├── App.tsx             ← 🔀 Application Router & Setup
        ├── context/            ← 🌍 Global state (App, Auth)
        ├── pages/              ← 🖥️ UI pages (Leader/Member Dashboards, Setup)
        ├── components/         ← 🧩 Reusable React UI components
        ├── utils/              ← 🛠️ Utility functions and helpers
        └── services/
            └── api.ts          ← 🧠 Core Hindsight & Groq API integrations
```

---

<div align="center">
  <i>🏆 Built for the <b>Axion Hackathon</b> and awarded <b>First Prize!</b></i>
</div>
