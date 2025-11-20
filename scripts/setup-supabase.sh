#!/bin/bash

# Sentra - Supabase Setup Script
# This script sets up Supabase and runs database migrations

set -e  # Exit on error

echo "🚀 Sentra - Supabase Setup"
echo "================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo ""
    echo "Please set your Supabase connection string:"
    echo "export DATABASE_URL='postgresql://postgres:[password]@[host]:5432/postgres'"
    echo ""
    echo "To get your connection string:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings > Database"
    echo "4. Copy the 'Connection string' (URI format)"
    echo "5. Replace [password] with your database password"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Check if Drizzle is installed
if ! command -v drizzle-kit &> /dev/null; then
    echo "📦 Installing Drizzle Kit..."
    npm install -D drizzle-kit
fi

echo "✅ Drizzle Kit is installed"
echo ""

# Generate migration files
echo "📝 Generating migration files..."
npm run drizzle:generate

echo "✅ Migration files generated"
echo ""

# Push schema to database
echo "🗄️  Pushing schema to Supabase..."
npm run drizzle:push

echo "✅ Schema pushed to Supabase"
echo ""

# Verify tables were created
echo "🔍 Verifying tables..."
echo "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" | psql "$DATABASE_URL"

echo ""
echo "🎉 Supabase setup complete!"
echo ""
echo "Next steps:"
echo "1. Update Vercel environment variables with DATABASE_URL"
echo "2. Redeploy to Vercel: vercel --prod"
echo "3. Test your application"
echo ""
