#!/bin/bash
set -e

DEPLOYMENT_ID="<%= DEPLOYMENT_ID %>"
APP_NAME="<%= APP_NAME %>"
ENV_VARS='<%= ENV_VARS %>'
HAS_ENV_FILE="<%= HAS_ENV_FILE %>"

echo "Executing deployment for $APP_NAME version $DEPLOYMENT_ID"

# Change ownership of temp files to the app user
sudo chown $APP_NAME:$APP_NAME /tmp/$APP_NAME-$DEPLOYMENT_ID.tar.gz 2>/dev/null || true
if [ "$HAS_ENV_FILE" = "true" ] && [ -f "/tmp/$APP_NAME-$DEPLOYMENT_ID.env" ]; then
    sudo chown $APP_NAME:$APP_NAME /tmp/$APP_NAME-$DEPLOYMENT_ID.env
fi

# Run the deployment script with proper arguments
sudo -u $APP_NAME /opt/$APP_NAME/deploy.sh "$DEPLOYMENT_ID" "$APP_NAME" "$HAS_ENV_FILE"

echo "Deployment script completed"