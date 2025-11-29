#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "  Quetrex Terraform Deployment"
echo "========================================="
echo ""

# Check terraform
if ! command -v terraform &> /dev/null; then
    echo "Terraform not found. Installing..."
    brew tap hashicorp/tap && brew install hashicorp/tap/terraform
fi

# Check for tfvars
if [[ ! -f "$SCRIPT_DIR/terraform.tfvars" ]]; then
    echo "terraform.tfvars not found!"
    echo ""
    echo "Create it from the example:"
    echo "  cp terraform.tfvars.example terraform.tfvars"
    echo ""
    echo "Then edit terraform.tfvars with your Hetzner API token."
    echo "Get token from: https://console.hetzner.cloud"
    echo ""
    exit 1
fi

# Check for SSH key
if [[ ! -f ~/.ssh/id_rsa.pub ]]; then
    echo "SSH key not found. Creating..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
fi

cd "$SCRIPT_DIR"

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Plan
echo ""
echo "Planning deployment..."
terraform plan -out=tfplan

echo ""
read -p "Apply this plan? (y/N): " APPLY
if [[ ! "$APPLY" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Apply
echo ""
echo "Deploying to Hetzner..."
terraform apply tfplan

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
terraform output

echo ""
echo "The server is provisioning. It takes ~5 minutes for:"
echo "  - Node.js installation"
echo "  - npm install"
echo "  - Application build"
echo ""
echo "Check status:"
echo "  ssh root@\$(terraform output -raw server_ip) 'cloud-init status'"
echo ""
echo "View logs:"
echo "  ssh root@\$(terraform output -raw server_ip) 'pm2 logs quetrex'"
echo ""
