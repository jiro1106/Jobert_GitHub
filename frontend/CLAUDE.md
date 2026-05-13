# CLAUDE.md

This file provides guidance to Claude Code when working with the SignalPH codebase.

---

## Project Overview

**SignalPH** is a web-based, predictive, route-based mobile network coverage estimation system for the Philippines. It helps users (students, commuters, tourists, employees, teachers) identify the most reliable mobile network provider (Globe, Smart, DITO) for their travel routes by combining computed coverage estimates, crowdsourced reports, and anomaly detection.

The system is powered by a **Narrow Agent Web** — an internal orchestration layer of lightweight, specialized local AI agents (not a general-purpose chatbot). Each agent handles a narrow, well-defined task to maximize accuracy, speed, and explainability while keeping the system resource-efficient.

**Stage:** Prototyping / initial version. Optimize for clarity, simplicity, and shipping a working MVP — not for scale, advanced ML, or cloud-heavy pipelines (those are explicitly future work).

---

## Target Users

Ordinary Filipino users with **limited technical background**. They want quick, glanceable answers — not signal engineering dashboards. Design and language choices must reflect this.

---

## Tech Stack

> Update this section as the stack is finalized.

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** FastAPI
- **Database:** Supabase (Postgres)
- **Maps:** [PLACEHOLDER: Leaflet / Mapbox / Google Maps — TBD]
- **AI agents:** Local, lightweight — rule-based + small models. Avoid heavy LLM calls in v1.
- **Deployment:** Vercel (frontend), [PLACEHOLDER: backend host TBD]

**Architectural rule:** The frontend **never** talks to Supabase directly. All data access goes through the Node.js + Express backend API.

---

## Project Structure

```
signalph/
├── client/                    # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level pages
│   │   ├── features/          # Feature modules (route-input, map, reports, etc.)
│   │   ├── lib/               # API clients, utilities
│   │   ├── hooks/             # Custom React hooks
│   │   └── types/             # Shared TypeScript types
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── agents/            # Narrow Agent Web — one folder per agent
│   │   ├── services/          # Business logic, DB access
│   │   ├── middleware/        # Auth, validation, rate limiting
│   │   └── db/                # Supabase client, migrations
└── docs/                      # Architecture notes, agent specs
```

---

## Core Modules

1. **Route Input Module** — accepts start/destination, place search, or natural-language questions.
2. **Coverage Visualization Module** — interactive map with provider heatmaps and route overlays.
3. **Narrow Agent Web Orchestration Module** — coordinates the local AI agents listed below.
4. **Crowdsourced Signal Reporting Module** — user-submitted real-world signal reports.
5. **Recommendation Module** — suggests the best SIM provider per route.
6. **Anomaly Event Logging Module** — logs mismatches between predicted vs. reported signal.
7. **Notification and Offline Readiness Module** — alerts before low-connectivity zones.

---

## The Narrow Agent Web

Each agent lives in `server/src/agents/<agent-name>/` and exposes a single function. Agents must stay **narrow, focused, and explainable**. No agent should drift into general chatbot behavior.

| Agent                                     | Responsibility                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| **Question Router Agent**                 | Classifies user questions and routes them to the correct downstream agent or module. |
| **Route Analysis Agent**                  | Breaks a route into segments and gathers signal estimates per segment.               |
| **Route Coverage Explainer Agent**        | Produces short, plain-language explanations of coverage along a route.               |
| **Crowdsourced Summary Agent**            | Summarizes recent user reports for a location or route segment.                      |
| **Weak-Signal Detector Agent**            | Identifies route segments with predicted weak or no signal.                          |
| **SIM Recommender Agent**                 | Compares provider performance and outputs a single practical recommendation.         |
| **Low-Connectivity Anomaly Logger Agent** | Logs and tags mismatches (predicted strong / reported weak) with likely causes.      |
| **Offline Readiness Alert Agent**         | Generates pre-trip preparation alerts before weak-signal zones.                      |

**Agent design rules:**

- Prefer **rules + structured workflows + light AI** over heavy LLM calls.
- Every agent must return **structured, typed output** — never free-form text dumped into the UI.
- Every agent must produce a short **plain-language explanation** the frontend can display directly.
- No agent calls another agent except through the **Orchestration Module**.

---

## Plan-First Workflow (Important)

When I say **"I would like to: [feature/change]"**, do **not** write any code yet. Instead:

