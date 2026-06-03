# CLAUDE.md

> **Project**: mckinsead — An Agentic Strategy Cockpit
> **Mission**: Mirror the McKinsey-style problem-solving workflow as a multi-agent SaaS, grounded in the client's real organization & data, enriched with live macro intelligence, and culminating in pyramid-principle slide decks.
> **Audience of this file**: Claude Code (and any sub-agent) working on this repository. Read this *before* writing or modifying any code.

---

## 1. Product Vision

mckinsead is **an integrated cockpit for strategy work**. It compresses the methodology a junior-to-partner consulting team applies over weeks into a guided, agent-driven workflow that:

1. Ingests the company's **own organizational reality** (org chart, P&L, products, customers, ops data, CRM, ERP, OKRs).
2. Continuously enriches that picture with **live external signals** (macro, FX, commodities, competitor filings, news, geopolitics).
3. Walks the user through the **classical strategy frameworks** — SWOT, PESTEL, Porter's Five Forces, BCG Matrix, Ansoff Matrix, SIPOC, Value Chain, Root Cause (5 Whys / Ishikawa), Hypothesis Tree, Hypothesis Testing.
4. Enforces the **MECE + hypothesis-driven** discipline of McKinsey-style problem solving.
5. Outputs the work as a **Pyramid Principle (Minto)** narrative, then renders it as **editable HTML slides** exportable to PPTX/PDF.

The product is not "one big LLM call". It is a **fleet of specialized agents**, each owning a framework or a stage, coordinated by an **Engagement Orchestrator**, sharing a **canonical strategy state** (the Engagement Object) and a **shared knowledge graph**.

---

## 2. Non-Negotiable Principles

These are guardrails. Any code, prompt, or agent that violates them must be rejected in review.

- **MECE everywhere.** Every breakdown (issues, drivers, hypotheses, segments) must be Mutually Exclusive and Collectively Exhaustive. Agents must self-check and flag gaps/overlaps.
- **Hypothesis before analysis.** No data pull happens until a falsifiable hypothesis is registered in the Hypothesis Tree. Analysis exists to *test* a hypothesis, not to "see what we find".
- **So-What discipline.** Every chart, table, or slide must carry an explicit `so_what` field. If the agent cannot write the so-what, the artifact is not done.
- **Grounded, not hallucinated.** External claims require a citation object (`{source, url, retrieved_at, confidence}`). Internal claims require a pointer to the client's data ID. Unsourced assertions are blocked at the writer layer.
- **Pyramid before slides.** A deck cannot be rendered until a Governing Thought + supporting arguments tree is approved.
- **Reversible state.** Every mutation of the Engagement Object is versioned and diffable. The user can pivot or roll back any framework run.
- **Human-in-the-loop at gates.** Five mandatory checkpoints (see §6). The orchestrator must stop and ask.

---

## 3. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        mckinsead COCKPIT (Web UI)                    │
│  Engagement view · Framework canvases · Hypothesis tree · Slide IDE  │
└──────────────────────────────┬───────────────────────────────────────┘
                               │  (tRPC / WebSocket)
┌──────────────────────────────▼───────────────────────────────────────┐
│                     ENGAGEMENT ORCHESTRATOR AGENT                    │
│  Owns the workflow state machine, gates, and routing between agents  │
└──┬────────────┬────────────┬────────────┬────────────┬──────────────┘
   │            │            │            │            │
┌──▼──┐     ┌───▼──┐     ┌───▼──┐     ┌───▼──┐     ┌───▼──┐
│Frame│     │Hypo- │     │Anal- │     │Synth-│     │Comm- │
│work │     │thesis│     │ysis  │     │esis  │     │unic. │
│Agents│    │Agent │     │Agent │     │Agent │     │Agent │
└──┬──┘     └───┬──┘     └───┬──┘     └───┬──┘     └───┬──┘
   │            │            │            │            │
┌──▼────────────▼────────────▼────────────▼────────────▼──────────────┐
│                   SHARED CONTEXT LAYER                              │
│  Engagement Object (JSON) · Knowledge Graph · Evidence Store        │
└──┬──────────────────────────────────────────────────────────────────┘
   │
┌──▼──────────────────────────────────────────────────────────────────┐
│                          MCP TOOL LAYER                             │
│  Internal data MCPs · External data MCPs · Compute MCPs · Render    │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.1 Agents (each is a separate role with its own system prompt and skill bundle)

