#!/bin/bash
set -e

echo "🚀 Post-setup: Finalizing server configuration..."

# Verify Docker installation
if docker --version && docker-compose --version; then
    echo "✅ Docker and Docker Compose installed successfully"
else
    echo "❌ Docker installation failed"
    exit 1
fi

# Create swap if not exists (helpful for smaller servers)
if ! swapon --show | grep -q "/swapfile"; then
    echo "Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ Swap file created"
fi

# Setup log rotation
cat > /etc/logrotate.d/sentra << EOF
/opt/sentra/current/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 sentra sentra
}
EOF

echo "✅ Log rotation configured"

# Setup cron for cleanup
(crontab -u sentra -l 2>/dev/null; echo "0 2 * * * /opt/sentra/cleanup.sh") | crontab -u sentra -

# Create cleanup script
cat > /opt/sentra/cleanup.sh << 'EOF'
#!/bin/bash
# Clean up old Docker images and containers
docker system prune -f
# Clean up old deployments (keep last 5)
cd /opt/sentra/deployments && ls -1t | tail -n +6 | xargs rm -rf
# Clean up old backups (keep last 10)
cd /opt/sentra/backup && ls -1t | tail -n +11 | xargs rm -rf
EOF

chmod +x /opt/sentra/cleanup.sh
chown sentra:sentra /opt/sentra/cleanup.sh

echo "✅ Automated cleanup configured"
echo "🎉 Server setup complete! Ready for deployment."