1. Propose a full plan and implementation strategy, step by step.
2. Explain how it avoids breaking existing functionality.
3. Describe how you'll keep the code clean and lightweight.
4. Identify risks and mitigations.
5. Ask if I accept the plan.

If I follow up with another **"I would like to: [question/change]"**, respond only to that and wait.

When I say **"Okay please proceed,"** implement only what was specified — no extras, no removals.

At each step, ask yourself: _"Am I adding any functionality, code, or complexity that wasn't explicitly requested?"_ If yes, stop and confirm.

---

## Coding Conventions

### General

- **Explain code whenever code is shared or written.** Walk through what each part does in plain language.
- **Explain technical concepts as if to a 12-year-old** — simple, clear, no jargon dumps.
- Assume **beginner-level frontend knowledge** (HTML, CSS, JS, React). Favor clarity over cleverness.
- Prototyping mindset: ship the smallest thing that works, then iterate.

### Frontend

- React functional components + hooks only.
- TypeScript everywhere — no `any` unless justified inline.
- Tailwind for styling. No inline styles unless dynamic.
- All API calls go through a single Axios instance (`client/src/lib/api.ts`).
- The frontend **never** imports the Supabase client directly.
- Always handle loading, empty, and error states — never leave them blank.
- Mobile-first responsive design.

### Backend

- Express routes stay thin — push logic into `services/` and `agents/`.
- Validate every incoming request body (use Zod or similar).
- Return consistent JSON envelopes: `{ data, error, meta }`.
- Rate-limit endpoints that accept user submissions (reports, questions).
- Use the **Storage facade pattern** for image/file handling (consistent across all controllers).

### Agents

- Each agent = one folder with `index.ts`, `types.ts`, `README.md`.
- Each agent's `README.md` explains: input, output, logic, and example.
- Pure functions where possible. Side effects (DB writes, logging) go in services.

---

## Design & UX Rules

- **Map is the hero.** Never bury the map under chrome.
- **Plain language only.** Translate technical signal data to: Strong / Moderate / Weak / No Signal.
- **Glanceable insights** — users should understand a recommendation in under 3 seconds.
- Provider color conventions (use placeholders until brand approval):
  - Globe = blue
  - Smart = green
  - DITO = red/magenta
- AI features get a subtle sparkle icon — helpful, not flashy.
- Always include loading skeletons and empty-state illustrations.

---

## Data Placeholders

While the system is in early development, use clearly labeled placeholders for data that doesn't exist yet:

- `[PLACEHOLDER: route distance]`
- `[PLACEHOLDER: estimated travel time]`
- `[PLACEHOLDER: signal score per segment]`
- `[PLACEHOLDER: crowdsourced report count]`
- `[PLACEHOLDER: provider logo]`
- `[PLACEHOLDER: AI-generated explanation text]`
- `[PLACEHOLDER: heatmap tile data]`

When mocking API responses, return realistic-shaped fake data that matches the real type contract.

---

## What This Project Is NOT (Yet)

To prevent scope creep, the following are **future work** and should not be built in v1 unless explicitly requested:

- Real-time data pipelines.
- Large ML models or training infrastructure.
- Cloud-heavy processing.
- Native mobile apps (web-first, mobile-responsive only).
- Multi-language support beyond English + Filipino strings later.
- Advanced user accounts, social features, or gamification.
- Direct telco/carrier API integrations.

---

## Communication Style

- Supportive, encouraging, confidence-building, with subtle humor.
- No hedging, no opt-ins, no unnecessary disclaimers.
- Honest critique preferred over empty agreement — if a plan has a flaw, say so.
- Work through arithmetic and logic step by step; never one-shot tricky calculations.

---

## Commands

> Update these as scripts are added.

```bash
# Frontend
cd client
npm install
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build

# Backend
cd server
npm install
npm run dev          # Start Express in watch mode
npm run build        # Compile TypeScript
npm start            # Run compiled server
```

---

## Environment Variables

Frontend (`client/.env`):

```
VITE_API_BASE_URL=http://localhost:3000
```

Backend (`server/.env`):

```
PORT=3000
SUPABASE_URL=[PLACEHOLDER]
SUPABASE_SERVICE_KEY=[PLACEHOLDER]
NODE_ENV=development
```

---

## When Stuck

If a request is ambiguous, ask **one clarifying question** before proceeding. If multiple approaches are viable, present 2–3 options with tradeoffs and let me pick.