| Agent | Responsibility | Reads | Writes |
|---|---|---|---|
| `OrchestratorAgent` | State machine, gating, user dialogue, scoping | Engagement Object | Stage transitions, user prompts |
| `ScopingAgent` | Problem statement, decision-maker, criteria, constraints (SCQA) | User inputs, org data | `engagement.problem_statement` |
| `FrameworkAgent.SWOT` | Run SWOT against current evidence | Evidence store | `frameworks.swot` |
| `FrameworkAgent.PESTEL` | Pull macro/geopolitical signals, map to client | External MCPs | `frameworks.pestel` |
| `FrameworkAgent.Porter5` | Industry structure | Filings, market data | `frameworks.porter5` |
| `FrameworkAgent.BCG` | Portfolio matrix from P&L by SKU/BU | ERP/finance | `frameworks.bcg` |
| `FrameworkAgent.Ansoff` | Growth options matrix | Strategy state | `frameworks.ansoff` |
| `FrameworkAgent.SIPOC` | Process scoping | Ops data | `frameworks.sipoc` |
| `FrameworkAgent.ValueChain` | Primary + support activities cost/value | Cost data | `frameworks.value_chain` |
| `FrameworkAgent.RootCause` | 5 Whys + Ishikawa | Evidence | `frameworks.root_cause` |
| `HypothesisAgent` | Build and maintain the Hypothesis Tree | Frameworks | `hypothesis_tree` |
| `AnalysisAgent` | Test each leaf hypothesis with the right method | Data MCPs | `analyses[]` |
| `SynthesisAgent` | Roll leaf findings into governing thought (pyramid) | Analyses | `pyramid` |
| `CommunicationAgent` | Storyline → slides → HTML deck | Pyramid | `deck.html` |
| `CritiqueAgent` | Red-team every artifact for MECE, bias, sourcing | All | Inline annotations |

The `CritiqueAgent` runs **after every other agent** as a mandatory linter.

### 3.2 Skills (markdown-defined competencies, loaded on demand)

Skills are static reference assets the agents load when a task matches. Each lives in `/skills/<name>/SKILL.md` and may carry templates, examples, and small scripts. Examples:

- `skills/mece-check/` — heuristic checks + LLM prompt to validate MECE.
- `skills/pyramid-principle/` — Minto pyramid templates, governing thought patterns.
- `skills/scqa-framing/` — Situation-Complication-Question-Answer scaffolds.
- `skills/so-what-writer/` — Force every chart to have a so-what title.
- `skills/exec-summary/` — One-page exec summary patterns.
- `skills/slide-grammar/` — Action titles, lead-with-answer, one-message-per-slide.
- `skills/chart-choice/` — Map data shape → chart type (waterfall, Marimekko, etc.).
- `skills/financial-modeling/` — DCF, sensitivity, scenario.
- `skills/quick-math/` — Order-of-magnitude / Fermi estimation patterns.

### 3.3 MCP Servers (tools — they execute code, hit APIs)

**Internal data MCPs** (one per integration, OAuth-scoped per tenant):
- `mcp-erp` (SAP / NetSuite / Odoo) — P&L, BOM, inventory.
- `mcp-crm` (Salesforce / HubSpot) — pipeline, churn, NPS.
- `mcp-hris` (Workday / BambooHR) — org chart, headcount, span of control.
- `mcp-data-warehouse` (Snowflake / BigQuery / Redshift) — SQL execution .
- `mcp-docs` (Google Drive / SharePoint / Notion) — strategy docs, prior decks.
- `mcp-okr` (Lattice / Ally / Asana) — current goals.

**External data MCPs**:
- `mcp-macro` — IMF, World Bank, OECD, central banks (rates, inflation, GDP).
- `mcp-markets` — equities, FX, commodities, yields (live + historical).
- `mcp-filings` — SEC EDGAR, AMF, Companies House (10-K, 10-Q, proxies).
- `mcp-news` — global press + sentiment, with source-quality scoring.
- `mcp-geopol` — sanctions lists, GDELT, country risk indices.
- `mcp-industry` — Statista / IBISWorld / proprietary research feeds.
- `mcp-patents` — USPTO / EPO for innovation signals.

**Compute & render MCPs**:
- `mcp-sql` — read-only query runner with row caps and PII redaction.
- `mcp-python` — pandas/numpy/statsmodels for analyses.
- `mcp-charts` — deterministic chart renderer (Vega-Lite / ECharts spec → SVG/PNG).
- `mcp-slides` — HTML slide composer + PPTX/PDF exporter.

