#!/bin/bash
# Vercel Deployment Verification Script
# Run this before pushing to verify everything is ready

set -e

echo "🔍 Checking Vercel deployment readiness..."

# Check if we're in the deploy directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the deploy/ directory"
    exit 1
fi

# Check for required files
echo "📁 Checking required files..."
required_files=("package.json" "vercel.json" "index.html" "vite.config.ts")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file missing"
        exit 1
    fi
done

# Check package.json scripts
echo "📦 Checking package.json scripts..."
if grep -q '"build"' package.json; then
    echo "  ✅ Build script found"
else
    echo "  ❌ Build script missing in package.json"
    exit 1
fi

# Check vercel.json configuration
echo "🔧 Checking vercel.json configuration..."
if grep -q '"outputDirectory"' vercel.json; then
    echo "  ✅ Output directory configured"
else
    echo "  ⚠️  Output directory not set in vercel.json"
fi

if grep -q '"rewrites"' vercel.json; then
    echo "  ✅ SPA rewrites configured"
else
    echo "  ⚠️  SPA rewrites missing"
fi

# Check for environment variables
echo "🔑 Checking environment variables..."
if [ -f ".env.local" ]; then
    if grep -q "VITE_CONVEX_URL" .env.local; then
        echo "  ✅ VITE_CONVEX_URL found in .env.local"
    else
        echo "  ⚠️  VITE_CONVEX_URL not found in .env.local"
    fi
    if grep -q "CONVEX_DEPLOY_KEY" .env.local; then
        echo "  ✅ CONVEX_DEPLOY_KEY found in .env.local"
    else
        echo "  ⚠️  CONVEX_DEPLOY_KEY not found in .env.local"
    fi
else
    echo "  ⚠️  .env.local not found"
    echo "     Run 'npx convex dev' to set up Convex deployment first"
fi

# Test build
echo "🏗️  Testing build..."
if npm run build 2>/dev/null; then
    echo "  ✅ Build successful"
    
    # Check output directory
    if [ -d "dist" ]; then
        echo "  ✅ dist/ directory created"
        file_count=$(find dist -type f | wc -l)
        echo "  📊 Output: $file_count files"
    else
        echo "  ❌ dist/ directory not created"
        exit 1
    fi
else
    echo "  ❌ Build failed"
    exit 1
fi

echo ""
echo "✅ Deployment verification complete!"
echo ""
echo "Next steps:"
echo "1. Set up Convex deployment: npx convex dev"
echo "2. Commit changes: git add . && git commit -m 'Prepare for Vercel deployment'"
echo "3. Push to GitHub: git push origin main"
echo "4. Connect to Vercel: vercel.com/new → Import repository"
echo "5. Set Root Directory to: deploy"
echo "6. Add environment variables:"
echo "   - VITE_CONVEX_URL=<your-convex-url>"
echo "   - CONVEX_DEPLOY_KEY=<your-deploy-key>"
echo "7. Deploy!"
