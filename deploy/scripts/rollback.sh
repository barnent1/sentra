#!/bin/bash
set -e

APP_NAME="<%= APP_NAME %>"
ROLLBACK_VERSION="<%= ROLLBACK_VERSION %>"

echo "Rolling back $APP_NAME to version: $ROLLBACK_VERSION"

# Execute rollback script
sudo -u $APP_NAME /opt/$APP_NAME/rollback.sh "$APP_NAME" "$ROLLBACK_VERSION"

echo "Rollback completed"