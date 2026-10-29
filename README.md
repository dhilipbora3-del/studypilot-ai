# 🎓 StudyPilot AI — Intelligent Multi-Agent Student Assistant

StudyPilot AI is an autonomous, full-stack student productivity web platform designed to help students master academic subjects, balance realistic study routines, prepare for examinations, and systematically improve grades through a collaborative multi-agent architecture.

---

## 🤖 Multi-Agent Architecture

StudyPilot AI organizes student learning across **6 specialized agents**:

```
                       ┌─────────────────────────┐
                       │      Student Prompt     │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │   1. MANAGER AGENT      │
                       │   Intent Decomposition  │
                       │   & Context Dispatcher  │
                       └──────┬────────────┬─────┘
                              │            │
            ┌─────────────────┼────────────┼──────────────────┐
            ▼                 ▼            ▼                  ▼
  ┌──────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
  │ 2. AI TUTOR      │ │ 3. STUDY    │ │ 4. ASSIGN-  │ │ 5. EXAM      │
  │    AGENT         │ │    PLANNER  │ │    MENT     │ │    AGENT     │
  │ • Simple notes   │ │ • Timetable │ │ • Milestones│ │ • Mock Tests │
  │ • Analogies      │ │ • Ergonomic │ │ • Deadlines │ │ • Exact Score│
  │ • Flashcards     │ │   Rest      │ │ • Socratic  │ │ • Diagnostic │
  │ • Practice Qs    │ │   Intervals │ │   Guidance  │ │   Weak Areas │
  └─────────┬────────┘ └──────┬──────┘ └──────┬──────┘ └──────┬───────┘
            │                 │               │               │
            └─────────────────┴───────┬───────┴───────────────┘
                                      │
                                      ▼
                       ┌─────────────────────────┐
                       │   6. REVIEW AGENT       │
                       │ • Arithmetic Audit      │
                       │ • Schedule Collisions   │
                       │ • Timeline Validity     │
                       │ • Academic Integrity    │
                       └──────────────┬──────────┘
                                      │
                                      ▼
                       ┌─────────────────────────┐
                       │ Verified Student Output │
                       │ With Interactive UI     │
                       └─────────────────────────┘
```

1. **Manager Agent**: Analyzes student requests, extracts academic intents, passes database context (current subjects, pending assignments, upcoming exams) to relevant agents, and synthesizes final responses.
2. **AI Tutor Agent**: Explains complex concepts in student-friendly language using real-world analogies, worked examples, active recall flashcards, and practice questions.
3. **Study Planner Agent**: Generates realistic, conflict-free daily and weekly timetables, distributing study blocks across subjects based on confidence ratings and urgency, with built-in cognitive breaks.
4. **Assignment Agent**: Dynamically scores assignment urgency based on deadline proximity, decomposes large projects into 4-5 sequential milestones with hints, and provides guided problem-solving frameworks.
5. **Exam Agent**: Generates mock examinations, scores student responses with exact deterministic calculation, identifies weak subtopics, and builds spaced revision milestones.
6. **Review Agent (Quality & Verification Guardian)**: Deterministically audits arithmetic equations, detects timetable slot collisions, validates date chronology, and stamps verified responses.

---

## ⚡ Offline Deterministic Engine vs. External Credentials

StudyPilot AI is fully functional out of the box with zero external dependencies, while also providing deep LLM support when an API key is supplied:

| Capability | Local Deterministic Mode (Default) | Online LLM Mode (`GEMINI_API_KEY` / `OPENAI_API_KEY`) |
|---|---|---|
| **Timetable Generation** | ✅ 100% Conflict-free deterministic time slot allocation | ✅ Context-enriched schedule descriptions |
| **Arithmetic & Scoring** | ✅ Deterministic exact math and percentage calculation | ✅ Deterministic exact math verified by Review Agent |
| **Assignment Breakdown**| ✅ Structural milestone decomposition with hints | ✅ Custom domain-specific assignment breakdown |
| **Interactive Mock Tests**| ✅ Built-in question banks & deterministic evaluation | ✅ Unlimited AI-generated test variations |
| **Flashcard System** | ✅ Leitner 5-box spaced repetition algorithm | ✅ Dynamic AI-generated decks on any topic |
| **Pomodoro Focus Timer** | ✅ Native session logging & streak tracking in SQLite | ✅ Native session logging & streak tracking in SQLite |
| **Multi-Agent Traces** | ✅ Full transparency timeline of all 6 agents | ✅ Full transparency timeline with LLM execution times |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher, tested on v24.22.1)
- **npm** (v9.0.0 or higher)

### 1. Install & Build

```bash
# Clone or navigate to the project directory
cd /path/to/studypilot-ai

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Build production bundle
npm run build
```

### 2. Configure Environment (Optional)

