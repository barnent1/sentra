#!/bin/bash

# SENTRA SSL Certificate Automation with Let's Encrypt
# Handles initial certificate creation and automatic renewal

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$DEPLOYMENT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Load environment configuration
load_env() {
    local env_file="$1"
    if [[ -f "$env_file" ]]; then
        log "Loading environment from $env_file"
        set -a
        source "$env_file"
        set +a
    else
        error "Environment file $env_file not found"
        exit 1
    fi
}

# Check if domain is reachable
check_domain_accessibility() {
    local domain="$1"
    local port="${2:-80}"
    
    log "Checking domain accessibility: $domain:$port"
    
    if timeout 10 nc -z "$domain" "$port"; then
        success "Domain $domain is reachable on port $port"
        return 0
    else
        error "Domain $domain is not reachable on port $port"
        return 1
    fi
}

# Create initial nginx configuration without SSL
create_initial_nginx_config() {
    local domain="$1"
    local temp_config="/tmp/nginx-temp.conf"
    
    log "Creating temporary nginx configuration for certificate validation..."
    
    cat > "$temp_config" << EOF
server {
    listen 80;
    server_name $domain www.$domain api.$domain mobile.$domain;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Temporary health check
    location /health {
        return 200 "ssl setup in progress\n";
        add_header Content-Type text/plain;
    }
    
    # Redirect everything else to HTTPS (after certificates are obtained)
    location / {
        return 200 "SSL certificates being obtained. Please wait...\n";
        add_header Content-Type text/plain;
    }
}
EOF

    echo "$temp_config"
}

# Obtain SSL certificates using Certbot
obtain_certificates() {
    local domain="$1"
    local email="$2"
    local staging="${3:-false}"
    
    log "Obtaining SSL certificates for $domain..."
    
    # Prepare domains list
    local domains="$domain,www.$domain,api.$domain,mobile.$domain"
    
    # Build certbot command
    local certbot_cmd="certbot certonly --webroot -w /var/www/certbot --email $email --agree-tos --no-eff-email"
    
    # Add staging flag if requested
    if [[ "$staging" == "true" ]]; then
        certbot_cmd="$certbot_cmd --staging"
        warning "Using Let's Encrypt staging environment"
    fi
    
    # Add domains
    IFS=',' read -ra DOMAIN_LIST <<< "$domains"
    for domain_name in "${DOMAIN_LIST[@]}"; do
        certbot_cmd="$certbot_cmd -d $domain_name"
    done
    
    # Run certbot in Docker container
    local compose_file="$DEPLOYMENT_DIR/docker-compose.production.yml"
    
    # Ensure nginx is running for validation
    docker-compose -f "$compose_file" up -d nginx
    sleep 10
    
    # Run certbot
    if docker-compose -f "$compose_file" run --rm certbot $certbot_cmd; then
        success "SSL certificates obtained successfully"
        return 0
    else
        error "Failed to obtain SSL certificates"
        return 1
    fi
}

# Setup automatic certificate renewal
setup_certificate_renewal() {
    local domain="$1"
    
    log "Setting up automatic SSL certificate renewal..."
    
    # Create renewal script
    local renewal_script="/etc/cron.d/sentra-ssl-renewal"
    
    cat > "$renewal_script" << EOF
# SENTRA SSL Certificate Renewal
# Runs twice daily and renews certificates if needed

SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Run renewal twice daily
0 2,14 * * * root $SCRIPT_DIR/ssl-setup.sh renew $domain >> /var/log/sentra-ssl-renewal.log 2>&1
EOF

    # Create log rotation for renewal logs
    cat > "/etc/logrotate.d/sentra-ssl" << EOF
/var/log/sentra-ssl-renewal.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
}
EOF

    success "Automatic SSL certificate renewal configured"
}

# Renew SSL certificates
renew_certificates() {
    local domain="$1"
    local compose_file="$DEPLOYMENT_DIR/docker-compose.production.yml"
    
    log "Renewing SSL certificates for $domain..."
    
    # Run certbot renewal
    if docker-compose -f "$compose_file" run --rm certbot certbot renew --quiet; then
        log "Certificate renewal check completed"
        
        # Reload nginx if certificates were renewed
        if docker-compose -f "$compose_file" exec nginx nginx -t; then
            docker-compose -f "$compose_file" exec nginx nginx -s reload
            success "Nginx reloaded with renewed certificates"
        else
            error "Nginx configuration test failed"
            return 1
        fi
        
        return 0
    else
        error "Certificate renewal failed"
        return 1
    fi
}

