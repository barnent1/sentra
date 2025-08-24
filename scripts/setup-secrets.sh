#!/bin/bash

# SENTRA Production Secrets Setup
# This script generates secure secrets and sets up the production environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env.production"
TEMPLATE_FILE=".env.production.template"
SECRETS_DIR="./secrets"
VAULT_CONFIG_DIR="./infrastructure/vault"

echo -e "${BLUE}🔐 SENTRA Production Secrets Setup${NC}"
echo "=================================="

# Check if running on production server
if [[ "${NODE_ENV:-}" != "production" && "${FORCE_PRODUCTION:-}" != "true" ]]; then
    echo -e "${YELLOW}⚠️  Warning: Not running in production environment${NC}"
    echo "Set NODE_ENV=production or FORCE_PRODUCTION=true to continue"
    exit 1
fi

# Create secrets directory
mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

echo -e "${GREEN}✅ Creating secrets directory${NC}"

# Function to generate random string
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate hex string
generate_hex() {
    local length=${1:-32}
    openssl rand -hex $length
}

# Function to update env file
update_env_var() {
    local var_name=$1
    local var_value=$2
    local env_file=${3:-$ENV_FILE}
    
    if grep -q "^${var_name}=" "$env_file"; then
        sed -i.bak "s/^${var_name}=.*/${var_name}=${var_value}/" "$env_file"
    else
        echo "${var_name}=${var_value}" >> "$env_file"
    fi
}

# Copy template if env file doesn't exist
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${GREEN}📝 Creating $ENV_FILE from template${NC}"
    cp "$TEMPLATE_FILE" "$ENV_FILE"
    chmod 600 "$ENV_FILE"
fi

echo -e "${GREEN}🔑 Generating production secrets...${NC}"

# Generate core secrets
JWT_SECRET=$(generate_hex 64)
ENCRYPTION_KEY=$(generate_secret 44)
ENCRYPTION_IV=$(generate_secret 16)
GRAFANA_SECRET_KEY=$(generate_secret 32)
VAULT_TOKEN=$(generate_hex 32)
VAULT_UNSEAL_KEY=$(generate_hex 32)

# Generate passwords
POSTGRES_PASSWORD=$(generate_secret 32)
REDIS_PASSWORD=$(generate_secret 32)
RABBITMQ_PASSWORD=$(generate_secret 32)
GRAFANA_ADMIN_PASSWORD=$(generate_secret 24)
BACKUP_ENCRYPTION_KEY=$(generate_hex 64)

echo -e "${GREEN}💾 Updating environment file...${NC}"

# Update environment file with generated secrets
update_env_var "JWT_SECRET" "$JWT_SECRET"
update_env_var "ENCRYPTION_KEY" "$ENCRYPTION_KEY"
update_env_var "ENCRYPTION_IV" "$ENCRYPTION_IV"
update_env_var "GRAFANA_SECRET_KEY" "$GRAFANA_SECRET_KEY"
update_env_var "VAULT_TOKEN" "$VAULT_TOKEN"
update_env_var "VAULT_UNSEAL_KEY" "$VAULT_UNSEAL_KEY"
update_env_var "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD"
update_env_var "REDIS_PASSWORD" "$REDIS_PASSWORD"
update_env_var "RABBITMQ_PASSWORD" "$RABBITMQ_PASSWORD"
update_env_var "GRAFANA_ADMIN_PASSWORD" "$GRAFANA_ADMIN_PASSWORD"
update_env_var "BACKUP_ENCRYPTION_KEY" "$BACKUP_ENCRYPTION_KEY"

# Create individual secret files for Docker secrets
echo -e "${GREEN}📁 Creating Docker secret files...${NC}"

echo "$POSTGRES_PASSWORD" > "$SECRETS_DIR/postgres_password"
echo "$REDIS_PASSWORD" > "$SECRETS_DIR/redis_password"
echo "$RABBITMQ_PASSWORD" > "$SECRETS_DIR/rabbitmq_password"
echo "$JWT_SECRET" > "$SECRETS_DIR/jwt_secret"
echo "$ENCRYPTION_KEY" > "$SECRETS_DIR/encryption_key"
echo "$GRAFANA_ADMIN_PASSWORD" > "$SECRETS_DIR/grafana_admin_password"
echo "$VAULT_TOKEN" > "$SECRETS_DIR/vault_token"