**Rule**: agents never call external APIs directly. They call MCPs. MCPs handle auth, rate limiting, caching, and audit logging.

---

## 4. The Engagement Object (canonical state)

All agents read/write a single versioned JSON document. This is the source of truth.

```jsonc
{
  "engagement_id": "uuid",
  "tenant_id": "uuid",
  "version": 17,
  "stage": "analysis",            // scoping|frameworks|hypothesis|analysis|synthesis|communication
  "problem_statement": {
    "scqa": { "situation": "...", "complication": "...", "question": "...", "answer_hypothesis": "..." },
    "decision_maker": "CEO",
    "deadline": "2026-09-30",
    "success_criteria": ["..."],
    "out_of_scope": ["..."]
  },
  "company_profile": {
    "org_chart_ref": "hris://...",
    "bus": [ { "id": "bu_eu_retail", "revenue_ttm": 412000000, ... } ],
    "products": [ ... ],
    "geographies": [ ... ]
  },
  "external_context": {
    "pestel_signals": [ { "id":"...", "category":"political", "claim":"...", "source":{...}, "retrieved_at":"..." } ]
  },
  "frameworks": {
    "swot": { ... }, "pestel": { ... }, "porter5": { ... },
    "bcg": { ... }, "ansoff": { ... }, "sipoc": { ... },
    "value_chain": { ... }, "root_cause": { ... }
  },
  "hypothesis_tree": {
    "governing": "We can restore 8% EBIT margin by FY27",
    "children": [
      { "id":"h1", "claim":"...", "status":"supported|refuted|untested",
        "tests":["analysis_id_..."], "evidence":["ev_..."], "children":[...] }
    ]
  },
  "analyses": [
    { "id":"a_42", "hypothesis_id":"h1.2", "method":"regression",
      "inputs":[...], "result":{...}, "so_what":"...", "confidence":0.78 }
  ],
  "pyramid": {
    "governing_thought": "...",
    "key_lines": [ { "argument":"...", "supports":["a_42","a_43"] } ]
  },
  "deck": { "slides": [ ... ], "html_uri": "..." },
  "audit_log": [ { "ts":"...", "agent":"...", "action":"...", "diff":"..." } ]
}
```

Every write goes through a JSON-Schema validator (`schemas/engagement.schema.json`). Schema drift breaks the build.

---

## 5. Workflow — the McKinsey-mirrored State Machine

```
[1] SCOPE  ──►  [2] DIAGNOSE  ──►  [3] HYPOTHESIZE  ──►  [4] ANALYZE
                                                              │
                                                              ▼
[7] EXPORT  ◄──  [6] COMMUNICATE  ◄──────────────────  [5] SYNTHESIZE
```

| # | Stage | Owner agent | Frameworks invoked | Exit gate |
|---|---|---|---|---|
| 1 | **Scope** | Scoping | SCQA, decision-maker interview | User signs off problem statement |
| 2 | **Diagnose** | Framework agents | SWOT, PESTEL, Porter5, BCG, Ansoff, SIPOC, Value Chain, Root Cause | At least 3 frameworks completed and critiqued |
| 3 | **Hypothesize** | Hypothesis | Hypothesis Tree (MECE) | Tree has ≥1 governing hypothesis and all leaves are testable |
| 4 | **Analyze** | Analysis | Quant + qual tests per leaf | Every leaf has status ≠ `untested` or is explicitly deprioritized |
| 5 | **Synthesize** | Synthesis | Pyramid Principle | Governing thought + key-line arguments approved |
| 6 | **Communicate** | Communication | Storyline → HTML slides | All slides have action titles, sourced charts, so-what |
| 7 | **Export** | Communication | PPTX / PDF / shareable link | Final artifact stored, audit log frozen |

**Pivot loop**: at any stage the user can issue `pivot(reason)` — the orchestrator forks the engagement, preserving lineage, and restarts from the chosen stage.

---

## 6. Human-in-the-Loop Gates (mandatory)

The orchestrator **must** pause and ask for explicit user confirmation at these five points. Auto-advance is forbidden.

1. **G1 — Problem statement lock** (end of Scope).
2. **G2 — Framework selection** (which frameworks to actually run — not all are always relevant).
3. **G3 — Hypothesis tree approval** (the most important gate; bad tree = wasted analysis).
4. **G4 — Pyramid storyline approval** (before slide rendering).
5. **G5 — Deck export approval** (final review).

