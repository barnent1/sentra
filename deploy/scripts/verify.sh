#!/bin/bash
set -e

APP_NAME="<%= APP_NAME %>"
HEALTH_CHECK_URL="<%= HEALTH_CHECK_URL %>"
WAIT_TIME="<%= WAIT_TIME %>"

echo "Verifying deployment for $APP_NAME..."

# Wait for services to start
echo "Waiting for services to initialize..."
sleep 15

# Health check with retries
max_attempts=$((WAIT_TIME / 5))
attempt=1

echo "Starting health checks (max $max_attempts attempts, 5 second intervals)..."

while [ $attempt -le $max_attempts ]; do
    echo "Health check attempt $attempt/$max_attempts..."
    
    if curl -f "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
        echo "✅ Health check passed!"
        
        # Show running services
        echo "📊 Service status:"
        cd /opt/$APP_NAME/current
        /usr/local/bin/docker-compose ps
        
        echo "🎉 Deployment verification successful!"
        exit 0
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Health check failed after $max_attempts attempts"
        echo "🔍 Service status:"
        cd /opt/$APP_NAME/current
        /usr/local/bin/docker-compose ps
        echo "🔍 Recent logs:"
        /usr/local/bin/docker-compose logs --tail=20
        exit 1
    fi
    
    echo "Retrying in 5 seconds..."
    sleep 5
    ((attempt++))
done