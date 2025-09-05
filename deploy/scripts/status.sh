#!/bin/bash

APP_NAME="<%= APP_NAME %>"

echo "=== $APP_NAME Deployment Status ==="

# Current deployment info
if [ -L "/opt/$APP_NAME/current" ]; then
    CURRENT_DEPLOYMENT=$(basename $(readlink -f /opt/$APP_NAME/current))
    echo "Current deployment: $CURRENT_DEPLOYMENT"
else
    echo "Current deployment: Not deployed"
fi

echo ""
echo "=== Docker Services ==="
if [ -d "/opt/$APP_NAME/current" ]; then
    cd /opt/$APP_NAME/current
    if [ -f "docker-compose.yml" ]; then
        /usr/local/bin/docker-compose ps
    else
        echo "No docker-compose.yml found"
    fi
else
    echo "No current deployment found"
fi

echo ""
echo "=== System Resources ==="
echo "Memory usage:"
free -h

echo ""
echo "Disk usage:"
df -h /opt/$APP_NAME

echo ""
echo "=== Recent Deployments ==="
if [ -d "/opt/$APP_NAME/deployments" ]; then
    echo "Available deployments:"
    ls -lt /opt/$APP_NAME/deployments | head -5
else
    echo "No deployments found"
fi

echo ""
echo "=== Recent Backups ==="
if [ -d "/opt/$APP_NAME/backup" ]; then
    echo "Available backups:"
    ls -lt /opt/$APP_NAME/backup | head -5
else
    echo "No backups found"
fi

echo ""
echo "=== Systemd Service Status ==="
systemctl status $APP_NAME.service --no-pager || echo "Service not found"