Create a `.env` file in the `server` directory (a pre-configured `.env` is already created):

```env
PORT=3001

# Optional: Add Google Gemini or OpenAI API Key for online generative reasoning
# If left empty, StudyPilot AI uses its built-in pedagogical deterministic engine!
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the Application

You can run the full-stack app in a single command from the project root:

```bash
# Start full-stack server (serves API and compiled React client on port 3001)
npm start
```

Or run frontend and backend simultaneously in hot-reloading development mode:

```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend Vite dev server (port 5173 with proxy to backend)
npm run client
```

Open your browser at **`http://localhost:3001`** (or `http://localhost:5173` in development mode).

---

## 🧪 Automated Multi-Agent Verification Suite

A 23-assertion multi-agent test suite verifies all agents, deterministic arithmetic, collision detection, and database operations:

```bash
npm test
```

### Test Coverage Summary:
- **Test 1**: SQLite database initialization, foreign keys, and seed integrity.
- **Test 2**: AI Tutor Agent conceptual explanations, flashcard extraction, and practice questions.
- **Test 3**: Study Planner Agent conflict-free timetable allocation and cognitive rest intervals.
- **Test 4**: Review Agent deterministic arithmetic checking and schedule collision detection.
- **Test 5**: Assignment Agent proximity scoring and milestone decomposition.
- **Test 6**: Exam Agent mock quiz generation, deterministic scoring (66.7%), and weak topic diagnosis.
- **Test 7**: Manager Agent composite multi-agent orchestration and trace capture.

---

## 📁 Project Structure

```
studypilot-ai/
├── package.json                   # Root scripts (start, dev, build, test)
├── README.md                      # Documentation & setup guide
├── server/
│   ├── package.json
│   ├── .env                       # Server configuration & API keys
│   ├── .env.example
│   ├── data/
│   │   └── studypilot.db          # Persistent SQLite database
│   ├── test/
│   │   └── test-orchestrator.js   # Multi-agent test suite (23 checks)
│   └── src/
│       ├── index.js               # Express API entry & static client server
│       ├── db/
│       │   └── database.js        # node:sqlite schema & seed data
│       ├── agents/
│       │   ├── llmClient.js       # Universal Gemini / OpenAI / Fallback client
│       │   ├── managerAgent.js    # Hub orchestrator & intent classifier
│       │   ├── tutorAgent.js      # AI Tutor Agent
│       │   ├── plannerAgent.js    # Study Planner Agent
│       │   ├── assignmentAgent.js # Assignment Agent
│       │   ├── examAgent.js       # Exam Agent
│       │   └── reviewAgent.js     # Review Agent (audit & verification)
│       └── routes/
│           ├── chatRoutes.js      # /api/chat
│           ├── subjectRoutes.js   # /api/subjects
│           ├── assignmentRoutes.js# /api/assignments
│           ├── examRoutes.js      # /api/exams
│           ├── plannerRoutes.js   # /api/planner
│           ├── quizRoutes.js      # /api/quizzes
│           ├── flashcardRoutes.js # /api/flashcards
│           ├── timerRoutes.js     # /api/timer
│           ├── statsRoutes.js     # /api/stats
│           └── agentRoutes.js     # /api/agents
└── client/
    ├── package.json
    ├── vite.config.js             # Vite config with API proxy
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                # Core application router & state manager
        ├── api.js                 # Centralized frontend API client
        ├── index.css              # Custom scrollbars & 3D card flips
        └── components/
            ├── Navbar.jsx         # Header with streak counter & agent health
            ├── Sidebar.jsx        # Navigation sidebar with status badges
            ├── AgentTraceViewer.jsx # Multi-agent execution timeline
            ├── AgentSystemModal.jsx # Architecture diagram & credential guide
            ├── DashboardView.jsx  # Student command center & daily plan
            ├── ChatStudioView.jsx # Multi-agent conversational studio
            ├── SubjectsView.jsx   # Curriculum & topic mastery tracker
            ├── AssignmentsView.jsx# Assignment solver & milestone checklist
            ├── PlannerView.jsx    # Conflict-free timetable & schedule generator
            ├── ExamsView.jsx      # Countdown milestones & interactive quiz simulator
            ├── FlashcardsView.jsx # 3D Leitner 5-box spaced repetition
            └── TimerView.jsx      # Pomodoro focus timer & session logging
```

---

## 🔒 Academic Integrity & Data Protection
- **No Fabricated Records**: Deadlines, scores, and timetables are calculated using deterministic math; StudyPilot never invents student performance.
- **Secure Server-Side Storage**: API keys are strictly loaded through server-side environment variables and are never bundled into client assets.
- **Persistent Local Database**: All data is securely persisted in local SQLite with foreign key validation and transactions.
