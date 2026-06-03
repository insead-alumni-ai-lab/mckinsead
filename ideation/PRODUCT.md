# McKinsead — Strategy Cockpit SaaS Platform
## Product Requirements Document

---

> **Owner**: Yawo Kpotufe
> **Date**: 2026-06-03
> **Version**: 1.0
> **Status**: Draft
> **Application**: mckinsead (Next.js)

---

## 1. Project Overview

### 1.1 Problem Statement
**Busy leaders and strategy teams lack a unified, guided tool to execute rigorous consulting-grade strategic analysis.**

- **Current Pain Point**: Strategy work today is fragmented across PowerPoints, spreadsheets, whiteboards, and ad-hoc research. Leaders either pay $500K+ for top-tier consulting engagements or attempt frameworks in isolation without workflow guidance, data enrichment, or structured outputs.
- **Impact**: Strategy Directors, C-Suite executives, and internal strategy teams waste weeks assembling analyses that consultants produce in structured sprints. Quality suffers, insights are missed, and deliverables lack the rigor and polish of McKinsey/BCG/Bain outputs.
- **Root Cause**:
  - No single product integrates the full consulting workflow (diagnose → analyze → synthesize → communicate)
  - Existing tools (Miro, Notion, Excel) are general-purpose — they don't encode strategy methodology
  - Real-time market/economic data is disconnected from strategic analysis
  - AI/LLM capabilities are not purpose-built for strategy frameworks

### 1.2 Solution Overview
- **Proposed Solution**: McKinsead is a multi-tenant SaaS strategy cockpit that guides users through a complete consulting engagement workflow — from problem framing through hypothesis testing to polished executive communication — powered by LLM agents, real-time data feeds, and interactive framework modules.
- **Key Differentiators**:
  - **Guided Workflow Engine**: Step-by-step consulting methodology (Create → Analyse → Amend → Enhance → Pivot)
  - **12 Integrated Strategy Frameworks**: SWOT, PESTEL, Porter's 5 Forces, BCG Matrix, Ansoff Matrix, SIPOC, Value Chain, Root Cause Analysis, Hypothesis Formation, Hypothesis Testing, Pyramid Principle, HTML Slide Builder
  - **LLM-Powered Intelligence**: AI suggestions, auto-generation, and critique at every step
  - **Real-Time Data Enrichment**: Live economic, financial, and geopolitical data woven into analyses
  - **Agent Architecture with MCP Tools**: Extensible plugin system for each framework module
  - **Pyramid Principle Export**: Polished HTML presentations structured for executive consumption

### 1.3 Business Justification
- **Business Value**: Democratizes McKinsey-grade strategic analysis for any organization with a strategy function. Enables 10x faster strategy development cycles at a fraction of consulting costs.
- **Expected ROI**:
  - Replace/complement $200K–$2M consulting engagements
  - Reduce strategy development time from 6–12 weeks to 1–2 weeks
  - Enable continuous strategy iteration vs. annual strategy offsites
- **Risk of Not Doing**: Competitors (Cascade, Quantive, StrategyTools.io) are adding AI features. First-mover advantage in the "AI Strategy Cockpit" category is time-limited.

### 1.4 Key Stakeholders

| Role | Name / Team | Responsibility |
|------|-------------|----------------|
| **Product Owner** | Yawo Kpotufe | Vision, requirements, final sign-off |
| **Development Team** | Engineering | Full-stack implementation (Next.js + AI layer) |
| **End Users** | Strategy professionals | Primary consumers — consultants, directors, executives |
| **Data Partners** | External APIs | Financial, economic, geopolitical data providers |
| **AI/LLM Providers** | OpenAI / Anthropic / Custom | LLM inference for insights and generation |

---

## 2. Goals & Success Criteria

### 2.1 Expected Outcomes
1. **Complete guided strategy workflow** — Users can execute end-to-end consulting-style analyses without external tools
2. **AI-enriched analysis** — Every framework module provides intelligent suggestions based on user context and real-time data
3. **Executive-ready output** — Strategy deliverables exported as polished HTML slides following Pyramid Principle structure
4. **Team collaboration** — Multiple team members contribute to a single strategy engagement simultaneously
5. **Continuous strategy iteration** — Organizations can revisit, amend, and pivot strategies with historical context preserved

### 2.2 Success Metrics (KPIs)

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|--------------------|
| **Time-to-first-strategy-output** | N/A (new product) | < 4 hours for a complete analysis | In-app analytics |
| **Framework completion rate** | N/A | > 70% of started frameworks completed | Usage tracking |
| **Export/share rate** | N/A | > 50% of analyses result in slide export | Feature analytics |
| **User retention (monthly)** | N/A | > 40% MAU retention at month 3 | Cohort analysis |
| **Team collaboration adoption** | N/A | > 60% of workspaces have 2+ members | Workspace analytics |
| **NPS score** | N/A | > 50 | In-app surveys |

### 2.3 Priority
- **Overall Priority**: **Critical**
- **Rationale**: Foundational product — all future growth depends on delivering a compelling V1 that demonstrates the integrated strategy workflow with AI enrichment.

---

## 3. User Personas & Use Cases

### 3.1 Primary Users