Gate prompts use the `ask_user_questions`-style interaction pattern: concise noun-phrase questions, 2-6 options, plus a free-text "other".

---

## 7. Framework Specs (what each agent must produce)

Each framework agent outputs a structured object **and** a human-readable rationale. Below are the contracts.

### 7.1 SWOT
```ts
{ strengths: Item[], weaknesses: Item[], opportunities: Item[], threats: Item[],
  cross_strategies: { so:string[], wo:string[], st:string[], wt:string[] } }
// Item = { claim, evidence_ids[], confidence, magnitude }
```
The cross_strategies block (SO/WO/ST/WT) is mandatory — a SWOT without it is half-done.

### 7.2 PESTEL
Six buckets (Political, Economic, Social, Technological, Environmental, Legal). Each signal must come from `mcp-macro`, `mcp-news`, `mcp-geopol`, or `mcp-filings` with a citation. Each signal scored on **impact (1-5)** and **time horizon (0-6m / 6-24m / 24m+)**.

### 7.3 Porter's Five Forces
For each force (rivalry, new entrants, substitutes, supplier power, buyer power): qualitative narrative + a 1-5 intensity score + 2-3 quantitative anchors (e.g., HHI for rivalry, capex intensity for entrants).

### 7.4 BCG Matrix
Auto-populated from `mcp-erp` and `mcp-data-warehouse`: each BU/SKU placed by market growth (external) × relative market share (internal/external). Output includes recommended action per quadrant.

### 7.5 Ansoff
2×2 of (existing/new market) × (existing/new product). Each cell holds candidate moves linked back to the BCG cash cows / stars.

### 7.6 SIPOC
Suppliers · Inputs · Process · Outputs · Customers. One row per critical process. Used to scope operational deep-dives.

### 7.7 Value Chain (Porter)
Primary (inbound, ops, outbound, marketing, service) + support (firm infra, HR, tech, procurement). Each activity tagged with cost share, differentiation contribution, and a margin gap vs. benchmark when available.

### 7.8 Root Cause
5 Whys chains **and** an Ishikawa (fishbone) with the 6M categories (Man, Machine, Material, Method, Measurement, Mother Nature). Output feeds directly into the Hypothesis Tree.

### 7.9 Hypothesis Tree
- Governing hypothesis at the root.
- Children must be **MECE** (the `CritiqueAgent.mece_check` skill enforces this).
- Each leaf must be **falsifiable** — the agent must be able to name the data and the test that would refute it.
- Each leaf carries a `prioritization_score = impact × ease_of_testing × confidence_gap`.

### 7.10 Hypothesis Testing
For each leaf, the AnalysisAgent picks a method:
- Descriptive (segmentation, cohort)
- Comparative (benchmark, t-test, A/B)
- Causal (regression, diff-in-diff, instrumental var.)
- Forecasting (scenario, Monte Carlo)
- Qualitative (expert interview synthesis)

Result schema: `{ method, inputs, output, so_what, confidence, limitations }`.

### 7.11 Pyramid Principle
- One **Governing Thought** (the answer).
- 3-5 **Key Lines** that, taken together, prove the governing thought (MECE).
- Each Key Line backed by 2-4 analyses.
- Storyline written top-down (answer first), never bottom-up.

### 7.12 HTML Slide Building
Every slide follows:
- **Action title** (lead with the so-what, full sentence, ≤14 words).
- **One message per slide.**
- **Body**: chart or table or 3-bullet evidence — never both a chart and a long bullet list.
- **Footer**: source citations.
- Tech: a small set of typed React/MDX components (`<KPI>`, `<Waterfall>`, `<Marimekko>`, `<Heatmap>`, `<QuoteBox>`, `<BulletStack>`); the renderer produces HTML and a PPTX twin via `mcp-slides`.

---

## 8. Data Enrichment Loop

A background `EnrichmentAgent` runs on a schedule per tenant:

1. Pulls fresh signals from external MCPs.
2. Diffs against `external_context`.
3. For each material change, flags affected hypotheses (`hypothesis.status → needs_revisit`) and notifies the user.
4. Never mutates conclusions silently — the user must accept or reject the impact.

This is what makes the cockpit *living* rather than a one-shot report.

---

## 9. Repository Layout

