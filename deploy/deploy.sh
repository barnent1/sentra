#!/bin/bash
set -e

# Quetrex Hetzner CX32 Deployment Script
# Usage: ./deploy.sh [domain]
# Example: ./deploy.sh quetrex.example.com

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVER_NAME="quetrex-prod"
SERVER_TYPE="cx32"
IMAGE="ubuntu-24.04"
LOCATION="fsn1"
DOMAIN="${1:-}"

echo "========================================="
echo "  Quetrex Hetzner Deployment"
echo "========================================="

# Check if hcloud is configured
if ! hcloud context active &>/dev/null; then
    echo ""
    echo "Hetzner Cloud CLI not configured."
    echo "Please run: hcloud context create quetrex"
    echo "Then enter your Hetzner API token from:"
    echo "https://console.hetzner.cloud/projects/YOUR_PROJECT/security/tokens"
    echo ""
    exit 1
fi

echo "Using Hetzner context: $(hcloud context active)"

# Check if server already exists
if hcloud server describe "$SERVER_NAME" &>/dev/null; then
    echo ""
    echo "Server '$SERVER_NAME' already exists."
    SERVER_IP=$(hcloud server ip "$SERVER_NAME")
    echo "IP: $SERVER_IP"
    read -p "Delete and recreate? (y/N): " DELETE_SERVER
    if [[ "$DELETE_SERVER" =~ ^[Yy]$ ]]; then
        echo "Deleting existing server..."
        hcloud server delete "$SERVER_NAME"
        sleep 5
    else
        echo "Using existing server..."
        EXISTING=true
    fi
fi

if [[ "$EXISTING" != "true" ]]; then
    # Create SSH key if not exists
    SSH_KEY_NAME="quetrex-deploy"
    if ! hcloud ssh-key describe "$SSH_KEY_NAME" &>/dev/null; then
        echo "Creating SSH key..."
        if [[ ! -f ~/.ssh/id_rsa.pub ]]; then
            ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
        fi
        hcloud ssh-key create --name "$SSH_KEY_NAME" --public-key-from-file ~/.ssh/id_rsa.pub
    fi

    echo ""
    echo "Creating Hetzner CX32 server..."
    echo "  Name: $SERVER_NAME"
    echo "  Type: $SERVER_TYPE (4 vCPU, 8GB RAM, 80GB SSD)"
    echo "  Image: $IMAGE"
    echo "  Location: $LOCATION (Falkenstein, Germany)"
    echo ""

    hcloud server create \
        --name "$SERVER_NAME" \
        --type "$SERVER_TYPE" \
        --image "$IMAGE" \
        --location "$LOCATION" \
        --ssh-key "$SSH_KEY_NAME" \
        --user-data-from-file "$SCRIPT_DIR/cloud-init.yaml"

    echo "Waiting for server to be ready..."
    sleep 10
fi

# Get server IP
SERVER_IP=$(hcloud server ip "$SERVER_NAME")
echo ""
echo "Server IP: $SERVER_IP"

# Wait for SSH
echo "Waiting for SSH to be available..."
for i in {1..30}; do
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@"$SERVER_IP" "echo ok" &>/dev/null; then
        echo "SSH is ready!"
        break
    fi
    echo "  Attempt $i/30..."
    sleep 10
done

# Wait for cloud-init to complete
echo "Waiting for cloud-init to complete (this takes ~3-5 minutes)..."
ssh -o StrictHostKeyChecking=no root@"$SERVER_IP" "cloud-init status --wait" || true

# Create environment file
echo ""
echo "Creating environment configuration..."
cat > /tmp/quetrex.env << 'ENVEOF'
# Quetrex Production Environment
DATABASE_URL="postgresql://postgres:Quetrex2025!SecureDB@db.stfaeixxqisbomitnziy.supabase.co:5432/postgres?sslmode=require"
NEXT_PUBLIC_SUPABASE_URL="https://stfaeixxqisbomitnziy.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZmFlaXh4cWlzYm9taXRueml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjYzNzQsImV4cCI6MjA3OTkwMjM3NH0.HGR4LO52hKNeINJE6VFJWD2oDiESRVhh6qPxN4T2cI0"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZmFlaXh4cWlzYm9taXRueml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMyNjM3NCwiZXhwIjoyMDc5OTAyMzc0fQ.AlZr8FstI8hzUBkIKybWhnz-6l1kyAts-uaJX9cec24"
JWT_SECRET="quetrex-production-jwt-secret-change-this-in-production"
JWT_REFRESH_SECRET="quetrex-production-refresh-secret-change-this"
NODE_ENV="production"
PORT=3000
ENVEOF

scp -o StrictHostKeyChecking=no /tmp/quetrex.env root@"$SERVER_IP":/opt/quetrex-app/.env
rm /tmp/quetrex.env

# Start the application
echo "Starting Quetrex..."
ssh -o StrictHostKeyChecking=no root@"$SERVER_IP" "cd /opt/quetrex-app && /opt/quetrex/start.sh"

# Setup SSL if domain provided
if [[ -n "$DOMAIN" ]]; then
    echo ""
    echo "Setting up SSL for $DOMAIN..."
    ssh -o StrictHostKeyChecking=no root@"$SERVER_IP" << SSLEOF
sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/quetrex
systemctl reload nginx
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "SSL setup failed - you may need to configure DNS first"
SSLEOF
fi

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "Server: $SERVER_NAME"
echo "IP: $SERVER_IP"
echo ""
if [[ -n "$DOMAIN" ]]; then
    echo "URL: https://$DOMAIN"
    echo ""
    echo "DNS Setup Required:"
    echo "  Add an A record: $DOMAIN -> $SERVER_IP"
else
    echo "URL: http://$SERVER_IP"
    echo ""
    echo "To add SSL later, run:"
    echo "  ./deploy.sh your-domain.com"
fi
echo ""
echo "SSH Access:"
echo "  ssh root@$SERVER_IP"
echo ""
echo "View logs:"
echo "  ssh root@$SERVER_IP 'pm2 logs quetrex'"
echo ""
echo "Update Quetrex CLI command URLs:"
echo "  Update .claude/commands/quetrex-init.md to use http://$SERVER_IP"
echo ""
