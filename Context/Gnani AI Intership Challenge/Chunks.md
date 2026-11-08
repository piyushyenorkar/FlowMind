# Chunk 0: Context (paste once)

Think step by step and reason carefully before every action. Do not guess.

Project: FlowMind, an AI project manager (React 18 + Vite frontend, Node/Express backend, Groq llama3-70b for analysis, Hindsight Memory API). It is being submitted to the Great Indian AI Internship Challenge by Gnani AI. The entry must genuinely use Gnani AI's models (Prisma speech-to-text) and solve a practical enterprise/team problem: team decisions made in Hinglish meetings get lost and tasks go unassigned.

Deadline is in about 2 days, so prioritise a working, demo-ready build over extras. Confirm you understand, then wait for the next task.

# Chunk 1: Build the Gnani voice meetings feature

Task: add a Voice Meetings feature to FlowMind with Gnani's Prisma speech-to-text as the DEFAULT transcription engine. Keep the existing Web Speech API option as a selectable alternative.

Before writing any code:
1. Read Gnani's docs at https://docs.gnani.ai (quick start, speech-to-text API, streaming/auth). Use the real endpoints, auth headers and request format from the docs. Do not invent them.
2. Inspect the FlowMind codebase and tell me your plan: files to change, new endpoints, and UI changes.

Requirements:
- Engine selector in the meeting UI: "Gnani Prisma (default)" and "Browser Web Speech API". Gnani is pre-selected.
- The Gnani API key lives ONLY in the backend .env (GNANI_API_KEY). Never expose it to the frontend. Add it to .env.example and make sure .env is gitignored.
- Backend route: receives recorded audio from the browser, sends it to Prisma with the language set for Hinglish/code-mixed speech (check the docs for the right language code), and returns the transcript.
- If the Gnani call fails, show a clear error and offer a one-click switch to the Web Speech option.
- Feed the transcript into the existing Groq analysis to extract decisions and action items, assign tasks to members based on skill profiles, and store the results in Hindsight memory.
- Show the transcript, extracted decisions and tasks on screen, and label which engine produced the transcript.
- This must be a real, fully working production-quality flow. No mock data, no hardcoded or placeholder transcripts, no fake responses. Everything shown on screen must come from the live audio input and real API calls. Do not store or log raw audio on the server; delete temporary audio files after transcription.

After implementing: run the app, test the full flow, list what you verified, and list any limitations honestly. Show me the files changed.

# Chunk 2: One-page pitch

Task: write the 1-page solution pitch for our Gnani AI challenge submission as PITCH.md. It must fit on one page (about 350-450 words) because the submission form requires a pitch no longer than 1 page.

Use our actual README and codebase as the source of truth. Do not invent features. Include these sections in this order:
1. Problem: teams decide things in Hinglish meetings, but decisions and action items get lost.
2. Solution: FlowMind with a Voice Meetings feature.
3. Who uses it: student teams, startups, small companies.
4. How it works: the flow from meeting audio to Prisma transcript to Groq analysis to assigned tasks to memory-based failure prediction.
5. Gnani AI models used: Prisma speech-to-text (say specifically how it is used and why it suits Hinglish).
6. Tech stack.
7. Team and contributions: Team of two, Piyush Rajendra Yenorkar and Debashree Mal. FlowMind was co-built by both of us earlier at a hackathon. For this challenge:
- Piyush: Gnani Prisma integration, backend transcription route, Groq-based decision and task extraction, skill-based task assignment, Hindsight memory storage, overall architecture.
- Debashree: UI/UX design and frontend development for the Voice Meetings screen (engine selector, recording controls, live transcript view, and the decisions and tasks panels), plus testing the Hinglish meeting flow end to end and helping prepare the demo and documentation.
8. What is built now vs what is next. Be honest: FlowMind existed before, and the Gnani-powered Voice Meetings is the new work for this challenge.

Tone: clear, concrete, no buzzwords. Then also give me a short version of the same pitch I can paste into a form field.

# Chunk 3: Two demo video scripts

Task: write two demo video scripts for FlowMind's Gnani-powered Voice Meetings feature.

Script A: 2-3 minutes (for the submission form). Structure: the problem (hook in the first 10 seconds), the solution, a live walkthrough of the app, how Gnani's Prisma is used, the result, and a closing line. Include screen directions (what to show, click and say) next to each line, with timestamps.

Script B: exactly 60 seconds (for the social post, Demo Day Drop award). It shows ONLY the meeting feature: a quick hook, then the Hinglish meeting being spoken, transcribed by Prisma, and turned into assigned tasks. Fast pacing, with a clear title or caption overlay.

Important: both scripts must use the SAME Hinglish meeting dialogue for the meeting segment, so I only have to record one meeting and can reuse it. Write that Hinglish dialogue (4-6 short lines between 2-3 team members, with realistic work decisions and action items, e.g. deadlines and who does what). Use natural, casual Hinglish in Roman script. Use a realistic work meeting (team names, deadlines, tasks), but do not mention any real phone numbers, account numbers, Aadhaar, PAN, or personal sensitive details.

Also give a recording checklist: quiet room, mic placement, screen resolution, and what to avoid.

# Chunk 4: LinkedIn and X posts

Task: write the social posts announcing our submission.

1. LinkedIn post (150-220 words): a hook in the first line, the problem, what we built, how Gnani AI's Prisma is used, one honest line saying FlowMind is an existing project and the Voice Meetings feature was built for this challenge, and a call to action asking people to watch the demo. Tag Gnani AI. End with exactly these hashtags: #GnaniAI #GreatIndianAIInternshipChallenge
2. X post: one main post under 280 characters, including the hashtags and tagging @GnaniAi, plus a 3-4 post thread explaining the problem, the build, and the tech.
3. Two short alternative hooks for each platform.

Rules: no hype or fake claims, no engagement-bait or "like to vote for me" phrasing (their rules ban bought engagement and engagement swaps). Keep the tone authentic and builder-like. Leave a [VIDEO LINK] placeholder where the video goes.