```
/apps
  /web              # Next.js cockpit UI (canvases, slide IDE)
  /api              # tRPC + WebSocket gateway
/agents
  /orchestrator
  /scoping
  /frameworks/{swot,pestel,porter5,bcg,ansoff,sipoc,value_chain,root_cause}
  /hypothesis
  /analysis
  /synthesis
  /communication
  /critique
  /enrichment
/skills             # SKILL.md bundles (see §3.2)
/mcp-servers        # one folder per MCP, each with a manifest + Dockerfile
/packages
  /schemas          # JSON Schemas + zod types for Engagement Object
  /slide-components # React/MDX slide primitives
  /pyramid-engine   # Minto pyramid builder utilities
  /mece-linter      # static + LLM-assisted MECE checks
/prompts            # versioned system prompts per agent
/evals              # golden engagements + regression tests
/infra              # Terraform, K8s, observability
CLAUDE.md           # this file (read first)
```

---

## 10. Tech Stack (recommendations, not handcuffs)

- **LLM**: Claude (primary) for reasoning agents; smaller models for classification/embedding.
- **Agent runtime**: TypeScript, MCP SDK, with a thin orchestrator layer (LangGraph or in-house state machine).
- **Backend**: Node 20 + tRPC; Postgres (engagement state) + pgvector (evidence embeddings) + S3 (artifacts).
- **Frontend**: Next.js 14, React Server Components, Tailwind, MDX for slides.
- **Compute**: `mcp-python` call for local python calls.
- **Observability**: OpenTelemetry traces per agent step + token/$ accounting.

---

## 11. Coding Conventions for Claude (and any contributor)

- **One agent = one folder = one system prompt**. Never blend agents.
- **No prompt strings inline in app code**. Prompts live in `/prompts/<agent>/v<N>.md` and are loaded by reference.
- **All MCP calls go through a typed client**. No raw `fetch` from agents.
- **Every artifact carries provenance.** A chart without sources fails CI.
- **Tests are golden engagements**. `/evals/golden/<case>/expected.json` — agents must reproduce known good outputs within tolerance.
- **Schemas first**. Modify `packages/schemas` before touching agent code; the rest of the codebase is generated/typed from it.
- **Small diffs**. One framework, one PR. Cross-cutting changes need a design note in `/docs/adr/`.

---

## 12. Security, Privacy, Compliance

- **Tenant isolation** at the database row level (RLS) and at the MCP credential vault.
- **PII redaction** in `mcp-data-warehouse` before any column reaches an LLM.
- **No training on tenant data.** Enforced via provider flags + contractual.
- **Audit log is append-only** and exportable (SOC 2 / ISO 27001 readiness).
- **Right to deletion**: cascading erase across engagement, evidence store, embeddings, derived artifacts.

---

## 13. Definition of Done — for any feature

A feature is *done* only when:

1. JSON Schema updated and validated.
2. Agent prompt versioned and added to `/prompts`.
3. Golden engagement updated; regression eval green.
4. CritiqueAgent passes (MECE, sourcing, so-what coverage).
5. Slide rendering produces a deck that opens cleanly in PowerPoint *and* Keynote.
6. Observability dashboard shows the new step in the trace.
7. CLAUDE.md updated if behavior or contract changed.

---

## 14. What this product is *not*

- Not a generic chatbot wrapper. The frameworks and the gating are the moat.
- Not a BI dashboard. It produces *recommendations with a narrative*, not just charts.
- Not a "click to generate deck" toy. The pyramid and hypothesis tree are first-class artifacts; the deck is the *export*, not the product.
- Not a replacement for the strategist. It is a cockpit; the human pilots.

---

## 15. First Milestone (M0 → M1)

**M0 — Walking skeleton (4 weeks)**: Orchestrator + Scoping + SWOT + PESTEL + Hypothesis Tree (manual) + plain-HTML slide export. One internal MCP (CSV upload) + two external MCPs (`mcp-macro`, `mcp-news`). Single tenant, no auth.

**M1 — Pilot ready (12 weeks)**: All ten frameworks, AnalysisAgent with `mcp-python` + `mcp-sql`, full pyramid engine, CritiqueAgent live, PPTX export, multi-tenant + SSO, three reference integrations (Snowflake, Salesforce, Google Drive).

---

**End of CLAUDE.md.** Any agent reading this file should now know *what* to build, *why* it matters, *how* the pieces fit, and *where* the guardrails are. When in doubt, re-read §2 and §6.

---

