# FlowMind — Voice-Driven Project Management for Indian Teams

### 1. Problem
Indian engineering and startup teams collaborate in code-mixed Hinglish—blending Hindi phrasing with English technical terms like *"authentication module Friday tak deploy kar dena"*. Standard speech-to-text engines fail on code-mixed speech, dropping technical context. Consequently, verbal decisions made during fast-paced standups vanish, action items go undocumented, and critical tasks remain unassigned.

### 2. Solution
FlowMind is an AI project manager with a Voice Meetings feature. It listens directly to team conversations in Hinglish, transcribes code-mixed audio using sovereign Indian AI, extracts concrete tasks and architectural decisions, automatically assigns work based on member skill profiles, and speaks audio briefings back to the team.

### 3. Who Uses It
- **Student engineering teams and hackathon duos** building fast under tight deadlines without project managers.
- **Early-stage Indian startups** conducting daily standups and architecture syncs in Hinglish.
- **Remote software squads** needing automated accountability without manual note-taking friction.

### 4. How It Works
1. **Live Transcription via Gnani Prisma v3.0**: Meeting speech is streamed directly to Gnani AI’s Prisma v3.0 sovereign STT engine, accurately transcribing code-mixed Hinglish in real time without storing raw audio on server disk.
2. **Groq Extraction & Skill Matching**: An LLM parses the Prisma transcript to extract actionable tasks, deadlines, priorities, and decisions, matching each task to member skill profiles.
3. **Hindsight Memory & Graph**: Extracted tasks and decisions commit to Hindsight long-term memory and Neo4j graph storage to track workloads and predict failure risks.
4. **Gnani Timbre v3.0 Voice Briefings**: Gnani Timbre v3.0 synthesizes natural Indic audio briefings of the summary, deliverables, and decisions in Hinglish or English.

### 5. Gnani AI Models Used
- **Prisma v3.0 (Speech-to-Text)**: FlowMind’s default transcription engine (`indic-auto`). Trained on 14M+ hours of Indian telephonic speech, Prisma natively transcribes colloquial Hinglish without phonetic hallucinations.
- **Timbre v3.0 (Text-to-Speech)**: Powers universal audio briefings, reciting summaries and action items in natural Indic cadence (`Shivani`, `hi-IN`).

### 6. Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Lucide Icons, CSS Modules.
- **Backend**: Node.js, Express, TypeScript.
- **AI & Memory**: Gnani AI (Prisma v3.0 STT, Timbre v3.0 TTS), Groq LLM API, Hindsight Memory API.
- **Data & Realtime**: Supabase (PostgreSQL & Realtime), Neo4j Knowledge Graph.

### 7. Team and Contributions
Team of two: **Piyush Rajendra Yenorkar** and **Debashree Mal**. FlowMind was co-built at a hackathon; for this challenge:
- **Piyush**: Gnani Prisma STT and Timbre TTS backend integration, audio buffering pipeline, Groq task/decision extraction, skill-based assignment, Hindsight memory sync, UI/UX design and overall architecture.
- **Debashree**: UI/UX design and frontend development for Voice Meetings (engine selector, universal language bar, audio briefing controls, review cards), end-to-end Hinglish testing, and documentation.

### 8. What Is Built Now vs What Is Next
- **Built Now**: Real-time Hinglish audio recording, live Gnani Prisma STT transcription with Web Speech fallback, Groq task extraction, skill-based assignment, Hindsight memory persistence, and Gnani Timbre TTS audio briefings with universal Hinglish/English toggles.
- **What Is Next**: Multi-speaker diarization for multi-party voice rooms and automated WhatsApp task reminders via Gnani voice bots.


---

# Short Form Version (For Quick Form Submissions)

**FlowMind — Voice-Driven Project Management for Indian Teams**

**The Problem**: Indian engineering teams converse in code-mixed Hinglish (*"authentication module Friday tak deploy kar dena"*). Standard speech-to-text models fail on colloquial Indian speech, causing verbal standup decisions to vanish and tasks to go unassigned.

**The Solution**: FlowMind captures live meeting audio, transcribes code-mixed Hinglish in real time via **Gnani AI Prisma v3.0**, extracts concrete deliverables and decisions using an LLM, and automatically assigns tasks to engineers matched to their verified skill profiles. Results are committed to **Hindsight memory** and **Neo4j** to predict failure risks. Finally, **Gnani Timbre v3.0** speaks audio briefings in Hinglish or English.

**Gnani AI Models**: 
- **Prisma v3.0 (STT)**: Live Hinglish transcription trained on 14M+ hours of Indian speech.
- **Timbre v3.0 (TTS)**: Indic voice synthesis for meeting briefings.

**Tech Stack**: React 18, TypeScript, Vite, Node/Express, Supabase, Neo4j, Groq LLM, Hindsight Memory API.

**Team**: Piyush Rajendra Yenorkar (Backend, Gnani STT/TTS pipeline, LLM task extraction, memory graph) & Debashree Mal (UI/UX design, Voice Meetings frontend, testing). FlowMind is an existing project; the Gnani-powered Voice Meetings feature was built specifically for this challenge.
