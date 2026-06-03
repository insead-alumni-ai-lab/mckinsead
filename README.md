# 🧭 McKinsead — Agentic Strategy Cockpit

> A fleet of specialised LLM agents, coordinated by an Engagement Orchestrator, walking users through McKinsey-style strategy consulting methodology.

## Vision

McKinsead mirrors the full McKinsey consulting process as an AI-native SaaS product. From problem framing through hypothesis-driven analysis to slide-ready deliverables — with human-in-the-loop quality gates at every critical juncture.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  apps/web  (Next.js 14 · Tailwind · tRPC client)           │
│  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Dashboard│ │SWOT Canvas│ │  PESTEL  │ │Hypothesis    │   │
│  │         │ │  + TOWS   │ │  Canvas  │ │Tree Editor   │   │
│  └─────────┘ └───────────┘ └──────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  apps/api  (tRPC · Prisma · Express)                        │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌───────────┐  │
│  │Engagement│ │State Machine │ │Framework │ │Slide/Deck  │  │
│  │  Router  │ │  (7 stages)  │ │ Routers  │ │ Export     │  │
│  └──────────┘ └──────────────┘ └──────────┘ └───────────┘  │
├─────────────────────────────────────────────────────────────┤
│  packages/                                                   │
│  ┌────────┐ ┌────────────────┐ ┌─────────┐ ┌───────────┐   │
│  │schemas │ │pyramid-engine  │ │mece-    │ │slide-     │   │
│  │(Zod)   │ │(Minto logic)   │ │linter   │ │components │   │
│  └────────┘ └────────────────┘ └─────────┘ └───────────┘   │
├─────────────────────────────────────────────────────────────┤
│  mcp-servers/ (Model Context Protocol)                       │
│  ┌──────────┐ ┌───────────────┐ ┌──────────────────┐       │
│  │csv-upload│ │macro (WB/IMF) │ │news (sentiment)  │       │
│  └──────────┘ └───────────────┘ └──────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│  prompts/ (Versioned agent system prompts)                   │
│  orchestrator · scoping · swot · pestel · hypothesis ·      │
│  communication · critique                                    │
├─────────────────────────────────────────────────────────────┤
│  skills/ (Consulting methodology knowledge base)             │
│  mece-check · pyramid-principle · scqa-framing ·            │
│  so-what-writer · slide-grammar · exec-summary · chart-choice│
└─────────────────────────────────────────────────────────────┘
```

## The 7-Stage Workflow

```
🎯 SCOPE → 🔍 DIAGNOSE → 💡 HYPOTHESIZE → 📊 ANALYZE → 🧩 SYNTHESIZE → 📋 COMMUNICATE → 📤 EXPORT
    G1          G2              G3                            G4               G5
```

| Stage | What Happens | Gate |
|-------|-------------|------|
| **1. Scope** | Frame the problem using SCQA | G1: Problem Statement Lock |
| **2. Diagnose** | Run SWOT, PESTEL, Porter's 5, etc. | G2: Framework Selection Lock |
| **3. Hypothesize** | Build MECE hypothesis tree | G3: Hypothesis Tree Approval ⭐ |
| **4. Analyze** | Test each leaf hypothesis | — |
| **5. Synthesize** | Roll into Pyramid Principle narrative | G4: Pyramid Structure Lock |
| **6. Communicate** | Build slide deck | G5: Final Deck Approval |
| **7. Export** | HTML / PPTX / PDF | — |

## Non-Negotiable Principles

1. 🔲 **MECE everywhere** — every breakdown, every level
2. 💡 **Hypothesis before analysis** — never analyze without a hypothesis
3. 💬 **So-what discipline** — every chart, table, and slide carries a so-what
4. 📎 **Grounded claims** — every claim has a citation or evidence link
5. 🔺 **Pyramid before slides** — structure the narrative before rendering
6. 🔁 **Reversible state** — every mutation logged, pivots always possible

## Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm 9+, PostgreSQL

# 1. Clone and install
git clone https://github.com/insead-alumni-ai-lab/mckinsead.git
cd mckinsead
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and API keys

# 3. Initialize database
cd apps/api && npx prisma db push && cd ../..

# 4. Start development
pnpm dev
```

- **Web UI**: http://localhost:3000
- **API**: http://localhost:3001

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| API | tRPC, Express |
| Database | PostgreSQL + Prisma ORM |
| Schemas | Zod (shared client/server) |
| Monorepo | Turborepo + pnpm workspaces |
| Data Layer | MCP (Model Context Protocol) servers |
| Agent Prompts | Versioned Markdown (prompts/) |

## Milestones

### M0 — Walking Skeleton ✅ (Current)
- [x] Monorepo structure + build pipeline
- [x] Engagement Object schema (Zod)
- [x] State machine (7 stages, 5 gates)
- [x] tRPC API (engagements, frameworks, hypothesis, deck)
- [x] SWOT canvas with TOWS cross-strategies
- [x] PESTEL canvas with impact scoring
- [x] Hypothesis tree editor (manual)
- [x] HTML slide export
- [x] MCP: CSV upload, Macro data (World Bank), News (stub)
- [x] Agent system prompts (7 agents)
- [x] Consulting skills knowledge base

### M1 — Full Framework Suite (Next)
- [ ] All 10 frameworks (Porter 5, BCG, Ansoff, SIPOC, Value Chain, Root Cause)
- [ ] AnalysisAgent — automated hypothesis testing
- [ ] Full Pyramid Engine with validation
- [ ] CritiqueAgent — mandatory quality gates
- [ ] PPTX export (via pptxgenjs)
- [ ] Multi-tenant + SSO
- [ ] Real-time news enrichment
- [ ] Interactive charts (Chart.js / Recharts)

## Project Structure

```
mckinsead/
├── apps/
│   ├── api/              # tRPC API server
│   │   ├── prisma/       # Database schema
│   │   ├── src/
│   │   │   ├── routers/  # tRPC route handlers
│   │   │   ├── services/ # Business logic (state machine)
│   │   │   └── lib/      # Shared utilities
│   └── web/              # Next.js frontend
│       └── src/
│           ├── app/          # Pages (App Router)
│           ├── components/   # React components
│           │   ├── frameworks/   # SWOT, PESTEL canvases
│           │   ├── engagement/   # Scoping, Hypothesis views
│           │   └── layout/       # Stepper, navigation
│           └── lib/          # tRPC client, utils
├── packages/
│   ├── schemas/          # Shared Zod schemas
│   ├── pyramid-engine/   # Pyramid Principle logic
│   ├── mece-linter/      # MECE validation
│   └── slide-components/ # HTML slide rendering
├── mcp-servers/
│   ├── csv-upload/       # Internal: CSV data ingestion
│   ├── macro/            # External: World Bank / IMF
│   └── news/             # External: News + sentiment
├── prompts/              # Versioned agent system prompts
├── skills/               # Consulting methodology knowledge
├── evals/                # Golden test data
└── ideation/             # Original design docs (AGENTS.md, etc.)
```

## Contributing

See `ideation/AGENTS.md` for the full specification and design rationale.

## License

Proprietary — INSEAD Alumni AI Lab