# Set proper permissions
chmod 600 "$SECRETS_DIR"/*

# Generate SSL certificate if not exists
SSL_DIR="./infrastructure/nginx/certs"
mkdir -p "$SSL_DIR"

if [[ ! -f "$SSL_DIR/sentra.com.crt" ]]; then
    echo -e "${GREEN}🔒 Generating self-signed SSL certificate for development...${NC}"
    echo -e "${YELLOW}⚠️  For production, replace with valid certificates from CA${NC}"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/sentra.com.key" \
        -out "$SSL_DIR/sentra.com.crt" \
        -subj "/C=US/ST=CA/L=San Francisco/O=SENTRA/OU=DevOps/CN=sentra.com/emailAddress=admin@sentra.com" \
        -extensions v3_req \
        -config <(
            echo '[req]'
            echo 'default_bits = 2048'
            echo 'prompt = no'
            echo 'distinguished_name = req_distinguished_name'
            echo 'req_extensions = v3_req'
            echo '[req_distinguished_name]'
            echo 'C = US'
            echo 'ST = CA'
            echo 'L = San Francisco'
            echo 'O = SENTRA'
            echo 'OU = DevOps'
            echo 'CN = sentra.com'
            echo 'emailAddress = admin@sentra.com'
            echo '[v3_req]'
            echo 'keyUsage = keyEncipherment, dataEncipherment'
            echo 'extendedKeyUsage = serverAuth'
            echo 'subjectAltName = @alt_names'
            echo '[alt_names]'
            echo 'DNS.1 = sentra.com'
            echo 'DNS.2 = www.sentra.com'
            echo 'DNS.3 = api.sentra.com'
            echo 'DNS.4 = monitoring.sentra.com'
            echo 'DNS.5 = localhost'
            echo 'IP.1 = 127.0.0.1'
        )
    
    # Generate DH parameters
    openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048
    
    chmod 600 "$SSL_DIR"/*
    
    update_env_var "SSL_CERT_PATH" "/etc/nginx/certs/sentra.com.crt"
    update_env_var "SSL_KEY_PATH" "/etc/nginx/certs/sentra.com.key"
    update_env_var "SSL_DHPARAM_PATH" "/etc/nginx/certs/dhparam.pem"
fi

# Create Vault configuration
mkdir -p "$VAULT_CONFIG_DIR"
cat > "$VAULT_CONFIG_DIR/config.hcl" << EOF
ui = true
disable_mlock = true

storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = true
}

api_addr = "http://0.0.0.0:8200"
cluster_addr = "http://0.0.0.0:8201"
EOF

# Create secrets validation script
cat > "scripts/validate-secrets.sh" << 'EOF'
#!/bin/bash

# Validate all secrets are properly generated
set -euo pipefail

ENV_FILE=".env.production"
SECRETS_DIR="./secrets"

echo "🔍 Validating production secrets..."

# Check environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Environment file $ENV_FILE not found"
    exit 1
fi

# Check required secrets
required_secrets=(
    "JWT_SECRET"
    "ENCRYPTION_KEY"
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "RABBITMQ_PASSWORD"
    "GRAFANA_ADMIN_PASSWORD"
    "VAULT_TOKEN"
)

for secret in "${required_secrets[@]}"; do
    if ! grep -q "^${secret}=.*[^[:space:]]" "$ENV_FILE"; then
        echo "❌ Missing or empty secret: $secret"
        exit 1
    fi
    
    # Check if still using template values
    if grep -q "^${secret}=CHANGE_ME" "$ENV_FILE"; then
        echo "❌ Secret $secret still using template value"
        exit 1
    fi
done

# Check secret files
if [[ -d "$SECRETS_DIR" ]]; then
    for file in "$SECRETS_DIR"/*; do
        if [[ -f "$file" && ! -s "$file" ]]; then
            echo "❌ Empty secret file: $(basename "$file")"
            exit 1
        fi
    done
fi

echo "✅ All secrets validated successfully"
EOF

chmod +x "scripts/validate-secrets.sh"

# Create secret rotation script
cat > "scripts/rotate-secrets.sh" << 'EOF'
#!/bin/bash

# Rotate production secrets safely
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 SENTRA Secret Rotation${NC}"
echo "=========================="

if [[ "$#" -eq 0 ]]; then
    echo "Usage: $0 <secret_name> [secret_name2] ..."
    echo "Available secrets: jwt, database, redis, rabbitmq, vault, encryption"
    exit 1
fi

ENV_FILE=".env.production"
BACKUP_FILE=".env.production.backup.$(date +%Y%m%d_%H%M%S)"

# Backup current environment
cp "$ENV_FILE" "$BACKUP_FILE"
echo -e "${GREEN}📄 Created backup: $BACKUP_FILE${NC}"

for secret_type in "$@"; do
    case "$secret_type" in
        "jwt")
            new_secret=$(openssl rand -hex 64)
            sed -i.tmp "s/^JWT_SECRET=.*/JWT_SECRET=${new_secret}/" "$ENV_FILE"
            echo -e "${GREEN}✅ Rotated JWT_SECRET${NC}"
            ;;
        "database")
            new_secret=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
            sed -i.tmp "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${new_secret}/" "$ENV_FILE"
            echo "$new_secret" > "./secrets/postgres_password"
            echo -e "${GREEN}✅ Rotated POSTGRES_PASSWORD${NC}"
            ;;
        "redis")
            new_secret=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
            sed -i.tmp "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=${new_secret}/" "$ENV_FILE"
            echo "$new_secret" > "./secrets/redis_password"
            echo -e "${GREEN}✅ Rotated REDIS_PASSWORD${NC}"
            ;;
        "rabbitmq")
            new_secret=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
            sed -i.tmp "s/^RABBITMQ_PASSWORD=.*/RABBITMQ_PASSWORD=${new_secret}/" "$ENV_FILE"
            echo "$new_secret" > "./secrets/rabbitmq_password"
            echo -e "${GREEN}✅ Rotated RABBITMQ_PASSWORD${NC}"
            ;;
        "vault")
            new_secret=$(openssl rand -hex 32)
            sed -i.tmp "s/^VAULT_TOKEN=.*/VAULT_TOKEN=${new_secret}/" "$ENV_FILE"
            echo "$new_secret" > "./secrets/vault_token"
            echo -e "${GREEN}✅ Rotated VAULT_TOKEN${NC}"
            ;;
        "encryption")
            new_key=$(openssl rand -base64 44 | tr -d "=+/" | cut -c1-44)
            new_iv=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
            sed -i.tmp "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=${new_key}/" "$ENV_FILE"
            sed -i.tmp "s/^ENCRYPTION_IV=.*/ENCRYPTION_IV=${new_iv}/" "$ENV_FILE"
            echo "$new_key" > "./secrets/encryption_key"
            echo -e "${GREEN}✅ Rotated ENCRYPTION_KEY and ENCRYPTION_IV${NC}"
            ;;
        *)
            echo -e "${RED}❌ Unknown secret type: $secret_type${NC}"
            ;;
    esac