| Persona | Description | Goals | Pain Points |
|---------|-------------|-------|-------------|
| **Strategy Consultant** | Independent or boutique firm consultant (ex-MBB) delivering strategy engagements | Accelerate engagement delivery; produce rigorous frameworks faster; impress clients with data-rich analyses | Manual framework population is tedious; lacks real-time data integration; spends too much time on slide formatting |
| **Corporate Strategy Director / VP Strategy** | In-house strategy leader at mid-to-large enterprise | Drive strategic planning cycles; align leadership around data-backed strategy; iterate quarterly | Fragmented tools; hard to maintain continuity between planning cycles; difficulty getting team alignment |
| **C-Suite Executive (CEO/CFO)** | Senior leader reviewing and approving strategic outputs | Quickly grasp strategic recommendations; challenge hypotheses with data; make informed decisions | Information overload; outputs lack structure; hard to compare strategic options |
| **Business Analyst** | Data-oriented team member gathering inputs and populating frameworks | Efficiently collect and structure data for strategy frameworks; validate hypotheses with evidence | Manual data gathering is slow; no standard templates; struggle to connect data to strategic narrative |

### 3.2 Key User Journeys

1. **New Strategy Engagement (End-to-End)**
   - **Trigger**: Strategy Director initiates a new strategic question (e.g., "Should we enter the European market?")
   - **Steps**:
     1. Create new workspace → Define organizational context (industry, size, products, markets)
     2. Frame the strategic question → AI suggests relevant frameworks
     3. Execute PESTEL analysis → Auto-enriched with real-time macro data
     4. Execute Porter's 5 Forces → AI pulls competitor data and market intelligence
     5. Run SWOT synthesis → Combines insights from PESTEL and Porter's
     6. Build Hypothesis Tree → AI suggests hypotheses based on analyses
     7. Test hypotheses → Validate with data sources
     8. Map to Ansoff Matrix → Identify growth strategy options
     9. Structure findings using Pyramid Principle
     10. Export as HTML slide deck
   - **Expected Outcome**: Complete, data-backed strategic recommendation with executive-ready deliverable in < 1 week

2. **Quick Framework Analysis**
   - **Trigger**: Consultant needs a single framework (e.g., BCG Matrix) for a client meeting tomorrow
   - **Steps**:
     1. Select framework module → Input business unit data
     2. AI enriches with market growth rates and relative market share data
     3. Review positioning → Adjust with manual overrides
     4. Export as standalone slide
   - **Expected Outcome**: Polished, data-enriched framework output in < 1 hour

3. **Collaborative Strategy Workshop**
   - **Trigger**: VP Strategy runs a virtual strategy offsite with 5 team members
   - **Steps**:
     1. Create shared workspace → Invite team members
     2. Assign framework modules to different analysts
     3. Real-time collaboration within each framework
     4. Strategy Director synthesizes outputs
     5. Present to C-Suite via slide export
   - **Expected Outcome**: Parallel strategy development with unified output

4. **Strategy Pivot / Amendment**
   - **Trigger**: Market disruption (e.g., new regulation, competitor move) requires strategy revision
   - **Steps**:
     1. Return to existing strategy workspace
     2. Update PESTEL with new factors → AI highlights impacts
     3. Re-run affected frameworks → Compare before/after
     4. Amend hypotheses and recommendations
     5. Generate updated executive summary
   - **Expected Outcome**: Rapid strategy adaptation with full audit trail

### 3.3 Pain Points Addressed
- **Fragmented tooling**: Single platform replaces 5–8 disparate tools (Excel, PPT, Miro, research portals)
- **No methodology guidance**: Guided workflow encodes consulting best practices step-by-step
- **Stale data**: Real-time feeds ensure analyses reflect current market conditions
- **Formatting overhead**: Auto-generated Pyramid Principle slides eliminate hours of PowerPoint work
- **Institutional knowledge loss**: Persistent workspaces preserve strategy history and rationale
- **Collaboration friction**: Real-time multi-user editing within structured frameworks

---

## 4. Scope Definition

### 4.1 In-Scope (V1)
- **12 Strategy Framework Modules** (interactive, AI-enriched)
- **Guided Workflow Engine** (sequencing frameworks in consulting methodology order)
- **Organizational Context Setup** (company profile, industry, competitors, products/markets)
- **LLM Agent Layer** (suggestions, auto-generation, critique per framework)
- **Real-Time Data Enrichment** (financial markets, economic indicators, news/geopolitical)
- **Multi-Tenant Architecture** (workspaces, teams, roles)
- **Collaboration Features** (multi-user editing, comments, assignments)
- **Pyramid Principle Communication Module**
- **HTML Slide Builder & Export**
- **User Authentication & Authorization** (SSO, RBAC)
- **Workspace Management** (create, archive, share engagements)
- **Audit Trail & Version History**

### 4.2 Out-of-Scope (V1)
- **Native mobile applications** — *Reason: Desktop-first for complex analytical work; responsive web is sufficient*
- **Custom framework builder** — *Reason: V1 ships with 12 curated frameworks; extensibility in V2*
- **Video/audio meeting integration** — *Reason: Focus on async workflow; integrations with Zoom/Teams in future*
- **Financial modeling engine** — *Reason: Deep financial models are out of scope; BCG Matrix uses simplified inputs*
- **White-label / reseller program** — *Reason: Brand-building phase; white-label is a V2+ consideration*
- **Offline mode** — *Reason: Real-time data enrichment and AI features require connectivity*
- **PDF export** — *Reason: HTML slides are the primary output format; PDF is a V2 enhancement*

### 4.3 Future Considerations (V2+)
- Custom framework builder (user-defined templates)
- PDF export alongside HTML
- Integration with corporate data warehouses (Snowflake, BigQuery)
- Marketplace for community-created framework plugins
- Advanced scenario modeling and Monte Carlo simulations
- Board-ready presentation templates
- Integration with OKR/KPI tools (Cascade, Quantive)
- AI-facilitated strategy workshops with agenda management

---

## 5. Functional Requirements

