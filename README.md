# mckinsead — Agentic Strategy Cockpit

> McKinsey-grade strategy analysis powered by a fleet of specialized AI agents.

**mckinsead** is a multi-agent SaaS that walks users through a full strategy engagement — from problem scoping to slide deck export — using the same frameworks and disciplines taught at top consulting firms.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Next.js Frontend                     │
│  Dashboard · SCQA Scoping · 8 Framework Canvases      │
│  Hypothesis Tree · Analysis · Pyramid · Slide Builder │
└──────────────────────┬──────────────────────────────┘
                       │ tRPC
┌──────────────────────┴──────────────────────────────┐
│                   API Server                          │
│  Prisma/Postgres · State Machine · Audit Trail        │
│  Auth (Multi-tenant + SSO) · Critique Engine          │
└──────────────────────┬──────────────────────────────┘
                       │ MCP
┌──────────────────────┴──────────────────────────────┐
│                  MCP Servers                          │
│  csv-upload · macro · news · python · sql · slides    │
└─────────────────────────────────────────────────────┘
```

## Milestone Status

| Milestone | Status | Scope |
|-----------|--------|-------|
| **M0** — Walking Skeleton | ✅ Merged | Monorepo, SWOT/PESTEL/Hypothesis, HTML export |
| **M1** — Pilot Ready | 🚧 PR Open | All 10 frameworks, Analysis, Critique, PPTX, Auth |
| **M2** — Production | 🔮 Planned | LLM integration, live agent orchestration |

## What's in M1

### Frameworks (all 10)
| Framework | Canvas | Agent Prompt |
|-----------|--------|--------------|
| SWOT + TOWS | ✅ Interactive 4-quadrant editor | ✅ v1 |
| PESTEL | ✅ 6-category signal editor | ✅ v1 |
| Porter's Five Forces | ✅ Radar + detail cards | ✅ v1 |
| BCG Growth-Share Matrix | ✅ Bubble plot + quadrant classification | ✅ v1 |
| Ansoff Growth Matrix | ✅ 2×2 with feasibility/attractiveness scoring | ✅ v1 |
| SIPOC | ✅ Multi-row process mapping table | ✅ v1 |
| Porter Value Chain | ✅ Arrow visualization + cost/differentiation | ✅ v1 |
| Root Cause (5 Whys + Ishikawa) | ✅ Dual-mode analysis canvas | ✅ v1 |

### Analysis & Synthesis
- **AnalysisPanel**: Test hypotheses with 5 methods (descriptive, comparative, causal, forecasting, qualitative)
- **SynthesisPanel**: Minto Pyramid builder (governing thought + MECE key lines)
- **CommunicationPanel**: Slide builder with consulting slide grammar
- **CritiquePanel**: 7-check quality linter (MECE, sourcing, so-what, bias, consistency, completeness, actionability)
- **ExportPanel**: HTML / PPTX / PDF export with theme options

### Multi-tenant + SSO
- Tenant, User, Session models in Prisma
- Email login (dev) + Google/Azure AD/Okta SSO callbacks
- Role-based access: owner, admin, analyst, viewer

### MCP Servers (6)
| Server | Purpose | Status |
|--------|---------|--------|
| `csv-upload` | Internal data ingestion | ✅ Working (in-memory) |
| `macro` | World Bank / IMF indicators | ✅ Working (live API) |
| `news` | News sentiment | 🔌 Stub |
| `python` | Pandas/numpy/statsmodels analytics | 🔌 Stub |
| `sql` | Snowflake/Postgres query runner (read-only) | 🔌 Stub |
| `slides` | PPTX export via pptxgenjs | ✅ Working |

### Agent System (16 agents)
Scoping, SWOT, PESTEL, Porter 5, BCG, Ansoff, SIPOC, Value Chain, Root Cause, Hypothesis, Analysis, Synthesis, Communication, Critique, Enrichment, Orchestrator

### Consulting Skills Knowledge Base (9 skills)
`mece-check`, `pyramid-principle`, `scqa-framing`, `so-what-writer`, `slide-grammar`, `exec-summary`, `chart-choice`, `financial-modeling`, `quick-math`

### Gates (Human-in-the-Loop)
| Gate | Stage | Purpose |
|------|-------|---------|
| G1 | Scoping | Approve SCQA framing |
| G2 | Frameworks | Approve framework selection |
| G3 | Hypothesis | Approve hypothesis tree |
| G4 | Synthesis | Approve pyramid storyline |
| G5 | Communication | Approve final deck |

## Monorepo Structure

```
mckinsead/
├── apps/
│   ├── api/                  # tRPC API server + Prisma
│   └── web/                  # Next.js 14 frontend
├── packages/
│   ├── schemas/              # Shared Zod schemas
│   ├── pyramid-engine/       # Pyramid validation + slide outlines
│   ├── mece-linter/          # Heuristic MECE validation
│   └── slide-components/     # HTML + PPTX slide renderers
├── mcp-servers/
│   ├── csv-upload/           # CSV ingestion
│   ├── macro/                # World Bank / IMF data
│   ├── news/                 # News sentiment
│   ├── python/               # Python analytics sandbox
│   ├── sql/                  # SQL query runner
│   └── slides/               # PPTX generation
├── prompts/                  # 16 versioned agent system prompts
├── skills/                   # 9 consulting methodology skills
└── evals/golden/             # Golden test cases
```

## Getting Started

```bash
# Prerequisites: Node 20+, pnpm 9+, PostgreSQL
git clone https://github.com/insead-alumni-ai-lab/mckinsead.git
cd mckinsead

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Initialize database
cd apps/api && npx prisma migrate dev && cd ../..

# Start development
pnpm dev
```

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **API**: tRPC, Prisma, PostgreSQL
- **Build**: Turborepo, pnpm workspaces
- **Export**: pptxgenjs (PPTX), custom HTML renderer
- **Schemas**: Zod (shared between frontend and API)

## Non-Negotiables (from AGENTS.md §2)
1. **MECE everywhere** — every breakdown must be mutually exclusive, collectively exhaustive
2. **Hypothesis before analysis** — never gather data without a testable claim
3. **So-what discipline** — every finding must answer "so what does this mean?"
4. **Grounded claims** — every assertion needs a citation or evidence ID
5. **Pyramid before slides** — always structure the narrative before building the deck
6. **Reversible state** — any user can undo/redo; every action is audited
7. **Human-in-the-loop** — 5 gates where the orchestrator must pause for approval

---

Built by the INSEAD Alumni AI Lab.