# Validate SSL certificates
validate_certificates() {
    local domain="$1"
    
    log "Validating SSL certificates for $domain..."
    
    local domains=("$domain" "www.$domain" "api.$domain" "mobile.$domain")
    local validation_failed=0
    
    for check_domain in "${domains[@]}"; do
        log "Checking SSL certificate for $check_domain..."
        
        # Check certificate expiry
        local cert_info
        if cert_info=$(echo | openssl s_client -servername "$check_domain" -connect "$check_domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
            echo "$cert_info"
            
            # Check if certificate expires within 30 days
            local expiry_date
            expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
            local expiry_timestamp
            expiry_timestamp=$(date -d "$expiry_date" +%s)
            local current_timestamp
            current_timestamp=$(date +%s)
            local days_until_expiry
            days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [[ $days_until_expiry -lt 30 ]]; then
                warning "Certificate for $check_domain expires in $days_until_expiry days"
            else
                success "Certificate for $check_domain is valid (expires in $days_until_expiry days)"
            fi
        else
            error "Failed to retrieve certificate for $check_domain"
            validation_failed=1
        fi
    done
    
    return $validation_failed
}

# Create SSL-enabled nginx configuration
create_ssl_nginx_config() {
    local domain="$1"
    
    log "Creating SSL-enabled nginx configuration..."
    
    # Use the main nginx configuration which includes SSL settings
    local ssl_config="$DEPLOYMENT_DIR/nginx/sites/sentra.conf"
    
    # Replace domain placeholder
    sed "s/\${DOMAIN}/$domain/g" "$ssl_config" > "/tmp/sentra-ssl.conf"
    
    # Copy to nginx configuration
    local compose_file="$DEPLOYMENT_DIR/docker-compose.production.yml"
    docker-compose -f "$compose_file" exec nginx cp /tmp/sentra-ssl.conf /etc/nginx/sites-enabled/sentra.conf
    
    # Test nginx configuration
    if docker-compose -f "$compose_file" exec nginx nginx -t; then
        # Reload nginx with new configuration
        docker-compose -f "$compose_file" exec nginx nginx -s reload
        success "SSL-enabled nginx configuration activated"
    else
        error "SSL nginx configuration test failed"
        return 1
    fi
}

# Full SSL setup process
full_ssl_setup() {
    local domain="$1"
    local email="$2"
    local staging="${3:-false}"
    
    log "Starting full SSL setup for $domain..."
    
    # Step 1: Check domain accessibility
    if ! check_domain_accessibility "$domain" 80; then
        error "Domain $domain is not accessible. Please ensure:"
        echo "  1. DNS records point to your server"
        echo "  2. Port 80 is open and accessible"
        echo "  3. No other services are blocking port 80"
        exit 1
    fi
    
    # Step 2: Create initial nginx config (HTTP only)
    local temp_config
    temp_config=$(create_initial_nginx_config "$domain")
    
    # Step 3: Start nginx for certificate validation
    local compose_file="$DEPLOYMENT_DIR/docker-compose.production.yml"
    docker-compose -f "$compose_file" up -d nginx
    
    # Wait for nginx to be ready
    sleep 10
    
    # Step 4: Obtain certificates
    if ! obtain_certificates "$domain" "$email" "$staging"; then
        error "Certificate obtaining failed"
        exit 1
    fi
    
    # Step 5: Create SSL-enabled configuration
    create_ssl_nginx_config "$domain"
    
    # Step 6: Validate certificates
    if validate_certificates "$domain"; then
        success "SSL certificates are working correctly"
    else
        warning "SSL certificate validation had some issues"
    fi
    
    # Step 7: Setup automatic renewal
    setup_certificate_renewal "$domain"
    
    success "Full SSL setup completed for $domain"
    
    log "SSL endpoints available:"
    echo "  https://$domain"
    echo "  https://www.$domain" 
    echo "  https://api.$domain"
    echo "  https://mobile.$domain"
}

# Check SSL certificate status
check_ssl_status() {
    local domain="$1"
    
    log "Checking SSL certificate status for $domain..."
    
    local cert_dir="/etc/letsencrypt/live/$domain"
    
    if [[ -d "$cert_dir" ]]; then
        success "SSL certificates found for $domain"
        
        # Show certificate details
        local cert_file="$cert_dir/fullchain.pem"
        if [[ -f "$cert_file" ]]; then
            local cert_info
            cert_info=$(openssl x509 -in "$cert_file" -noout -subject -issuer -dates 2>/dev/null)
            echo "$cert_info"
            
            # Calculate days until expiry
            local expiry_date
            expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
            local expiry_timestamp
            expiry_timestamp=$(date -d "$expiry_date" +%s)
            local current_timestamp
            current_timestamp=$(date +%s)
            local days_until_expiry
            days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [[ $days_until_expiry -gt 0 ]]; then
                echo "Days until expiry: $days_until_expiry"
            else
                error "Certificate has expired!"
            fi
        fi
    else
        warning "No SSL certificates found for $domain"
        return 1
    fi
}

# Main function
main() {
    local command="${1:-help}"
    local domain="${2:-}"
    local email="${3:-}"
    local staging="${4:-false}"
    
    case "$command" in
        "setup")
            if [[ -z "$domain" || -z "$email" ]]; then
                error "Usage: $0 setup <domain> <email> [staging]"
                exit 1
            fi
            
            # Load production environment
            load_env "$DEPLOYMENT_DIR/env/.env.production"
            full_ssl_setup "$domain" "$email" "$staging"
            ;;
        "renew")
            if [[ -z "$domain" ]]; then
                error "Usage: $0 renew <domain>"
                exit 1
            fi
            renew_certificates "$domain"
            ;;
        "status")
            if [[ -z "$domain" ]]; then
                error "Usage: $0 status <domain>"
                exit 1
            fi
            check_ssl_status "$domain"
            ;;
        "validate")
            if [[ -z "$domain" ]]; then
                error "Usage: $0 validate <domain>"
                exit 1
            fi
            validate_certificates "$domain"
            ;;
        "help")
            echo "SENTRA SSL Certificate Management"
            echo ""
            echo "Usage: $0 <command> <domain> [email] [staging]"
            echo ""
            echo "Commands:"
            echo "  setup <domain> <email> [staging]  - Full SSL setup with Let's Encrypt"
            echo "  renew <domain>                     - Renew SSL certificates"
            echo "  status <domain>                    - Check SSL certificate status"
            echo "  validate <domain>                  - Validate SSL certificates"
            echo "  help                               - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 setup sentra.example.com admin@sentra.example.com"
            echo "  $0 setup sentra.example.com admin@sentra.example.com true  # staging"
            echo "  $0 renew sentra.example.com"
            echo "  $0 status sentra.example.com"
            echo ""
            echo "Notes:"
            echo "  - Domain must be accessible on port 80 before running setup"
            echo "  - Use staging=true for testing to avoid rate limits"
            echo "  - Automatic renewal is configured during setup"
            ;;
        *)
            error "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi