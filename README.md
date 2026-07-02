# mckinsead — Agentic Strategy Cockpit

> McKinsey-grade strategy analysis powered by a fleet of specialized AI agents.

**mckinsead** is a multi-agent SaaS that walks users through a full strategy engagement — from problem scoping to slide deck export — using the same frameworks and disciplines taught at top consulting firms.

## Tech Stack

- **Frontend**: Vite, React 19, Tailwind CSS v4
- **Backend**: Convex (serverless database + functions)
- **Auth**: Convex Auth (email/password + SSO)
- **UI**: shadcn/ui (53 components)
- **Build**: Vite (fast, optimized)

## Getting Started

```bash
# Prerequisites: Node 20+, npm
git clone https://github.com/insead-alumni-ai-lab/mckinsead.git
cd mckinsead

# Install dependencies
npm install

# Set up Convex deployment
./setup-convex.sh

# Start development
npm run dev
```

## Deployment to Vercel (Free)

### Prerequisites
- GitHub account
- Vercel account (free)
- Convex account (free)

### Steps

1. **Set up Convex deployment**
   ```bash
   ./setup-convex.sh
   ```

2. **Get your credentials**
   ```bash
   grep VITE_CONVEX_URL .env.local
   grep CONVEX_DEPLOY_KEY .env.local
   ```

3. **Deploy to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - **Set Root Directory to `deploy`**
   - Add environment variables:
     ```
     VITE_CONVEX_URL=https://your-project.convex.cloud
     CONVEX_DEPLOY_KEY=your-deploy-key
     ```
   - Click Deploy

4. **Verify**
   ```bash
   ./verify-deploy.sh
   ```

### Free Tier Limits

| Feature | Limit |
|---------|-------|
| **Bandwidth** | 100 GB/month |
| **Build Time** | 100 hours/month |
| **Database Reads** | 50K/month (Convex) |
| **Storage** | 2GB (Convex) |
| **Total Cost** | **$0/month** |

## Architecture

```
┌─────────────────────────────────────────┐
│            Vercel (Free Tier)           │
│  ┌─────────────────────────────────┐   │
│  │   Static Vite Build (dist/)     │   │
│  │   React + Tailwind + shadcn/ui  │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
└─────────────────┼───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Convex (Free Tier)              │
│  • Database (document store)            │
│  • Serverless Functions                 │
│  • Authentication                       │
│  • Real-time Subscriptions              │
│  • File Storage                         │
└─────────────────────────────────────────┘
```

## Features

### Strategy Frameworks (all 8)
- SWOT + TOWS
- PESTEL
- Porter's Five Forces
- BCG Growth-Share Matrix
- Ansoff Growth Matrix
- SIPOC
- Porter Value Chain
- Root Cause (5 Whys + Ishikawa)

### Core Capabilities
- **SCQA Scoping** — Situation, Complication, Question, Answer
- **Hypothesis Tree** — MECE hypothesis builder
- **Analysis Panel** — 5 testing methods
- **Synthesis** — Minto Pyramid Principle
- **Communication** — Slide builder with consulting grammar
- **Critique Engine** — 7-check quality linter
- **Export** — HTML, PPTX, PDF

### Platform Features
- **Auth** — Email/password + Google/GitHub SSO
- **Real-time** — Automatic subscriptions
- **Chat** — AI conversation per engagement
- **Gamification** — XP, badges, streaks
- **Admin Panel** — User management, AI config
- **Sharing** — Token-based collaboration with roles
- **Versioning** — Engagement snapshots + audit trail
- **Billing** — Stripe integration, subscription plans
- **Prompt Library** — Custom AI prompts
- **Command Palette** — Cmd+K navigation
- **Theme** — Dark/light mode

### AI Integration
- **BYOK Mode** — Users bring their own API keys
- **Cloud Mode** — Platform-managed AI keys
- **Multi-provider** — Anthropic + OpenAI support
- **Custom endpoints** — Azure, vLLM, Ollama, LiteLLM

## Project Structure

```
mckinsead/
├── deploy/                # Main application
│   ├── convex/            # Backend functions & schema
│   │   ├── schema.ts      # Database schema (13 tables)
│   │   ├── auth.ts        # Authentication config
│   │   ├── engagements.ts # Engagement CRUD
│   │   ├── frameworkAi.ts # AI framework generation
│   │   ├── llm.ts         # LLM integration
│   │   ├── chat.ts        # Real-time chat
│   │   ├── admin.ts       # Admin panel logic
│   │   ├── stripe.ts      # Billing integration
│   │   └── ...            # Other functions
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   ├── ui/        # shadcn components
│   │   │   ├── engagement/# Framework canvases
│   │   │   └── ...        # Layout, navigation
│   │   ├── pages/         # Route pages
│   │   ├── contexts/      # Theme, auth context
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   ├── vercel.json        # Vercel configuration
│   ├── package.json       # Dependencies
│   └── .env.local         # Local environment
├── .git/
├── .gitignore
└── README.md
```

## Scripts

Run from the `deploy/` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run sync` | Push Convex functions |
| `npm run sync:build` | Push Convex + build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Type check with TypeScript |
| `./verify-deploy.sh` | Verify deployment readiness |
| `./setup-convex.sh` | Set up Convex deployment |

## Environment Variables

**Required (set in Vercel):**
| Variable | Description |
|----------|-------------|
| `VITE_CONVEX_URL` | Convex backend URL |
| `CONVEX_DEPLOY_KEY` | Convex deploy key |

**Optional (set in Convex):**
```bash
npx convex env set ANTHROPIC_API_KEY "sk-ant-..."
npx convex env set OPENAI_API_KEY "sk-..."
npx convex env set STRIPE_SECRET_KEY "sk_live_..."
```

## Non-Negotiables

1. **MECE everywhere** — every breakdown must be mutually exclusive, collectively exhaustive
2. **Hypothesis before analysis** — never gather data without a testable claim
3. **So-what discipline** — every finding must answer "so what does this mean?"
4. **Grounded claims** — every assertion needs a citation or evidence ID
5. **Pyramid before slides** — always structure the narrative before building the deck
6. **Reversible state** — any user can undo/redo; every action is audited
7. **Human-in-the-loop** — 5 gates where the orchestrator must pause for approval

---

Built by the INSEAD Alumni AI Lab.