done

rm -f "$ENV_FILE.tmp"

echo -e "${YELLOW}⚠️  Remember to restart services to apply new secrets!${NC}"
echo -e "${YELLOW}   Run: docker-compose -f docker-compose.production.yml restart${NC}"
EOF

chmod +x "scripts/rotate-secrets.sh"

echo -e "${GREEN}✅ Production secrets setup completed!${NC}"
echo ""
echo "Generated files:"
echo "  - $ENV_FILE (environment variables)"
echo "  - $SECRETS_DIR/ (Docker secrets)"
echo "  - $SSL_DIR/ (SSL certificates)"
echo "  - scripts/validate-secrets.sh (validation)"
echo "  - scripts/rotate-secrets.sh (rotation)"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "1. Review and update $ENV_FILE with your specific values"
echo "2. Replace self-signed certificates with CA-signed certificates for production"
echo "3. Update external service credentials (AWS, GitHub, etc.)"
echo "4. Run: ./scripts/validate-secrets.sh"
echo "5. Start services: docker-compose -f docker-compose.production.yml up -d"
echo ""
echo -e "${RED}🔒 SECURITY REMINDER:${NC}"
echo "- Never commit .env.production to version control"
echo "- Regularly rotate secrets using ./scripts/rotate-secrets.sh"
echo "- Monitor access to secret files and directories"
echo "- Use a proper secrets management system in production"