> **Note**: Requirements are tagged with MoSCoW priority: **[Must Have]**, **[Should Have]**, **[Could Have]**, **[Won't Have]**

### 5.1 Organizational Context & Workspace

#### FR-01: Workspace Creation & Management **[Must Have]**
- **Description**: Users create strategy workspaces that define the organizational context for analysis. Each workspace represents a strategic engagement or planning cycle.
- **Inputs**:
  - Company name, industry, sector
  - Organization size (revenue, employees, markets)
  - Products/services portfolio
  - Key competitors
  - Geographic presence
  - Strategic question or objective being addressed
- **Outputs**: Configured workspace with pre-populated context available to all framework modules
- **Business Rules**:
  - Each workspace belongs to a single tenant (organization)
  - Workspaces can be shared with team members via invitation
  - Workspace context is inherited by all frameworks within it
  - Maximum 50 active workspaces per organization (configurable)
- **Acceptance Criteria**:
  - [ ] User can create a workspace with all required context fields
  - [ ] Workspace context is accessible by all framework modules
  - [ ] Workspaces can be archived and restored
  - [ ] Users can duplicate an existing workspace as a starting point
  - [ ] Workspace supports inviting team members with role assignment

#### FR-02: Team Collaboration **[Must Have]**
- **Description**: Multiple users work simultaneously within a workspace, with real-time updates and role-based access.
- **Inputs**: Team member invitations, role assignments, in-framework edits
- **Outputs**: Synchronized workspace state visible to all participants
- **Business Rules**:
  - Roles: Owner, Editor, Viewer, Commenter
  - Owners can transfer ownership
  - Conflict resolution: last-write-wins with version history
  - Comments can be threaded and resolved
- **Acceptance Criteria**:
  - [ ] Multiple users can edit different framework modules concurrently
  - [ ] Changes propagate to other users within 2 seconds
  - [ ] Role-based permissions restrict actions appropriately
  - [ ] Activity feed shows recent changes by team members
  - [ ] @mentions notify specific team members

---

### 5.2 Strategy Framework Modules

#### FR-03: SWOT Analysis Module **[Must Have]**
- **Description**: Interactive 4-quadrant SWOT canvas where users identify Strengths, Weaknesses, Opportunities, and Threats with AI-assisted suggestions.
- **Inputs**: Manual entries, AI suggestions based on org context, imported items from PESTEL/Porter's
- **Outputs**: Completed SWOT matrix, prioritized items, cross-impact analysis
- **Business Rules**:
  - Items can be tagged with priority (High/Medium/Low)
  - Items can be linked to evidence (data sources, framework outputs)
  - AI suggests items based on organizational context + real-time market data
  - Cross-reference: Opportunities ↔ Strengths, Threats ↔ Weaknesses
- **Acceptance Criteria**:
  - [ ] User can add, edit, delete, and reorder items in each quadrant
  - [ ] AI generates minimum 3 suggestions per quadrant based on context
  - [ ] Items can be linked to supporting evidence
  - [ ] TOWS cross-impact matrix auto-generates strategic options
  - [ ] Export SWOT as a standalone slide or as part of workflow output

#### FR-04: PESTEL Analysis Module **[Must Have]**
- **Description**: Six-factor macro-environmental analysis enriched with real-time data feeds for Political, Economic, Social, Technological, Environmental, and Legal factors.
- **Inputs**: User entries, real-time data feeds (economic indicators, regulatory news, social trends), AI suggestions
- **Outputs**: Rated factor list with impact/likelihood scoring, trend indicators, linked evidence
- **Business Rules**:
  - Each factor rated on Impact (1–5) and Likelihood (1–5)
  - Factors tagged with time horizon (short/medium/long-term)
  - Real-time data enrichment auto-populates relevant indicators (GDP growth, interest rates, regulatory changes)
  - Outputs feed into SWOT (Opportunities/Threats)
- **Acceptance Criteria**:
  - [ ] All 6 PESTEL dimensions are presented as interactive sections
  - [ ] Real-time data auto-populates at least economic indicators (GDP, inflation, rates)
  - [ ] Each factor can be scored on impact and likelihood
  - [ ] AI suggests factors relevant to the user's industry and geography
  - [ ] Heat map visualization shows high-impact factors
  - [ ] Factors can be exported to SWOT module as Opportunities or Threats

#### FR-05: Porter's 5 Forces Module **[Must Have]**
- **Description**: Interactive competitive analysis across five forces, enriched with market data and competitor intelligence.
- **Inputs**: User assessments, competitor data, market concentration data, AI analysis
- **Outputs**: Force-by-force scoring (1–5), overall industry attractiveness rating, key competitive dynamics
- **Business Rules**:
  - Each force scored 1–5 (very low to very high intensity)
  - Sub-factors within each force (e.g., switching costs, buyer concentration)
  - AI pulls competitor data from organizational context
  - Overall attractiveness = weighted composite of 5 forces
- **Acceptance Criteria**:
  - [ ] All 5 forces displayed with sub-factor breakdown
  - [ ] Each force and sub-factor can be scored with justification text
  - [ ] Visual radar/spider chart shows force intensity comparison
  - [ ] AI suggests competitive dynamics based on industry context
  - [ ] Results link to SWOT (competitive threats/opportunities)

#### FR-06: BCG Matrix Module **[Must Have]**
- **Description**: Growth-Share portfolio matrix for plotting business units, products, or market segments into Stars, Cash Cows, Question Marks, and Dogs quadrants.
- **Inputs**: Business unit names, relative market share, market growth rate, revenue (optional)
- **Outputs**: Positioned BCG matrix with strategic recommendations per quadrant
- **Business Rules**:
  - X-axis: Relative Market Share (log scale, high → low)
  - Y-axis: Market Growth Rate (%)
  - Bubble size: Revenue or investment level
  - AI enriches with market growth data where available
  - Strategic recommendations mapped to quadrant position
- **Acceptance Criteria**:
  - [ ] Interactive scatter/bubble chart with drag-and-drop positioning
  - [ ] Users can input data manually or AI-enriches from market data
  - [ ] Quadrant labels (Star, Cash Cow, Question Mark, Dog) with strategic guidance
  - [ ] Movement arrows show strategic direction (invest, harvest, divest)
  - [ ] Export as slide-ready visualization

#### FR-07: Ansoff Matrix Module **[Must Have]**
- **Description**: 2×2 growth strategy matrix helping users evaluate strategic options: Market Penetration, Market Development, Product Development, Diversification.
- **Inputs**: Current products/markets, potential new products/markets, risk assessments
- **Outputs**: Mapped growth strategies with risk/reward analysis, prioritized initiatives
- **Business Rules**:
  - Each quadrant contains specific strategic initiatives
  - Risk increases from top-left (penetration) to bottom-right (diversification)
  - AI suggests initiatives based on organizational context and market data
  - Initiatives can be scored on feasibility, attractiveness, risk
- **Acceptance Criteria**:
  - [ ] Interactive 2×2 matrix with all 4 quadrants
  - [ ] Users can add strategic initiatives to each quadrant
  - [ ] Each initiative can be rated on feasibility and attractiveness
  - [ ] AI suggests growth opportunities based on context
  - [ ] Visual risk gradient communicates increasing complexity
  - [ ] Links to BCG Matrix for portfolio-strategy alignment

#### FR-08: SIPOC Module **[Should Have]**
- **Description**: Process mapping tool identifying Suppliers, Inputs, Process steps, Outputs, and Customers for key strategic processes.
- **Inputs**: Process name, manual entries per SIPOC column, AI suggestions
- **Outputs**: Complete SIPOC diagram, process improvement opportunities
- **Business Rules**:
  - One SIPOC per key process (users can create multiple)
  - AI suggests typical suppliers/customers based on industry
  - Process steps are sequential and can be expanded
  - Links to Value Chain Analysis for process positioning
- **Acceptance Criteria**:
  - [ ] 5-column interactive layout (S-I-P-O-C)
  - [ ] Drag-and-drop ordering within columns
  - [ ] AI auto-suggests items based on industry and process type
  - [ ] Multiple SIPOC diagrams per workspace
  - [ ] Export as table or flow diagram

#### FR-09: Value Chain Analysis Module **[Should Have]**
- **Description**: Michael Porter's Value Chain decomposition into Primary Activities (inbound logistics, operations, outbound logistics, marketing & sales, service) and Support Activities (infrastructure, HR, technology, procurement).
- **Inputs**: Activity descriptions, cost allocations, competitive advantage indicators
- **Outputs**: Visual value chain with cost/value annotations, competitive advantage identification
- **Business Rules**:
  - Primary activities displayed as sequential arrow flow
  - Support activities displayed as horizontal bars above
  - Each activity can be marked as cost leader, differentiator, or parity
  - AI benchmarks against industry norms where data available
- **Acceptance Criteria**:
  - [ ] Classic Porter value chain visual layout
  - [ ] Each activity section is expandable with sub-activities
  - [ ] Cost/value indicators per activity
  - [ ] Competitive advantage flags (source of differentiation or cost advantage)
  - [ ] AI suggests improvements based on industry best practices

#### FR-10: Root Cause Analysis Module **[Should Have]**
- **Description**: Dual-method root cause analysis using Fishbone (Ishikawa) diagrams and the 5 Whys technique for identifying underlying strategic issues.
- **Inputs**: Problem statement, potential causes (categorized), iterative "why" questioning
- **Outputs**: Fishbone diagram, 5 Whys trace, identified root causes with evidence
- **Business Rules**:
  - Fishbone categories default to: People, Process, Technology, Environment, Management, Materials (customizable)
  - 5 Whys supports branching (multiple root causes)
  - AI challenges assumptions and suggests deeper causes
  - Root causes feed into Hypothesis Formation
- **Acceptance Criteria**:
  - [ ] Interactive fishbone diagram with drag-and-drop causes
  - [ ] 5 Whys interface with iterative questioning
  - [ ] AI prompts "Why?" follow-ups and suggests potential causes
  - [ ] Root causes can be prioritized and linked to hypotheses
  - [ ] Categories are customizable per analysis

#### FR-11: Hypothesis Formation & Hypothesis Tree **[Must Have]**
- **Description**: Structured hypothesis generation following the McKinsey hypothesis-driven approach. Users form an initial hypothesis, decompose it into a tree of sub-hypotheses, and identify evidence needed to prove/disprove each.
- **Inputs**: Strategic question, insights from prior frameworks, AI-suggested hypotheses
- **Outputs**: Hypothesis tree (hierarchical), evidence requirements per hypothesis, test plan
- **Business Rules**:
  - Top-level hypothesis answers the strategic question
  - Sub-hypotheses are MECE (Mutually Exclusive, Collectively Exhaustive)
  - Each leaf hypothesis maps to required evidence/data
  - Status tracking: Unvalidated → In Testing → Proven → Disproven
  - AI suggests hypotheses based on prior framework outputs
- **Acceptance Criteria**:
  - [ ] Hierarchical tree visualization of hypotheses
  - [ ] MECE check (AI flags gaps or overlaps)
  - [ ] Each hypothesis node has: statement, required evidence, status, confidence level
  - [ ] AI generates initial hypothesis tree from strategic question + prior analyses
  - [ ] Hypotheses link back to supporting framework outputs

#### FR-12: Hypothesis Testing Module **[Must Have]**
- **Description**: Structured validation of hypotheses against evidence. Users collect data, run analyses, and mark hypotheses as proven or disproven with confidence levels.
- **Inputs**: Hypothesis statements, evidence data (manual + real-time feeds), validation criteria
- **Outputs**: Test results, confidence scores, proven/disproven status, implications for strategy
- **Business Rules**:
  - Each hypothesis has defined validation criteria (set during formation)
  - Evidence can be: quantitative data, qualitative insights, expert judgment
  - Confidence level: 0–100% (AI-assisted scoring based on evidence strength)
  - Disproven hypotheses trigger strategy pivot recommendations
  - AI synthesizes evidence and flags contradictions
- **Acceptance Criteria**:
  - [ ] Evidence attachment per hypothesis (data, links, notes)
  - [ ] Confidence scoring with clear methodology
  - [ ] Visual dashboard of hypothesis status (proven/disproven/in-progress)
  - [ ] AI analysis of evidence strength and gaps
  - [ ] Automatic recommendations when hypotheses are disproven

#### FR-13: Pyramid Principle Communication Module **[Must Have]**
- **Description**: Structured top-down communication builder following Barbara Minto's Pyramid Principle. Users structure their strategic findings into Situation → Complication → Resolution with supporting arguments organized in MECE groups.
- **Inputs**: Key findings from frameworks, hypotheses results, strategic recommendations
- **Outputs**: Structured communication outline (SCR format), slide structure, talking points
- **Business Rules**:
  - Top-level: Governing thought (key recommendation)
  - Level 2: Key supporting arguments (3–5, MECE)
  - Level 3: Supporting evidence per argument
  - Auto-imports findings from prior framework modules
  - AI critiques structure for logical flow and MECE-ness
- **Acceptance Criteria**:
  - [ ] Drag-and-drop hierarchy builder for pyramid structure
  - [ ] SCR (Situation-Complication-Resolution) template at top level
  - [ ] AI suggests structure based on framework outputs and hypotheses
  - [ ] MECE validation on argument groupings
  - [ ] One-click transformation to slide outline
  - [ ] Supports both inductive and deductive argument ordering

#### FR-14: HTML Slide Builder & Export **[Must Have]**
- **Description**: Converts Pyramid Principle communication structure into polished HTML slide presentations with consistent branding, data visualizations, and executive-ready formatting.
- **Inputs**: Pyramid Principle structure, framework visualizations, key data points, branding settings
- **Outputs**: HTML slide deck (downloadable), shareable link, individual slide exports
- **Business Rules**:
  - Slide templates follow consulting-style formatting (clean, minimal, data-focused)
  - Each pyramid level maps to slide sections (executive summary → supporting arguments → evidence)
  - Framework visualizations (charts, matrices) auto-embedded
  - Custom branding (logo, colors, fonts) per organization
  - Responsive HTML that works in modern browsers
- **Acceptance Criteria**:
  - [ ] One-click export from Pyramid Principle module to HTML slides
  - [ ] Slide deck follows Pyramid Principle structure automatically
  - [ ] Framework charts/visualizations embedded with proper formatting
  - [ ] Custom branding (logo, color scheme) applied consistently
  - [ ] Slide deck is navigable (keyboard arrows, progress indicator)
  - [ ] Individual slides can be exported separately
  - [ ] Shareable URL for stakeholder review (with optional password)

---

### 5.3 Guided Workflow Engine

#### FR-15: Strategy Workflow Sequencing **[Must Have]**
- **Description**: A guided workflow engine that sequences framework modules in a logical consulting methodology order, adapting the path based on the strategic question and prior outputs.
- **Inputs**: Strategic question type, organizational context, user selections
- **Outputs**: Recommended workflow path, progress tracking, dependency management
- **Business Rules**:
  - Default workflow sequence:
    1. **Diagnose**: PESTEL → Porter's 5 Forces → Value Chain → SWOT
    2. **Analyze**: Root Cause Analysis → SIPOC
    3. **Hypothesize**: Hypothesis Formation → Hypothesis Tree → Hypothesis Testing
    4. **Strategize**: BCG Matrix → Ansoff Matrix
    5. **Communicate**: Pyramid Principle → HTML Slides
  - Users can skip or reorder steps (non-linear access)
  - Dependencies: Certain frameworks benefit from prior outputs (e.g., SWOT enriched by PESTEL)
  - AI recommends next best step based on current progress
  - Progress bar tracks completion across the workflow
- **Acceptance Criteria**:
  - [ ] Visual workflow timeline showing all steps and current position
  - [ ] Recommended sequence adapts based on strategic question type
  - [ ] Users can access any framework at any time (non-blocking)
  - [ ] Dependency indicators show which frameworks enrich others
  - [ ] AI "next step" recommendation with rationale
  - [ ] Progress percentage and completion estimates

#### FR-16: Cross-Framework Data Flow **[Must Have]**
- **Description**: Insights, items, and outputs from one framework automatically flow to relevant downstream frameworks, creating a connected analytical narrative.
- **Inputs**: Completed or in-progress framework outputs
- **Outputs**: Pre-populated inputs in downstream frameworks, linked references
- **Business Rules**:
  - PESTEL factors → SWOT Opportunities/Threats (automatic suggestion)
  - Porter's 5 Forces → SWOT Strengths/Weaknesses (competitive position)
  - SWOT outputs → Hypothesis Formation (strategic issues)
  - Root Cause outputs → Hypothesis Formation (root causes as hypotheses)
  - Hypothesis results → Ansoff Matrix (validated strategies)
  - All framework outputs → Pyramid Principle (evidence and arguments)
  - Cross-linked items maintain bidirectional references
- **Acceptance Criteria**:
  - [ ] Completing PESTEL auto-suggests items in SWOT
  - [ ] Framework outputs appear as suggested inputs in downstream modules
  - [ ] Users can accept, modify, or reject cross-framework suggestions
  - [ ] Bidirectional links allow navigating between connected items
  - [ ] Dependency graph shows data flow between frameworks

---

### 5.4 AI / LLM Intelligence Layer

#### FR-17: LLM-Powered Suggestions & Generation **[Must Have]**
- **Description**: Every framework module integrates an AI assistant that provides contextual suggestions, auto-generates analysis items, offers critiques, and answers strategic questions.
- **Inputs**: Organizational context, current framework state, real-time data, user queries
- **Outputs**: Suggestions (accept/reject), generated content, critiques, answers
- **Business Rules**:
  - AI suggestions are always presented as proposals (never auto-committed)
  - Suggestions incorporate: org context + real-time data + framework best practices
  - AI can generate initial drafts for any framework module
  - Critique mode: AI challenges user inputs with counter-arguments
  - All AI outputs are attributable (show reasoning / data sources)
  - Rate limiting: Max 100 AI interactions per workspace per day (configurable)
- **Acceptance Criteria**:
  - [ ] AI "Suggest" button available in every framework module
  - [ ] AI generates contextually relevant items (not generic)
  - [ ] Users can accept, edit, or dismiss suggestions individually
  - [ ] "Challenge Mode" provides devil's advocate critique of user analysis
  - [ ] AI explains its reasoning for each suggestion
  - [ ] AI respects organizational context set at workspace level

#### FR-18: Real-Time Data Enrichment **[Must Have]**
- **Description**: Live data feeds from financial markets, economic indicators, and geopolitical/news sources are automatically incorporated into relevant framework analyses.
- **Inputs**: Org context (industry, geography, competitors), data API connections
- **Outputs**: Auto-populated data points within frameworks, trend indicators, alerts
- **Data Sources**:
  - **Economic**: GDP growth, inflation, interest rates, unemployment (by country/region)
  - **Financial**: Stock prices, market cap, revenue figures (for public competitors)
  - **Geopolitical**: Regulatory changes, trade policies, political stability indices
  - **Industry**: Market size, growth rates, concentration ratios
  - **News/Sentiment**: Major news events relevant to industry/geography
- **Business Rules**:
  - Data refreshes at minimum daily; financial data near-real-time during market hours
  - Data points are clearly labeled with source and timestamp
  - Users can override/dismiss enriched data points
  - Graceful degradation if data feeds are unavailable
- **Acceptance Criteria**:
  - [ ] PESTEL module auto-populates economic indicators for user's geography
  - [ ] Porter's 5 Forces surfaces competitor financial data
  - [ ] BCG Matrix enriches market growth rates from market data
  - [ ] Data points show source, timestamp, and confidence level
  - [ ] System functions normally if data feeds are temporarily unavailable
  - [ ] User can manually refresh data or pin specific data points

---

### 5.5 User Interface Requirements

#### FR-19: Dashboard & Navigation **[Must Have]**
- **Description**: Central dashboard providing overview of active workspaces, recent activity, and quick access to framework modules.
- **UI Components**:
  - Workspace list with status indicators (in-progress, completed, shared)
  - Activity feed showing recent changes across workspaces
  - Quick-start templates for common strategic questions
  - Global search across all workspaces and framework content
- **Acceptance Criteria**:
  - [ ] Dashboard loads within 2 seconds
  - [ ] Workspace cards show completion percentage and last activity
  - [ ] Activity feed updates in real-time
  - [ ] Search returns results across all framework content

#### FR-20: Framework Module UI Pattern **[Must Have]**
- **Description**: Consistent UI pattern across all framework modules ensuring learnability and efficiency.
- **UI Pattern (per module)**:
  - Left panel: Framework structure/inputs
  - Center: Interactive canvas/visualization
  - Right panel: AI assistant, suggestions, data enrichment
  - Top bar: Module title, progress, export action
  - Bottom bar: Notes, linked items from other frameworks
- **Acceptance Criteria**:
  - [ ] All 12 framework modules follow the consistent 3-panel layout
  - [ ] AI assistant panel is collapsible
  - [ ] Framework visualizations are interactive (hover, click, drag)
  - [ ] Responsive design works on screens ≥ 1024px width

---

### 5.6 Business Rules

1. **Data Ownership**: All strategy data belongs to the tenant organization; no cross-tenant data access
2. **AI Usage**: AI-generated content must be clearly marked as "AI-suggested" until user confirms
3. **Version Control**: Every change is versioned; users can revert to any prior state
4. **Export Restrictions**: Only Editors and Owners can export slides; Viewers can only view in-app
5. **Data Retention**: Archived workspaces retained for 2 years; active workspaces indefinitely
6. **Rate Limiting**: AI calls are rate-limited per workspace per day to manage costs
7. **Concurrent Editing**: Maximum 10 simultaneous editors per workspace

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **Page Load Time**: < 2 seconds for any framework module (P95)
- **AI Response Time**: < 5 seconds for suggestion generation (P95)
- **Real-Time Sync**: < 2 seconds propagation for collaborative edits
- **Data Enrichment**: < 10 seconds for initial data load per framework
- **Search**: < 500ms for workspace content search results
- **Export Generation**: < 30 seconds for full HTML slide deck (up to 50 slides)
- **Concurrent Users**: Support 100 simultaneous users per tenant; 10,000 total across platform

### 6.2 Security
- **Authentication**: SSO (SAML 2.0, OIDC), email/password with MFA
- **Authorization**: Role-Based Access Control (RBAC) at workspace and module level
- **Data Protection**:
  - Encryption at rest (AES-256)
  - Encryption in transit (TLS 1.3)
  - Field-level encryption for sensitive strategy data
- **Data Isolation**: Strict multi-tenant data isolation (separate schemas or row-level security)
- **Compliance**: SOC 2 Type II readiness, GDPR compliance
- **Audit Logging**: All user actions logged with timestamp, user, and action type
- **Session Management**: Configurable session timeout (default 8 hours), device management

> **⚠️ Critical Security Note**: Strategy data is highly sensitive corporate information. Security must be treated as a first-class concern — any breach could expose M&A plans, competitive strategies, or market-moving information.

### 6.3 Reliability
- **Uptime Target**: 99.9% availability (< 8.76 hours downtime per year)
- **Fault Tolerance**: Multi-AZ deployment; graceful degradation if AI or data services fail
- **Recovery**:
  - RTO (Recovery Time Objective): < 1 hour
  - RPO (Recovery Point Objective): < 5 minutes
- **Backup**: Automated daily backups with point-in-time recovery capability
- **Auto-Save**: Framework edits auto-saved every 5 seconds (no data loss on disconnect)

### 6.4 Scalability
- **Horizontal Scaling**: Stateless application tier supporting auto-scaling
- **Database**: Support growth to 10,000 organizations, 100,000 users, 1M+ workspaces
- **AI Layer**: Queue-based processing with configurable concurrency limits
- **Data Feeds**: Caching layer to minimize external API calls while maintaining freshness

### 6.5 Accessibility
- **Standard**: WCAG 2.1 AA compliance
- **Requirements**:
  - Keyboard navigation for all framework interactions
  - Screen reader compatibility for framework visualizations (text alternatives)
  - Sufficient color contrast (4.5:1 minimum for text)
  - Resizable text without loss of functionality
  - Focus management for dynamic content updates

### 6.6 Compatibility
- **Platforms**: Web application (responsive, desktop-optimized)
- **Browsers**: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- **Minimum Screen**: 1024px × 768px (framework modules optimized for ≥1280px)
- **Devices**: Desktop (primary), Tablet landscape (secondary), Mobile (view-only limited support)

---

## 7. Implementation Considerations

### 7.1 Technical Architecture

- **Frontend**: Next.js (App Router) with React Server Components
- **Styling**: Tailwind CSS + component library (shadcn/ui or similar)
- **State Management**: Server state (React Query / SWR) + client state for real-time collaboration
- **Real-Time**: WebSocket connections for collaboration (or Server-Sent Events for simpler updates)
- **Backend**: Next.js API routes + dedicated service layer
- **Database**: PostgreSQL with row-level security for multi-tenancy
- **AI Orchestration**: Agent-based architecture with MCP (Model Context Protocol) tools
- **Caching**: Redis for session management, data feed caching, and rate limiting
- **File Storage**: Object storage (S3-compatible) for exported slides and assets
- **Search**: Full-text search (PostgreSQL FTS or dedicated search service)

### 7.2 Agent Architecture (MCP-Based)

- **Framework Agents**: One specialized agent per strategy framework, equipped with:
  - Domain knowledge (framework methodology, best practices)
  - Data enrichment tools (API connections relevant to that framework)
  - Generation capabilities (auto-generate framework content)
  - Critique capabilities (challenge user inputs)
- **Orchestrator Agent**: Manages workflow sequencing, cross-framework data flow, and user interaction routing
- **Data Enrichment Agent**: Manages connections to external data APIs, caching, and data transformation
- **Communication Agent**: Handles Pyramid Principle structuring and slide generation
- **MCP Tools/Skills per Agent**:
  - `swot-analyzer`, `pestel-scanner`, `porters-evaluator`, `bcg-plotter`
  - `ansoff-strategist`, `sipoc-mapper`, `valuechain-analyzer`
  - `rootcause-investigator`, `hypothesis-builder`, `hypothesis-tester`
  - `pyramid-structurer`, `slide-generator`
  - `data-fetcher`, `market-researcher`, `news-scanner`

### 7.3 Dependencies
- **LLM Provider**: OpenAI compatible API
- **Financial Data API**: Alpha Vantage, Yahoo Finance, or Bloomberg (market data)
- **Economic Data API**: World Bank API, FRED (Federal Reserve), OECD
- **News/Geopolitical API**: NewsAPI, GDELT, or similar event monitoring
- **Authentication Provider**: Google, Auth0 or NextAuth.js
- **Hosting**: Vercel (frontend) + dedicated backend service (Railway, Fly.io, or AWS)
- **Database**: Managed PostgreSQL (Supabase, Neon, or AWS RDS)
- **Object Storage**: AWS S3 or Cloudflare R2 (exported slides, assets)

### 7.4 Constraints
- **LLM Latency**: AI suggestions must feel responsive (< 5s); may require streaming responses
- **Data API Rate Limits**: External data providers have rate limits; aggressive caching required
- **Multi-Tenancy Isolation**: Cannot compromise on data isolation despite shared infrastructure
- **Browser Rendering**: HTML slides must render consistently across target browsers
- **Cost Management**: LLM API costs must be controlled via rate limiting and caching strategies

### 7.5 Assumptions
> **⚠️ These assumptions must be validated before development begins.**
- Users have sufficient strategy literacy to interpret framework outputs (tool guides, not teaches strategy from scratch)
- LLM providers maintain current pricing and capability levels through development
- Free/affordable data APIs exist for core economic and financial indicators
- Target users work primarily on desktop/laptop (not mobile-first)
- Initial user base is English-speaking (internationalization is V2+)
- Organizations will accept cloud-hosted strategy data (no on-premise requirement for V1)

---

## 8. Project-Specific Requirements

### 8.1 Data Feed Integration Requirements

| Data Category | Example Sources | Refresh Frequency | Frameworks Served |
|---------------|----------------|-------------------|-------------------|
| **Economic Indicators** | World Bank, FRED, OECD | Daily | PESTEL, SWOT |
| **Financial Markets** | Alpha Vantage, Yahoo Finance | Near real-time (15m delay) | BCG Matrix, Porter's 5 Forces |
| **Competitor Intelligence** | Public filings, news | Daily | Porter's 5 Forces, SWOT |
| **Regulatory/Legal** | Government databases, news | Daily | PESTEL (Legal, Political) |
| **Industry/Market Data** | Statista, IBISWorld (if licensed) | Weekly | BCG Matrix, Ansoff, Porter's |
| **News/Geopolitical** | NewsAPI, GDELT | Hourly | PESTEL, SWOT |

### 8.2 Workflow State Machine

```
[Start] → Define Context → [Diagnose Phase]
                                ↓
                    ┌──────────────────────────┐
                    │  PESTEL → Porter's 5F    │
                    │  Value Chain → SWOT      │
                    └──────────────────────────┘
                                ↓
                         [Analyze Phase]
                    ┌──────────────────────────┐
                    │  Root Cause Analysis      │
                    │  SIPOC                    │
                    └──────────────────────────┘
                                ↓
                       [Hypothesize Phase]
                    ┌──────────────────────────┐
                    │  Hypothesis Formation     │
                    │  Hypothesis Tree          │
                    │  Hypothesis Testing       │
                    └──────────────────────────┘
                                ↓
                       [Strategize Phase]
                    ┌──────────────────────────┐
                    │  BCG Matrix               │
                    │  Ansoff Matrix            │
                    └──────────────────────────┘
                                ↓
                      [Communicate Phase]
                    ┌──────────────────────────┐
                    │  Pyramid Principle        │
                    │  HTML Slide Builder       │
                    └──────────────────────────┘
                                ↓
                          [Complete / Pivot]
```

### 8.3 Export & Deliverable Requirements
- **HTML Slide Format**:
  - Self-contained single HTML file (embedded CSS/JS, no external dependencies)
  - Keyboard navigation (arrow keys for slide progression)
  - Print-friendly layout (one slide per page)
  - Responsive to screen size (presentation mode)
  - Custom themes (consulting-style dark/light, user-branded)
- **Slide Structure** (from Pyramid Principle):
  - Slide 1: Executive Summary (governing thought)
  - Slides 2–N: Supporting arguments (one per slide)
  - Evidence slides: Data visualizations, framework outputs
  - Appendix: Detailed framework outputs for reference

### 8.4 Multi-Tenancy & Organization Requirements
- **Tenant Isolation**: Complete data isolation between organizations
- **Organization Setup**:
  - Company profile (name, industry, size, geography)
  - Team management (invite, remove, role assignment)
  - Billing/subscription management
  - Custom branding (logo, colors for exports)
- **Workspace Hierarchy**: Organization → Workspaces → Frameworks → Items

---

## 9. Open Questions & Risks

| # | Question / Risk | Category | Owner | Status |
|---|----------------|----------|-------|--------|
| 1 | Which financial data API provides best coverage at acceptable cost? | Technical | Engineering | Open |
| 2 | How to handle LLM hallucinations in strategy suggestions (risk of bad advice)? | Product | Product Owner | Open |
| 3 | Should V1 support real-time collaborative editing or simpler turn-based editing? | Scope | Product Owner | Open |
| 4 | What is the acceptable LLM cost per workspace per month? | Business | Product Owner | Open |
| 5 | Do enterprise customers require on-premise deployment option? | Scope | Product Owner | Open |
| 6 | How to handle data residency requirements (EU vs US hosting)? | Compliance | Engineering | Open |
| 7 | Should AI suggestions be opt-in or on-by-default per framework? | UX | Product Owner | Open |
| 8 | Risk: LLM provider API changes or pricing increases mid-development | Technical | Engineering | Open |
| 9 | Risk: Data feed providers may restrict usage or change terms | Technical | Engineering | Open |
| 10 | Risk: Scope creep from 12 frameworks — should V1 launch with fewer? | Scope | Product Owner | Open |
| 11 | What level of strategy literacy should the product assume? | Product | Product Owner | Open |
| 12 | How to validate AI-generated strategic advice quality before launch? | Quality | Product Owner | Open |

---

## 10. Release Strategy

### 10.1 Phased Delivery

| Phase | Focus | Key Deliverables |
|-------|-------|-----------------|
| **Phase 1: Foundation** | App shell, auth, workspace management | Multi-tenant infrastructure, user auth, workspace CRUD |
| **Phase 2: Core Frameworks** | 4 must-have frameworks | SWOT, PESTEL, Porter's 5 Forces, BCG Matrix |
| **Phase 3: AI Layer** | LLM integration, suggestions | Agent architecture, MCP tools, AI suggestions per framework |
| **Phase 4: Data Enrichment** | External data feeds | Economic, financial, news API integrations |
| **Phase 5: Full Framework Suite** | Remaining 8 frameworks | Ansoff, SIPOC, Value Chain, RCA, Hypotheses, Pyramid, Slides |
| **Phase 6: Collaboration** | Real-time multi-user | WebSocket sync, roles, activity feeds |
| **Phase 7: Polish & Export** | Slide builder, branding | HTML export, custom themes, organization branding |

### 10.2 MVP Definition (Minimum Viable Product)
The MVP (Phases 1–3) delivers:
- Workspace creation with organizational context
- 4 core frameworks (SWOT, PESTEL, Porter's, BCG) with AI suggestions
- Single-user experience (collaboration in later phase)
- Basic workflow sequencing
- Simple export (structured text/basic HTML)

---
</DOCUMENTS>
