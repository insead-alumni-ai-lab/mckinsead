#!/bin/bash
# Convex Deployment Setup Script
# This script helps set up Convex for Vercel deployment

set -e

echo "🚀 Setting up Convex for Vercel deployment..."

# Check if we're in the deploy directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the deploy/ directory"
    exit 1
fi

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "📋 Current .env.local:"
    cat .env.local
    echo ""
    
    # Check if it's using anonymous deployment
    if grep -q "anonymous:anonymous-deploy" .env.local; then
        echo "⚠️  You're using anonymous deployment (local development only)"
        echo "   For Vercel deployment, you need a proper Convex account"
        echo ""
        echo "Follow these steps:"
        echo "1. Go to https://convex.dev and create an account"
        echo "2. Create a new project"
        echo "3. Run: npx convex dev --once"
        echo "4. Follow the prompts to link your project"
        echo "5. This script will update .env.local with the correct values"
        echo ""
        read -p "Press Enter when you've completed steps 1-3, or Ctrl+C to abort..."
    fi
fi

# Run convex dev to set up deployment
echo "🔧 Setting up Convex deployment..."
npx convex dev --once

# Check if .env.local was updated
if [ -f ".env.local" ]; then
    echo ""
    echo "✅ Convex deployment configured!"
    echo ""
    echo "📋 Current .env.local:"
    cat .env.local
    echo ""
    
    # Check if it's still anonymous
    if grep -q "anonymous:anonymous-deploy" .env.local; then
        echo "⚠️  Still using anonymous deployment"
        echo "   Please run 'npx convex dev' and follow the prompts to link to your Convex project"
    else
        echo "✅ Using proper Convex deployment"
        echo ""
        echo "Next steps for Vercel deployment:"
        echo "1. Get your deploy key: grep CONVEX_DEPLOY_KEY .env.local"
        echo "2. Add to Vercel dashboard:"
        echo "   - VITE_CONVEX_URL=<your-convex-url>"
        echo "   - CONVEX_DEPLOY_KEY=<your-deploy-key>"
        echo "3. Deploy to Vercel!"
    fi
else
    echo "❌ .env.local not created"
    echo "   Please run 'npx convex dev' manually and follow the prompts"
fi
