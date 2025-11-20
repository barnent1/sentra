#!/bin/bash
# Setup Next.js with Sentra Standard Stack
# Created by Glen Barnhardt with help from Claude Code
#
# This script initializes a Next.js project with the recommended stack
# from .sentra/config/stack.yml

set -e

PROJECT_DIR="${1:-.}"
SKIP_INSTALL="${2:-false}"

echo "🚀 Setting up Next.js with Sentra Standard Stack"
echo "📁 Project directory: $PROJECT_DIR"
echo ""

cd "$PROJECT_DIR"

# Step 1: Create Next.js project
echo "📦 Step 1: Creating Next.js 15 project..."
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm \
  --no-turbopack \
  --skip-install

echo "✅ Next.js project created"
echo ""

# Step 2: Install core dependencies
echo "📦 Step 2: Installing core dependencies..."

if [ "$SKIP_INSTALL" = "false" ]; then
  npm install --save \
    next@15.5.3 \
    react@19.0.0 \
    react-dom@19.0.0

  npm install --save-dev \
    typescript@5.6.3 \
    @types/node \
    @types/react \
    @types/react-dom

  echo "✅ Core dependencies installed"
else
  echo "⏭️  Skipping installation (--skip-install flag)"
fi
echo ""

# Step 3: Install UI & Styling
echo "📦 Step 3: Installing UI & Styling..."

if [ "$SKIP_INSTALL" = "false" ]; then
  npm install --save \
    lucide-react \
    class-variance-authority \
    clsx \
    tailwind-merge

  npm install --save-dev \
    tailwindcss \
    tailwindcss-animate \
    autoprefixer \
    postcss

  echo "✅ UI & Styling dependencies installed"
fi
echo ""

# Step 4: Install Supabase
echo "📦 Step 4: Installing Supabase..."

if [ "$SKIP_INSTALL" = "false" ]; then
  npm install --save \
    @supabase/supabase-js \
    @supabase/ssr

  npm install --save-dev supabase

  echo "✅ Supabase client installed"
  echo "⚠️  Run 'npx supabase init' to initialize local Supabase"
fi
echo ""

# Step 4b: Install Drizzle ORM
echo "📦 Step 4b: Installing Drizzle ORM..."

if [ "$SKIP_INSTALL" = "false" ]; then
  npm install --save \
    drizzle-orm \
    postgres

  npm install --save-dev drizzle-kit

  echo "✅ Drizzle ORM installed"
fi
echo ""

# Step 5: Install Forms & Validation
echo "📦 Step 5: Installing Forms & Validation..."

if [ "$SKIP_INSTALL" = "false" ]; then
  npm install --save \
    react-hook-form \
    @hookform/resolvers \
    zod

  echo "✅ Forms & Validation installed"
fi
echo ""

# Step 6: Install State & Data Fetching
echo "📦 Step 6: Installing State Management & Data Fetching..."

if [ "$SKIP_INSTALL" = "false" ]; then
  npm install --save \
    zustand \
    @tanstack/react-query

  echo "✅ State & Data Fetching installed"
fi
echo ""

# Step 7: Authentication (Supabase Auth - already installed)
echo "📦 Step 7: Authentication (Supabase Auth)..."
echo "✅ Supabase Auth included with Supabase (no additional install needed)"
echo ""

# Step 8: Install Testing
echo "📦 Step 8: Installing Testing Infrastructure..."

if [ "$SKIP_INSTALL" = "false" ]; then
  npm install --save-dev \
    vitest \
    @vitejs/plugin-react \
    @testing-library/react \
    @testing-library/jest-dom \
    @playwright/test

  # Initialize Playwright
  npx playwright install

  echo "✅ Testing infrastructure installed"
fi
echo ""

# Step 9: Install Code Quality Tools
echo "📦 Step 9: Installing Code Quality Tools..."

if [ "$SKIP_INSTALL" = "false" ]; then
  npm install --save-dev \
    prettier \
    prettier-plugin-tailwindcss

  echo "✅ Code Quality tools installed"
