#!/bin/bash
set -e

echo "Setting up Docker and system dependencies..."

# Update system
sudo apt update
sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git htop

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi

# Setup firewall if requested
if [ "$SETUP_FIREWALL" = "true" ]; then
    echo "Setting up firewall..."
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
fi

# Create swap if needed (for smaller servers)
if ! swapon --show | grep -q "/swapfile"; then
    echo "Creating swap file..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1024 count=2097152
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "Docker setup completed successfully"