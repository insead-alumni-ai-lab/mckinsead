# Vercel Free Deployment Guide

## Quick Deploy (4 steps)

### 0. Set Up Convex Deployment (if not done)
```bash
cd deploy
./setup-convex.sh
```

### 1. Connect Repository to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Important**: Set **Root Directory** to `deploy` (not root)
4. Click Deploy

### 2. Configure Environment Variables
In Vercel dashboard → Settings → Environment Variables, add:

```
VITE_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key
```

Get these values by running:
```bash
cd deploy
grep VITE_CONVEX_URL .env.local
grep CONVEX_DEPLOY_KEY .env.local
```

### 3. Deploy
Vercel will automatically:
- Detect Vite framework
- Run `npm run build` (which runs `npx convex dev --once` first)
- Deploy to `dist/` directory
- Provide `*.vercel.app` URL

## Vercel Free Tier Limits

| Feature | Limit | Status |
|---------|-------|--------|
| **Bandwidth** | 100 GB/month | ✅ Sufficient |
| **Build Time** | 100 hours/month | ✅ Sufficient |
| **Serverless Functions** | 100 GB-hours | ✅ N/A (Convex handles) |
| **Deployments** | Unlimited | ✅ |
| **Custom Domains** | ❌ (only `*.vercel.app`) | ⚠️ Free tier limitation |
| **Team Features** | ❌ | ⚠️ Single user only |

## Configuration Files

### vercel.json (already configured)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/((?!assets/).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Build Configuration
- **Framework**: Vite (auto-detected)
- **Build Command**: `npm run build` (runs `npx convex dev --once` first)
- **Output Directory**: `dist`
- **Install Command**: `npm install` (default)

### Available Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production (includes Convex sync) |
| `npm run sync` | Push Convex functions once |
| `npm run sync:build` | Push Convex + build frontend |
| `./verify-deploy.sh` | Verify deployment readiness |
| `./setup-convex.sh` | Set up Convex deployment |

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

## Environment Variables

### Required (set in Vercel)
| Variable | Source | Description |
|----------|--------|-------------|
| `VITE_CONVEX_URL` | `.env.local` | Convex backend URL |
| `CONVEX_DEPLOY_KEY` | `.env.local` | Convex deploy key for build |

### Optional (set in Convex)
```bash
# AI features (if using)
npx convex env set ANTHROPIC_API_KEY "sk-ant-..."
npx convex env set OPENAI_API_KEY "sk-..."

# Stripe (if using payments)
npx convex env set STRIPE_SECRET_KEY "sk_live_..."
```

## Custom Domain (Optional)

Free tier doesn't support custom domains, but you can:
1. Upgrade to Vercel Pro ($20/month) for custom domains
2. Use a free domain service like Cloudflare Pages
3. Use `*.vercel.app` subdomain (free)

## Troubleshooting

### Build Fails
```bash
# Test build locally
cd deploy
npm install
npm run build
```

### Environment Variables Not Working
- Ensure `VITE_CONVEX_URL` and `CONVEX_DEPLOY_KEY` are set in Vercel dashboard
- Variables must start with `VITE_` to be accessible in frontend
- Convex runtime vars are set via `npx convex env set`

### Routing Issues
The `vercel.json` rewrites handle SPA routing:
- All routes → `/index.html`
- Static assets (`/assets/*`) served directly with caching

## Cost Breakdown

### Vercel Free Tier
- **Cost**: $0
- **Limits**: 100GB bandwidth, 100hrs build time
- **Features**: Automatic HTTPS, CI/CD, preview deployments

### Convex Free Tier
- **Cost**: $0
- **Limits**: 50K monthly database reads, 2GB storage
- **Features**: Real-time, auth, serverless functions

**Total Monthly Cost**: $0 (both free tiers)

## Next Steps

1. **Deploy**: Push to GitHub → Connect to Vercel
2. **Test**: Verify all features work with Convex backend
3. **Monitor**: Check Vercel dashboard for usage/bandwidth
4. **Scale**: Upgrade if you exceed free tier limits
