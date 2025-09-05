#!/bin/bash
set -e

DEPLOYMENT_ID="<%= DEPLOYMENT_ID %>"
APP_NAME="<%= APP_NAME %>"
ENV_VARS='<%= ENV_VARS %>'
HAS_ENV_FILE="<%= HAS_ENV_FILE %>"

echo "=== MUP-Style Deployment for $APP_NAME version $DEPLOYMENT_ID ==="

DEPLOYMENT_DIR="/opt/$APP_NAME/deployments/$DEPLOYMENT_ID"
CURRENT_DIR="/opt/$APP_NAME/current"
BUNDLE_PATH="/tmp/$APP_NAME-bundle-$DEPLOYMENT_ID.tar.gz"
ENV_FILE_PATH="/tmp/$APP_NAME-env-$DEPLOYMENT_ID"

# Create deployment directory as the app user
sudo -u $APP_NAME mkdir -p "$DEPLOYMENT_DIR"
cd "$DEPLOYMENT_DIR"

# Extract bundle (exactly like MUP does)
if [ -f "$BUNDLE_PATH" ]; then
    echo "Extracting bundle..."
    sudo -u $APP_NAME tar -xzf "$BUNDLE_PATH" -C "$DEPLOYMENT_DIR"
    rm "$BUNDLE_PATH"
    echo "Bundle extracted successfully"
else
    echo "Bundle not found at $BUNDLE_PATH!"
    exit 1
fi

# Copy environment file if exists
if [ "$HAS_ENV_FILE" = "true" ] && [ -f "$ENV_FILE_PATH" ]; then
    echo "Copying environment file..."
    sudo -u $APP_NAME cp "$ENV_FILE_PATH" "$DEPLOYMENT_DIR/.env"
    rm "$ENV_FILE_PATH"
    echo "Environment file copied"
fi

# Write environment variables to .env if provided
if [ "$ENV_VARS" != "{}" ] && [ ! -z "$ENV_VARS" ]; then
    echo "Writing environment variables..."
    echo "$ENV_VARS" | jq -r 'to_entries[] | "\(.key)=\(.value)"' | sudo -u $APP_NAME tee -a "$DEPLOYMENT_DIR/.env" > /dev/null
    echo "Environment variables written"
fi

# Backup current deployment if it exists
if [ -L "$CURRENT_DIR" ] && [ -e "$CURRENT_DIR" ]; then
    BACKUP_DIR="/opt/$APP_NAME/backup/$(date +%Y%m%d-%H%M%S)"
    sudo -u $APP_NAME mkdir -p "$(dirname "$BACKUP_DIR")"
    sudo -u $APP_NAME cp -r "$(readlink -f "$CURRENT_DIR")" "$BACKUP_DIR"
    echo "Backed up current deployment to $BACKUP_DIR"
    
    # Stop current services gracefully
    cd "$(readlink -f "$CURRENT_DIR")"
    if [ -f "docker-compose.yml" ]; then
        echo "Stopping current services..."
        /usr/local/bin/docker-compose down || true
        echo "Current services stopped"
    fi
fi

# Atomic symlink update (exactly like MUP does)
echo "Updating deployment symlink..."
sudo -u $APP_NAME ln -sfn "$DEPLOYMENT_DIR" "$CURRENT_DIR.new"
sudo -u $APP_NAME mv "$CURRENT_DIR.new" "$CURRENT_DIR"
echo "Symlink updated atomically"

# Start new services
cd "$CURRENT_DIR"
if [ -f "docker-compose.yml" ]; then
    echo "Pulling Docker images..."
    /usr/local/bin/docker-compose pull
    
    echo "Building and starting services..."
    /usr/local/bin/docker-compose up -d --build
    echo "Services started successfully"
else
    echo "No docker-compose.yml found!"
    exit 1
fi

# Cleanup old deployments (keep last 5)
echo "Cleaning up old deployments..."
cd /opt/$APP_NAME/deployments
ls -1t | tail -n +6 | xargs rm -rf 2>/dev/null || true
echo "Old deployments cleaned up"

echo "=== Deployment $DEPLOYMENT_ID completed successfully ==="