#!/bin/bash
set -e

echo "🔧 Pre-setup: Preparing server for Sentra deployment..."

# Check if we can connect
echo "Testing SSH connection..."

# Basic system info
echo "Server info:"
uname -a
df -h
free -m

echo "✅ Pre-setup checks complete"