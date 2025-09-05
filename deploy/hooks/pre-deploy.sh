#!/bin/bash
set -e

echo "🔍 Pre-deploy: Running pre-deployment checks..."

# Check if .env.production exists
if [ ! -f "../.env.production" ]; then
    echo "⚠️  No .env.production found, will use generated environment"
else
    echo "✅ Found .env.production"
fi

# Validate Docker files
if [ ! -f "../docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found!"
    exit 1
fi

echo "✅ Docker configuration found"

# Check if we have required secrets
echo "Checking for required environment variables..."
if [ -f "../.env.production" ]; then
    source ../.env.production
    
    required_vars=(
        "PUSHOVER_APP_TOKEN"
        "PUSHOVER_USER_KEY" 
        "OPENAI_API_KEY"
        "SENTRA_API_TOKEN"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo "✅ All required environment variables are set"
    else
        echo "⚠️  Missing environment variables: ${missing_vars[*]}"
        echo "   Deployment will continue but some features may not work"
    fi
fi

# Run any tests if they exist
if [ -f "../package.json" ] && grep -q '"test"' ../package.json; then
    echo "🧪 Running tests..."
    cd .. && npm test
    echo "✅ Tests passed"
fi

echo "✅ Pre-deployment checks complete"