fi
echo ""

# Step 10: Add scripts to package.json
echo "⚙️  Step 10: Adding npm scripts..."

# Use jq to update package.json if available, otherwise manual
if command -v jq &> /dev/null; then
  cat package.json | jq '.scripts += {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "supabase:start": "npx supabase start",
    "supabase:stop": "npx supabase stop",
    "supabase:status": "npx supabase status"
  }' > package.json.tmp && mv package.json.tmp package.json

  echo "✅ npm scripts added"
else
  echo "⚠️  jq not found, skipping script addition (install manually)"
fi
echo ""

# Step 11: Create .env.example
echo "📝 Step 11: Creating environment template..."

cat > .env.example << 'EOF'
# Supabase (get these from https://supabase.com/dashboard/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Database (for Drizzle - use Supabase connection string)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres"

# Optional: Supabase Local Development
# NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your-local-anon-key"

# Optional: OAuth Providers (configure in Supabase Dashboard)
# Already configured in Supabase, no keys needed in .env unless custom

# Optional: Upstash Redis (if using caching)
# UPSTASH_REDIS_REST_URL=""
# UPSTASH_REDIS_REST_TOKEN=""
EOF

echo "✅ .env.example created"
echo ""

# Step 12: Create vitest.config.ts
echo "⚙️  Step 12: Creating Vitest configuration..."

cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '.next/'],
      thresholds: {
        global: {
          lines: 75,
          functions: 75,
          branches: 75,
          statements: 75
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
EOF

echo "✅ vitest.config.ts created"
echo ""

# Step 13: Create tests directory
echo "📁 Step 13: Creating test structure..."

mkdir -p tests/unit tests/integration tests/e2e

cat > tests/setup.ts << 'EOF'
import '@testing-library/jest-dom'
EOF

echo "✅ Test directories created"
echo ""

# Step 14: Create prettier config
echo "⚙️  Step 14: Creating Prettier configuration..."

cat > .prettierrc << 'EOF'
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
EOF

echo "✅ .prettierrc created"
echo ""

# Step 15: Update tsconfig.json for strict mode
echo "⚙️  Step 15: Enabling TypeScript strict mode..."

if command -v jq &> /dev/null; then
  cat tsconfig.json | jq '.compilerOptions.strict = true |
    .compilerOptions.noImplicitAny = true |
    .compilerOptions.strictNullChecks = true |
    .compilerOptions.noUnusedLocals = true |
    .compilerOptions.noUnusedParameters = true' > tsconfig.json.tmp && mv tsconfig.json.tmp tsconfig.json

  echo "✅ TypeScript strict mode enabled"
else
  echo "⚠️  jq not found, enable strict mode manually in tsconfig.json"
fi
echo ""

# Summary
echo "✨ Setup Complete!"
echo ""
echo "📚 Stack Installed:"
echo "  - Next.js 15.5 (App Router, RSC)"
echo "  - TypeScript 5.6 (Strict Mode)"
echo "  - Tailwind CSS 3.4"
echo "  - Supabase (Database + Auth + Storage + Realtime)"
echo "  - Drizzle ORM"
echo "  - React Hook Form + Zod"
echo "  - Zustand + TanStack Query"
echo "  - Vitest + Playwright"
echo ""
echo "🎯 Next Steps:"
echo "  1. Create Supabase project at https://supabase.com/dashboard"
echo "  2. Copy .env.example to .env and add your Supabase keys"
echo "  3. Run: npm install (if skipped)"
echo "  4. Run: npx shadcn@latest init (for UI components)"
echo "  5. Run: npx supabase init (for local development)"
echo "  6. Run: npm run dev (start development server)"
echo ""
echo "📖 Documentation:"
echo "  - Setup Guide: docs/setup/SUPABASE-SETUP.md"
echo "  - Stack Details: SENTRA-STANDARD-STACK-FINAL.md"
echo ""
