#!/bin/bash

APP_NAME="<%= APP_NAME %>"
ENV_VARS="<%= ENV_VARS %>"

echo "=== Updating $APP_NAME Configuration ==="

CURRENT_DIR="/opt/$APP_NAME/current"

if [ ! -d "$CURRENT_DIR" ]; then
    echo "Error: No current deployment found"
    exit 1
fi

cd "$CURRENT_DIR"

# Update environment variables
echo "Updating environment variables..."
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d-%H%M%S)
fi

# Write new environment variables if provided
if [ "$ENV_VARS" != "{}" ] && [ ! -z "$ENV_VARS" ]; then
    echo "$ENV_VARS" | jq -r 'to_entries[] | "\(.key)=\(.value)"' > .env.new
    if [ -s .env.new ]; then
        mv .env.new .env
        echo "Environment variables updated"
    else
        echo "No valid environment variables provided"
        rm -f .env.new
    fi
fi

# Restart services to pick up new configuration
echo "Restarting services to apply configuration..."
/usr/local/bin/docker-compose restart

echo "Configuration update complete!"