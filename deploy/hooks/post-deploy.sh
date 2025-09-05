#!/bin/bash
set -e

echo "🎯 Post-deploy: Verifying deployment and running post-deployment tasks..."

# Wait for services to be fully ready
echo "Waiting for services to start..."
sleep 15

# Health check with retries
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "Health check attempt $attempt/$max_attempts..."
    
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Health check passed"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Health check failed after $max_attempts attempts"
        echo "🔍 Checking service status..."
        docker-compose ps
        echo "🔍 Recent logs:"
        docker-compose logs --tail=50
        exit 1
    fi
    
    echo "Retrying in 10 seconds..."
    sleep 10
    ((attempt++))
done

# Test MCP endpoint
echo "Testing MCP WebSocket endpoint..."
if curl -I http://localhost:8000/mcp 2>/dev/null | grep -q "426\|101"; then
    echo "✅ MCP endpoint responding"
else
    echo "⚠️  MCP endpoint may not be working correctly"
fi

# Check database connection
echo "Testing database connection..."
if docker-compose exec -T postgres pg_isready -U sentra > /dev/null 2>&1; then
    echo "✅ Database connection healthy"
else
    echo "⚠️  Database connection issues detected"
fi

# Show service status
echo "📊 Final service status:"
docker-compose ps

# Show memory usage
echo "📈 Memory usage:"
free -h

# Show disk usage
echo "💾 Disk usage:"
df -h /opt/sentra

# Create deployment manifest
cat > /opt/sentra/current/deployment.json << EOF
{
  "deployment_id": "$(basename $(readlink -f /opt/sentra/current))",
  "deployed_at": "$(date -Iseconds)",
  "git_commit": "$(cd /opt/sentra/current && git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "services": $(docker-compose ps --format json 2>/dev/null || echo '[]')
}
EOF

echo "✅ Deployment manifest created"

echo "🎉 Post-deployment tasks complete!"
echo "🌐 Sentra is now running and ready to serve requests"