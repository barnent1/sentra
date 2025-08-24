# SENTRA Deployment & Infrastructure Architecture
## Strategic Engineering Neural Technology for Rapid Automation

**Version**: 1.0  
**Date**: 2024-08-24  
**Document Type**: Deployment & Infrastructure Specifications  
**Architect**: System Architect Agent

---

## Executive Summary

This document defines the complete deployment and infrastructure architecture for SENTRA's AI Code Engineering Platform. The infrastructure design emphasizes cost-effectiveness, scalability, security, and operational excellence while maintaining high availability and performance for multi-agent AI operations.

**Infrastructure Architecture Principles:**
- Cost-optimized single-server deployment with scaling options
- Containerized microservices with Docker and Docker Compose
- Infrastructure as Code (IaC) with automated provisioning
- GitOps deployment methodology with automated CI/CD
- Comprehensive monitoring and observability
- Disaster recovery and business continuity
- Security-first infrastructure design
- Environmental segregation (dev/staging/production)

---

## Infrastructure Overview

### 1. Deployment Architecture

```
SENTRA Infrastructure Architecture
├── Cloud Infrastructure (AWS Lightsail)
│   ├── Primary Server (Ubuntu 22.04 LTS)
│   │   ├── CPU: 4 vCPUs (Intel Xeon)
│   │   ├── RAM: 16 GB DDR4
│   │   ├── Storage: 320 GB NVMe SSD
│   │   ├── Bandwidth: 6 TB transfer/month
│   │   └── Cost: $84/month (cost-optimized)
│   ├── Backup Storage (S3-compatible)
│   │   ├── Daily automated backups
│   │   ├── Point-in-time recovery capability
│   │   ├── Cross-region replication
│   │   └── Lifecycle management policies
│   ├── Content Delivery Network (CloudFront)
│   │   ├── Global edge locations
│   │   ├── Static asset acceleration
│   │   ├── DDoS protection
│   │   └── SSL/TLS termination
│   └── DNS Management (Route 53)
│       ├── Domain management
│       ├── Health checks and failover
│       ├── Geographic routing
│       └── SSL certificate automation
├── Container Platform (Docker Ecosystem)
│   ├── Docker Engine (Latest stable)
│   ├── Docker Compose (Orchestration)
│   ├── Portainer (Web management interface)
│   ├── Watchtower (Automated updates)
│   └── Container Security (Falco + Trivy)
├── Service Mesh Architecture
│   ├── API Gateway (Nginx + Kong)
│   ├── Load Balancer (HAProxy)
│   ├── Service Discovery (Consul)
│   ├── Circuit Breaker (Hystrix)
│   └── Rate Limiting (Redis-based)
├── Data Infrastructure
│   ├── PostgreSQL 15 (Primary database)
│   ├── Redis 7 (Caching and queues)
│   ├── MinIO (S3-compatible object storage)
│   ├── Elasticsearch (Logging and search)
│   └── InfluxDB (Metrics and monitoring)
├── Monitoring & Observability
│   ├── Prometheus (Metrics collection)
│   ├── Grafana (Dashboards and visualization)
│   ├── Jaeger (Distributed tracing)
│   ├── ELK Stack (Centralized logging)
│   └── Uptime monitoring (StatusPage)
├── Security Infrastructure
│   ├── Fail2ban (Intrusion prevention)
│   ├── ClamAV (Antivirus scanning)
│   ├── OSSEC (Host intrusion detection)
│   ├── Vault (Secrets management)
│   └── SSL/TLS (Let's Encrypt automation)
└── Development Toolchain
    ├── Git repositories (GitLab CE)
    ├── CI/CD Pipeline (GitLab Runner)
    ├── Container Registry (GitLab Registry)
    ├── Artifact Storage (Nexus Repository)
    └── Testing Environment (Docker Compose)
```

### 2. Resource Allocation Strategy

```
Server Resource Distribution
├── System Resources (20% - 3.2 GB RAM, 0.8 vCPU)
│   ├── Ubuntu 22.04 LTS base system
│   ├── Docker Engine and runtime
│   ├── System monitoring agents
│   ├── Security services (fail2ban, OSSEC)
│   └── SSH and administrative services
├── Core Infrastructure (25% - 4 GB RAM, 1 vCPU)
│   ├── Nginx API Gateway (512 MB RAM)
│   ├── PostgreSQL Database (2 GB RAM)
│   ├── Redis Cache (1 GB RAM)
│   ├── Message Queue (512 MB RAM)
│   └── Service discovery and routing
├── Agent Platform (45% - 7.2 GB RAM, 1.8 vCPU)
│   ├── Agent Orchestrator (1 GB RAM)
│   ├── Context Engine (1.5 GB RAM)
│   ├── Quality Guardian (1 GB RAM)
│   ├── Timeline Intelligence (1 GB RAM)
│   ├── Agent Instances (2.7 GB RAM distributed)
│   └── Inter-agent communication
├── Monitoring & Logging (10% - 1.6 GB RAM, 0.4 vCPU)
│   ├── Prometheus (800 MB RAM)
│   ├── Grafana (400 MB RAM)
│   ├── Log aggregation (400 MB RAM)
│   └── Health checks and alerting
└── Buffer/Scaling (Reserved capacity for peak loads)
    ├── Dynamic resource allocation
    ├── Burst capacity for agent workloads
    ├── Temporary container scaling
    └── Emergency resource reserves
```

---

## Container Architecture

### 1. Docker Compose Infrastructure

```yaml
# docker-compose.production.yml
version: '3.8'

networks:
  sentra-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
  sentra-secure:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.21.0.0/16

volumes:
  postgres-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /opt/sentra/data/postgres
  redis-data:
    driver: local
  minio-data:
    driver: local
  grafana-data:
    driver: local
  prometheus-data:
    driver: local

services:
  # Reverse Proxy & API Gateway
  nginx-gateway:
    image: nginx:alpine
    container_name: sentra-gateway
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx:/etc/nginx/conf.d
      - ./ssl:/etc/nginx/ssl
      - /var/log/nginx:/var/log/nginx
    networks:
      - sentra-network
    environment:
      - NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx/templates
      - NGINX_ENVSUBST_TEMPLATE_SUFFIX=.template
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      - "com.sentra.service=gateway"
      - "com.sentra.environment=production"

  # Database Services
  postgres:
    image: postgres:15-alpine
    container_name: sentra-database
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: --encoding=UTF-8 --lc-collate=C --lc-ctype=C
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./config/postgres:/docker-entrypoint-initdb.d
      - ./backups/postgres:/backups
    networks:
      - sentra-secure
    ports:
      - "127.0.0.1:5432:5432"
    command: >
      postgres
      -c shared_preload_libraries=pg_stat_statements
      -c pg_stat_statements.track=all
      -c max_connections=200
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c work_mem=4MB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    labels:
      - "com.sentra.service=database"
      - "com.sentra.environment=production"

  redis:
    image: redis:7-alpine
    container_name: sentra-redis
    restart: unless-stopped
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 1gb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
      --save 60 10000
      --appendonly yes
      --appendfsync everysec
    volumes:
      - redis-data:/data
      - ./config/redis/redis.conf:/usr/local/etc/redis/redis.conf
    networks:
      - sentra-secure
    ports:
      - "127.0.0.1:6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    labels:
      - "com.sentra.service=cache"
      - "com.sentra.environment=production"

  # Core Application Services
  api-gateway:
    build: 
      context: ./services/api-gateway
      dockerfile: Dockerfile.production
    image: sentra/api-gateway:latest
    container_name: sentra-api-gateway
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      CLAUDE_CODE_API_KEY: ${CLAUDE_CODE_API_KEY}
    volumes:
      - ./logs/api-gateway:/app/logs
      - ./config/api-gateway:/app/config
    networks:
      - sentra-network
      - sentra-secure
    ports:
      - "127.0.0.1:3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    labels:
      - "com.sentra.service=api-gateway"
      - "com.sentra.environment=production"

  agent-orchestrator:
    build:
      context: ./services/agent-orchestrator
      dockerfile: Dockerfile.production
    image: sentra/agent-orchestrator:latest
    container_name: sentra-agent-orchestrator
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/1
      DOCKER_HOST: unix:///var/run/docker.sock
      MAX_CONCURRENT_AGENTS: 8
      AGENT_TIMEOUT: 3600000
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./logs/agent-orchestrator:/app/logs
      - ./config/agents:/app/config/agents
      - agent-workspace:/app/workspace
    networks:
      - sentra-secure
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    labels:
      - "com.sentra.service=agent-orchestrator"
      - "com.sentra.environment=production"

  context-engine:
    build:
      context: ./services/context-engine
      dockerfile: Dockerfile.production
    image: sentra/context-engine:latest
    container_name: sentra-context-engine
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/2
      ELASTICSEARCH_URL: http://elasticsearch:9200
      ENCRYPTION_KEY: ${CONTEXT_ENCRYPTION_KEY}
      MAX_CONTEXT_SIZE: 100000
      CONTEXT_RETENTION_DAYS: 90
    volumes:
      - ./logs/context-engine:/app/logs
      - context-storage:/app/contexts
    networks:
      - sentra-secure
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    labels:
      - "com.sentra.service=context-engine"
      - "com.sentra.environment=production"

  quality-guardian:
    build:
      context: ./services/quality-guardian
      dockerfile: Dockerfile.production
    image: sentra/quality-guardian:latest
    container_name: sentra-quality-guardian
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/3
      QUALITY_THRESHOLD: 0.85
      STRICT_MODE: true
      ENABLE_SECURITY_SCANNING: true
    volumes:
      - ./logs/quality-guardian:/app/logs
      - ./config/quality:/app/config/quality
    networks:
      - sentra-secure
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    labels:
      - "com.sentra.service=quality-guardian"
      - "com.sentra.environment=production"

  # Monitoring Services
  prometheus:
    image: prom/prometheus:latest
    container_name: sentra-prometheus
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    volumes:
      - ./config/prometheus:/etc/prometheus
      - prometheus-data:/prometheus
    networks:
      - sentra-network
      - sentra-secure
    ports:
      - "127.0.0.1:9090:9090"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      - "com.sentra.service=monitoring"
      - "com.sentra.environment=production"

  grafana:
    image: grafana/grafana:latest
    container_name: sentra-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: false
      GF_SECURITY_SECRET_KEY: ${GRAFANA_SECRET_KEY}
      GF_DATABASE_TYPE: postgres
      GF_DATABASE_HOST: postgres:5432
      GF_DATABASE_NAME: ${POSTGRES_DB}
      GF_DATABASE_USER: ${POSTGRES_USER}
      GF_DATABASE_PASSWORD: ${POSTGRES_PASSWORD}
      GF_DATABASE_SSL_MODE: disable
      GF_SESSION_PROVIDER: redis
      GF_SESSION_PROVIDER_CONFIG: addr=redis:6379,pool_size=100,db=4,password=${REDIS_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
      - ./config/grafana:/etc/grafana/provisioning
    networks:
      - sentra-network
      - sentra-secure
    ports:
      - "127.0.0.1:3001:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      prometheus:
        condition: service_healthy
    labels:
      - "com.sentra.service=monitoring"
      - "com.sentra.environment=production"

  # Log Management
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: sentra-elasticsearch
    restart: unless-stopped
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
      - xpack.security.enrollment.enabled=false
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - sentra-secure
    ports:
      - "127.0.0.1:9200:9200"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9200/_health"]
      interval: 30s
      timeout: 10s
      retries: 5
    labels:
      - "com.sentra.service=logging"
      - "com.sentra.environment=production"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: sentra-logstash
    restart: unless-stopped
    volumes:
      - ./config/logstash:/usr/share/logstash/pipeline
      - ./logs:/var/log/sentra
    networks:
      - sentra-secure
    environment:
      - "LS_JAVA_OPTS=-Xms256m -Xmx256m"
    depends_on:
      elasticsearch:
        condition: service_healthy
    labels:
      - "com.sentra.service=logging"
      - "com.sentra.environment=production"

  # Management Tools
  portainer:
    image: portainer/portainer-ce:latest
    container_name: sentra-portainer
    restart: unless-stopped
    command: -H unix:///var/run/docker.sock
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer-data:/data
    networks:
      - sentra-network
    ports:
      - "127.0.0.1:9000:9000"
    labels:
      - "com.sentra.service=management"
      - "com.sentra.environment=production"

  # Backup Service
  backup-service:
    build:
      context: ./services/backup
      dockerfile: Dockerfile
    image: sentra/backup-service:latest
    container_name: sentra-backup
    restart: unless-stopped
    environment:
      - BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
      - S3_BUCKET=${BACKUP_S3_BUCKET}
      - AWS_ACCESS_KEY_ID=${BACKUP_AWS_ACCESS_KEY}
      - AWS_SECRET_ACCESS_KEY=${BACKUP_AWS_SECRET_KEY}
      - ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY}
    volumes:
      - postgres-data:/backup/postgres:ro
      - redis-data:/backup/redis:ro
      - ./logs:/backup/logs:ro
      - ./backups:/backups
    networks:
      - sentra-secure
    depends_on:
      - postgres
      - redis
    labels:
      - "com.sentra.service=backup"
      - "com.sentra.environment=production"
```

### 2. Agent Container Templates

```dockerfile
# Base Agent Container
FROM node:18-alpine AS base

# Security: Create non-root user
RUN addgroup -g 1001 -S sentra && \
    adduser -S sentra -u 1001 -G sentra

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache curl git openssh-client && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Development Agent
FROM base AS development-agent

# Install development tools
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    docker-cli

# Copy development agent code
COPY src/agents/development ./src/
COPY config/agents/development ./config/

# Security configuration
USER sentra
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Environment variables
ENV NODE_ENV=production
ENV AGENT_TYPE=development
ENV MAX_CONCURRENT_TASKS=3
ENV QUALITY_THRESHOLD=0.85

CMD ["node", "src/development-agent.js"]

# QA Agent
FROM base AS qa-agent

# Install QA tools
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver

# Copy QA agent code
COPY src/agents/qa ./src/
COPY config/agents/qa ./config/

USER sentra
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENV NODE_ENV=production
ENV AGENT_TYPE=qa
ENV STRICT_MODE=true
ENV ZERO_TOLERANCE=true

CMD ["node", "src/qa-agent.js"]

# Project Management Agent
FROM base AS pm-agent

# Copy PM agent code
COPY src/agents/pm ./src/
COPY config/agents/pm ./config/

USER sentra
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENV NODE_ENV=production
ENV AGENT_TYPE=pm
ENV TIMELINE_LEARNING=true
ENV CLIENT_COMMUNICATION=true

CMD ["node", "src/pm-agent.js"]

# Multi-stage build for efficient agent creation
FROM base AS final-agent

ARG AGENT_TYPE
ARG AGENT_CONFIG

COPY src/agents/${AGENT_TYPE} ./src/
COPY config/agents/${AGENT_TYPE} ./config/

USER sentra
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENV NODE_ENV=production
ENV AGENT_TYPE=${AGENT_TYPE}

CMD ["node", "src/agent-server.js"]
```

---

## Infrastructure Provisioning

### 1. Terraform Configuration

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Domain name for SENTRA"
  type        = string
}

# Lightsail Instance
resource "aws_lightsail_instance" "sentra_server" {
  name              = "sentra-${var.environment}"
  availability_zone = "${var.aws_region}a"
  blueprint_id      = "ubuntu_22_04"
  bundle_id         = "xlarge_2_0"  # 4 vCPUs, 16 GB RAM, 320 GB SSD
  
  key_pair_name = aws_lightsail_key_pair.sentra_key.name
  
  user_data = templatefile("${path.module}/user-data.sh", {
    domain_name = var.domain_name
    environment = var.environment
  })

  tags = {
    Name        = "SENTRA-${var.environment}"
    Environment = var.environment
    Project     = "SENTRA"
  }
}

# Key pair for SSH access
resource "aws_lightsail_key_pair" "sentra_key" {
  name = "sentra-${var.environment}-key"
}

# Static IP
resource "aws_lightsail_static_ip" "sentra_ip" {
  name = "sentra-${var.environment}-ip"
}

resource "aws_lightsail_static_ip_attachment" "sentra_ip_attachment" {
  static_ip_name = aws_lightsail_static_ip.sentra_ip.name
  instance_name  = aws_lightsail_instance.sentra_server.name
}

# Firewall rules
resource "aws_lightsail_instance_public_ports" "sentra_ports" {
  instance_name = aws_lightsail_instance.sentra_server.name

  port_info {
    protocol  = "tcp"
    from_port = 22
    to_port   = 22
    cidrs     = ["0.0.0.0/0"]  # Restrict this in production
  }

  port_info {
    protocol  = "tcp"
    from_port = 80
    to_port   = 80
    cidrs     = ["0.0.0.0/0"]
  }

  port_info {
    protocol  = "tcp"
    from_port = 443
    to_port   = 443
    cidrs     = ["0.0.0.0/0"]
  }
}

# S3 bucket for backups
resource "aws_s3_bucket" "sentra_backups" {
  bucket = "sentra-${var.environment}-backups-${random_string.bucket_suffix.result}"
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_versioning" "sentra_backups_versioning" {
  bucket = aws_s3_bucket.sentra_backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "sentra_backups_encryption" {
  bucket = aws_s3_bucket.sentra_backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "sentra_backups_lifecycle" {
  bucket = aws_s3_bucket.sentra_backups.id

  rule {
    id     = "backup_lifecycle"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 60
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# Route 53 DNS
resource "aws_route53_zone" "sentra_zone" {
  name = var.domain_name
}

resource "aws_route53_record" "sentra_a" {
  zone_id = aws_route53_zone.sentra_zone.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_lightsail_static_ip.sentra_ip.ip_address]
}

resource "aws_route53_record" "sentra_www" {
  zone_id = aws_route53_zone.sentra_zone.zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.domain_name]
}

resource "aws_route53_record" "sentra_api" {
  zone_id = aws_route53_zone.sentra_zone.zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.domain_name]
}

# SSL Certificate
resource "aws_acm_certificate" "sentra_cert" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# IAM role for backup service
resource "aws_iam_role" "sentra_backup_role" {
  name = "sentra-backup-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "sentra_backup_policy" {
  name = "sentra-backup-policy"
  role = aws_iam_role.sentra_backup_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.sentra_backups.arn,
          "${aws_s3_bucket.sentra_backups.arn}/*"
        ]
      }
    ]
  })
}

# Outputs
output "server_ip" {
  value = aws_lightsail_static_ip.sentra_ip.ip_address
}

output "server_instance_name" {
  value = aws_lightsail_instance.sentra_server.name
}

output "backup_bucket" {
  value = aws_s3_bucket.sentra_backups.id
}

output "nameservers" {
  value = aws_route53_zone.sentra_zone.name_servers
}

output "ssh_key_name" {
  value = aws_lightsail_key_pair.sentra_key.name
}
```

### 2. Server Initialization Script

```bash
#!/bin/bash
# user-data.sh - Server initialization script

set -e

# Variables
DOMAIN_NAME="${domain_name}"
ENVIRONMENT="${environment}"
SENTRA_USER="sentra"

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y \
    curl \
    wget \
    git \
    htop \
    vim \
    ufw \
    fail2ban \
    unattended-upgrades \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Configure automatic security updates
echo 'Unattended-Upgrade::Automatic-Reboot "true";' >> /etc/apt/apt.conf.d/50unattended-upgrades
systemctl enable unattended-upgrades

# Create sentra user
adduser --disabled-password --gecos "" $SENTRA_USER
usermod -aG sudo $SENTRA_USER
mkdir -p /home/$SENTRA_USER/.ssh
chmod 700 /home/$SENTRA_USER/.ssh
chown $SENTRA_USER:$SENTRA_USER /home/$SENTRA_USER/.ssh

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Configure Docker
usermod -aG docker $SENTRA_USER
systemctl enable docker
systemctl start docker

# Install Docker Compose
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
curl -L "https://github.com/docker/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configure firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Create SENTRA directory structure
mkdir -p /opt/sentra/{config,data,logs,backups,ssl}
mkdir -p /opt/sentra/data/{postgres,redis,minio,grafana,prometheus}
mkdir -p /opt/sentra/logs/{nginx,api-gateway,agents,system}
mkdir -p /opt/sentra/config/{nginx,postgres,redis,grafana,prometheus,agents}

# Set permissions
chown -R $SENTRA_USER:$SENTRA_USER /opt/sentra
chmod -R 755 /opt/sentra

# Install monitoring tools
apt install -y htop iotop nethogs

# Configure log rotation
cat > /etc/logrotate.d/sentra << 'EOF'
/opt/sentra/logs/**/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 sentra sentra
    postrotate
        docker exec sentra-nginx nginx -s reload 2>/dev/null || true
    endscript
}
EOF

# Install SSL certificate tools
apt install -y certbot

# Create SSL certificate
certbot certonly --standalone -d $DOMAIN_NAME -d www.$DOMAIN_NAME -d api.$DOMAIN_NAME --agree-tos --register-unsafely-without-email --non-interactive

# Set up SSL renewal
(crontab -l 2>/dev/null; echo "0 2 * * * certbot renew --quiet --deploy-hook 'docker exec sentra-nginx nginx -s reload'") | crontab -

# Create system monitoring script
cat > /opt/sentra/scripts/system-monitor.sh << 'EOF'
#!/bin/bash
# System monitoring script

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/opt/sentra/logs/system/system-monitor.log"

# Check disk usage
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "[$TIMESTAMP] WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "[$TIMESTAMP] WARNING: Memory usage is ${MEMORY_USAGE}%" >> $LOG_FILE
fi

# Check Docker containers
UNHEALTHY_CONTAINERS=$(docker ps --filter health=unhealthy --format "table {{.Names}}" | tail -n +2)
if [ ! -z "$UNHEALTHY_CONTAINERS" ]; then
    echo "[$TIMESTAMP] WARNING: Unhealthy containers: $UNHEALTHY_CONTAINERS" >> $LOG_FILE
fi

# Check service status
SERVICES="docker nginx fail2ban"
for service in $SERVICES; do
    if ! systemctl is-active --quiet $service; then
        echo "[$TIMESTAMP] ERROR: Service $service is not running" >> $LOG_FILE
    fi
done
EOF

chmod +x /opt/sentra/scripts/system-monitor.sh

# Set up cron jobs
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/sentra/scripts/system-monitor.sh") | crontab -

# Create backup script
cat > /opt/sentra/scripts/backup.sh << 'EOF'
#!/bin/bash
# Automated backup script

BACKUP_DIR="/opt/sentra/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Database backup
docker exec sentra-database pg_dump -U sentra sentra | gzip > "$BACKUP_DIR/postgres_$TIMESTAMP.sql.gz"

# Redis backup
docker exec sentra-redis redis-cli --rdb /data/dump_$TIMESTAMP.rdb
docker cp sentra-redis:/data/dump_$TIMESTAMP.rdb "$BACKUP_DIR/"

# Configuration backup
tar -czf "$BACKUP_DIR/config_$TIMESTAMP.tar.gz" -C /opt/sentra config

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "Backup completed at $(date)"
EOF

chmod +x /opt/sentra/scripts/backup.sh

# Set up daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/sentra/scripts/backup.sh >> /opt/sentra/logs/system/backup.log 2>&1") | crontab -

# Install Node.js (for any local scripts)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Final system update
apt update && apt upgrade -y
apt autoremove -y
apt autoclean

# Create installation completion marker
touch /opt/sentra/.installation-complete
chown $SENTRA_USER:$SENTRA_USER /opt/sentra/.installation-complete

echo "SENTRA server initialization completed at $(date)" > /opt/sentra/logs/system/installation.log
```

---

## CI/CD Pipeline

### 1. GitLab CI/CD Configuration

```yaml
# .gitlab-ci.yml
stages:
  - test
  - security
  - build
  - deploy
  - monitor

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  REGISTRY_URL: $CI_REGISTRY
  IMAGE_TAG: $CI_COMMIT_SHORT_SHA

before_script:
  - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY

# Test Stage
unit-tests:
  stage: test
  image: node:18-alpine
  script:
    - npm ci
    - npm run test:unit
    - npm run test:coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 1 week

integration-tests:
  stage: test
  services:
    - postgres:15
    - redis:7
  variables:
    POSTGRES_DB: test_sentra
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_password
    REDIS_URL: redis://redis:6379
  script:
    - npm ci
    - npm run test:integration
  artifacts:
    reports:
      junit: test-results/integration-results.xml

e2e-tests:
  stage: test
  image: cypress/included:latest
  services:
    - name: sentra/test-environment:latest
      alias: sentra-app
  script:
    - cypress run --record false --config baseUrl=http://sentra-app:3000
  artifacts:
    reports:
      junit: cypress/results/results.xml
    paths:
      - cypress/screenshots/
      - cypress/videos/
    expire_in: 1 week
    when: always

# Security Stage
security-scan:
  stage: security
  image: securecodewarrior/docker-snyk:latest
  script:
    - snyk test --severity-threshold=high
    - snyk monitor
  allow_failure: false

container-scan:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy fs --exit-code 1 --severity HIGH,CRITICAL .
    - trivy config --exit-code 1 .

secrets-scan:
  stage: security
  image: trufflesecurity/trufflehog:latest
  script:
    - trufflehog git file://. --only-verified

# Build Stage
build-services:
  stage: build
  script:
    - |
      for service in api-gateway agent-orchestrator context-engine quality-guardian; do
        echo "Building $service..."
        docker build -t $REGISTRY_URL/sentra/$service:$IMAGE_TAG -f services/$service/Dockerfile.production services/$service/
        docker push $REGISTRY_URL/sentra/$service:$IMAGE_TAG
        docker tag $REGISTRY_URL/sentra/$service:$IMAGE_TAG $REGISTRY_URL/sentra/$service:latest
        docker push $REGISTRY_URL/sentra/$service:latest
      done

build-agents:
  stage: build
  script:
    - |
      for agent in development qa pm research ux devops security; do
        echo "Building $agent agent..."
        docker build -t $REGISTRY_URL/sentra/agent-$agent:$IMAGE_TAG \
          --build-arg AGENT_TYPE=$agent \
          -f agents/Dockerfile.production agents/
        docker push $REGISTRY_URL/sentra/agent-$agent:$IMAGE_TAG
        docker tag $REGISTRY_URL/sentra/agent-$agent:$IMAGE_TAG $REGISTRY_URL/sentra/agent-$agent:latest
        docker push $REGISTRY_URL/sentra/agent-$agent:latest
      done

# Deploy Stage
deploy-staging:
  stage: deploy
  environment:
    name: staging
    url: https://staging.sentra.dev
  script:
    - echo "Deploying to staging environment..."
    - scp -r docker-compose.staging.yml deploy-scripts/ $STAGING_USER@$STAGING_SERVER:/opt/sentra/
    - ssh $STAGING_USER@$STAGING_SERVER "cd /opt/sentra && ./deploy-scripts/deploy.sh staging $IMAGE_TAG"
  only:
    - develop

deploy-production:
  stage: deploy
  environment:
    name: production
    url: https://sentra.dev
  script:
    - echo "Deploying to production environment..."
    - scp -r docker-compose.production.yml deploy-scripts/ $PROD_USER@$PROD_SERVER:/opt/sentra/
    - ssh $PROD_USER@$PROD_SERVER "cd /opt/sentra && ./deploy-scripts/deploy.sh production $IMAGE_TAG"
  when: manual
  only:
    - main

# Monitor Stage
health-check:
  stage: monitor
  script:
    - |
      for endpoint in "https://sentra.dev/health" "https://api.sentra.dev/health"; do
        response=$(curl -s -o /dev/null -w "%{http_code}" $endpoint)
        if [ $response -ne 200 ]; then
          echo "Health check failed for $endpoint (HTTP $response)"
          exit 1
        fi
        echo "Health check passed for $endpoint"
      done
  only:
    - main

performance-test:
  stage: monitor
  image: loadimpact/k6:latest
  script:
    - k6 run --out influxdb=http://influxdb:8086/k6 tests/performance/load-test.js
  artifacts:
    reports:
      performance: performance-results.json
  only:
    - main
```

### 2. Deployment Scripts

```bash
#!/bin/bash
# deploy-scripts/deploy.sh

set -e

ENVIRONMENT=$1
IMAGE_TAG=$2
BACKUP_ENABLED=${3:-true}

if [ -z "$ENVIRONMENT" ] || [ -z "$IMAGE_TAG" ]; then
    echo "Usage: $0 <environment> <image_tag> [backup_enabled]"
    exit 1
fi

echo "Starting deployment to $ENVIRONMENT environment with image tag: $IMAGE_TAG"

# Pre-deployment checks
echo "Running pre-deployment checks..."
./deploy-scripts/pre-deployment-checks.sh $ENVIRONMENT

# Backup current state if in production
if [ "$ENVIRONMENT" = "production" ] && [ "$BACKUP_ENABLED" = "true" ]; then
    echo "Creating pre-deployment backup..."
    ./scripts/backup.sh pre-deployment-$(date +%Y%m%d_%H%M%S)
fi

# Update environment file
echo "Updating environment configuration..."
envsubst < .env.template > .env.$ENVIRONMENT

# Pull latest images
echo "Pulling latest container images..."
export IMAGE_TAG=$IMAGE_TAG
docker-compose -f docker-compose.$ENVIRONMENT.yml pull

# Perform rolling deployment
echo "Performing rolling deployment..."
./deploy-scripts/rolling-deploy.sh $ENVIRONMENT

# Run post-deployment tests
echo "Running post-deployment verification..."
./deploy-scripts/post-deployment-tests.sh $ENVIRONMENT

# Update monitoring and alerting
echo "Updating monitoring configuration..."
./deploy-scripts/update-monitoring.sh $ENVIRONMENT

echo "Deployment completed successfully!"
```

```bash
#!/bin/bash
# deploy-scripts/rolling-deploy.sh

ENVIRONMENT=$1
COMPOSE_FILE="docker-compose.$ENVIRONMENT.yml"

# Function to check service health
check_service_health() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $COMPOSE_FILE exec -T $service curl -f http://localhost:3000/health > /dev/null 2>&1; then
            echo "Service $service is healthy"
            return 0
        fi
        echo "Waiting for $service to be healthy... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    echo "Service $service failed health check"
    return 1
}

# Services to deploy in order
SERVICES=(
    "postgres"
    "redis"
    "api-gateway"
    "agent-orchestrator"
    "context-engine" 
    "quality-guardian"
    "nginx-gateway"
)

for service in "${SERVICES[@]}"; do
    echo "Deploying $service..."
    
    # Scale up new instance
    docker-compose -f $COMPOSE_FILE up -d --scale $service=2 $service
    
    # Wait for new instance to be healthy
    sleep 30
    if check_service_health $service; then
        # Scale down old instance
        docker-compose -f $COMPOSE_FILE up -d --scale $service=1 $service
        echo "$service deployed successfully"
    else
        echo "Failed to deploy $service, rolling back..."
        docker-compose -f $COMPOSE_FILE up -d --scale $service=1 $service
        exit 1
    fi
done

# Deploy monitoring services
echo "Deploying monitoring services..."
docker-compose -f $COMPOSE_FILE up -d prometheus grafana

echo "Rolling deployment completed successfully"
```

---

## Monitoring & Observability

### 1. Prometheus Configuration

```yaml
# config/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # System metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # Application metrics
  - job_name: 'sentra-api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: /metrics
    scrape_interval: 10s

  - job_name: 'sentra-agent-orchestrator'
    static_configs:
      - targets: ['agent-orchestrator:3001']
    metrics_path: /metrics

  - job_name: 'sentra-context-engine'
    static_configs:
      - targets: ['context-engine:3002']
    metrics_path: /metrics

  - job_name: 'sentra-quality-guardian'
    static_configs:
      - targets: ['quality-guardian:3003']
    metrics_path: /metrics

  # Database metrics
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Container metrics
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  # Nginx metrics
  - job_name: 'nginx-exporter'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

### 2. Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "id": null,
    "title": "SENTRA Platform Overview",
    "tags": ["sentra", "platform", "overview"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\"sentra-.*\"}",
            "legendFormat": "{{job}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {
                  "color": "red",
                  "value": 0
                },
                {
                  "color": "green",
                  "value": 1
                }
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Active Agents",
        "type": "graph",
        "targets": [
          {
            "expr": "sentra_active_agents_total",
            "legendFormat": "Active Agents"
          }
        ]
      },
      {
        "id": 3,
        "title": "Task Completion Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(sentra_tasks_completed_total[5m])",
            "legendFormat": "Tasks/sec"
          }
        ]
      },
      {
        "id": 4,
        "title": "Quality Gate Success Rate",
        "type": "gauge",
        "targets": [
          {
            "expr": "sentra_quality_gate_success_rate",
            "legendFormat": "Success Rate"
          }
        ]
      },
      {
        "id": 5,
        "title": "Context Preservation Health",
        "type": "graph",
        "targets": [
          {
            "expr": "sentra_context_rotation_success_rate",
            "legendFormat": "Context Rotation Success"
          }
        ]
      },
      {
        "id": 6,
        "title": "Resource Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total{container_label_com_sentra_service!=\"\"}[5m]) * 100",
            "legendFormat": "{{container_label_com_sentra_service}}"
          }
        ]
      }
    ]
  }
}
```

### 3. Health Check System

```typescript
// Health check service
class HealthCheckService {
  private checks: Map<string, HealthCheck> = new Map();
  
  constructor() {
    this.registerChecks();
  }
  
  private registerChecks(): void {
    // Database connectivity
    this.checks.set('database', {
      name: 'PostgreSQL Database',
      check: async () => {
        try {
          await this.database.query('SELECT 1');
          return { status: 'healthy', message: 'Database connection OK' };
        } catch (error) {
          return { status: 'unhealthy', message: `Database error: ${error.message}` };
        }
      },
      timeout: 5000,
      critical: true
    });
    
    // Redis connectivity
    this.checks.set('redis', {
      name: 'Redis Cache',
      check: async () => {
        try {
          await this.redis.ping();
          return { status: 'healthy', message: 'Redis connection OK' };
        } catch (error) {
          return { status: 'unhealthy', message: `Redis error: ${error.message}` };
        }
      },
      timeout: 3000,
      critical: true
    });
    
    // Agent orchestrator
    this.checks.set('orchestrator', {
      name: 'Agent Orchestrator',
      check: async () => {
        try {
          const activeAgents = await this.orchestrator.getActiveAgentCount();
          return { 
            status: 'healthy', 
            message: `${activeAgents} agents active`,
            metrics: { activeAgents }
          };
        } catch (error) {
          return { status: 'unhealthy', message: `Orchestrator error: ${error.message}` };
        }
      },
      timeout: 10000,
      critical: false
    });
    
    // Context engine
    this.checks.set('context', {
      name: 'Context Engine',
      check: async () => {
        try {
          const contextStats = await this.contextEngine.getStats();
          return {
            status: 'healthy',
            message: 'Context engine operational',
            metrics: contextStats
          };
        } catch (error) {
          return { status: 'unhealthy', message: `Context engine error: ${error.message}` };
        }
      },
      timeout: 5000,
      critical: false
    });
    
    // Disk space
    this.checks.set('disk', {
      name: 'Disk Space',
      check: async () => {
        try {
          const diskUsage = await this.getSystemDiskUsage();
          const usagePercentage = diskUsage.used / diskUsage.total * 100;
          
          if (usagePercentage > 90) {
            return { 
              status: 'unhealthy', 
              message: `Disk usage critical: ${usagePercentage.toFixed(1)}%`,
              metrics: diskUsage
            };
          } else if (usagePercentage > 80) {
            return { 
              status: 'warning', 
              message: `Disk usage high: ${usagePercentage.toFixed(1)}%`,
              metrics: diskUsage
            };
          }
          
          return { 
            status: 'healthy', 
            message: `Disk usage normal: ${usagePercentage.toFixed(1)}%`,
            metrics: diskUsage
          };
        } catch (error) {
          return { status: 'unhealthy', message: `Disk check error: ${error.message}` };
        }
      },
      timeout: 3000,
      critical: true
    });
    
    // Memory usage
    this.checks.set('memory', {
      name: 'Memory Usage',
      check: async () => {
        try {
          const memoryUsage = await this.getSystemMemoryUsage();
          const usagePercentage = memoryUsage.used / memoryUsage.total * 100;
          
          if (usagePercentage > 95) {
            return { 
              status: 'unhealthy', 
              message: `Memory usage critical: ${usagePercentage.toFixed(1)}%`,
              metrics: memoryUsage
            };
          } else if (usagePercentage > 85) {
            return { 
              status: 'warning', 
              message: `Memory usage high: ${usagePercentage.toFixed(1)}%`,
              metrics: memoryUsage
            };
          }
          
          return { 
            status: 'healthy', 
            message: `Memory usage normal: ${usagePercentage.toFixed(1)}%`,
            metrics: memoryUsage
          };
        } catch (error) {
          return { status: 'unhealthy', message: `Memory check error: ${error.message}` };
        }
      },
      timeout: 3000,
      critical: true
    });
  }
  
  async runHealthChecks(): Promise<HealthCheckReport> {
    const results = new Map<string, HealthCheckResult>();
    const startTime = Date.now();
    
    // Run all checks in parallel
    const checkPromises = Array.from(this.checks.entries()).map(async ([name, check]) => {
      try {
        const timeoutPromise = new Promise<HealthCheckResult>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
        });
        
        const checkPromise = check.check();
        const result = await Promise.race([checkPromise, timeoutPromise]);
        results.set(name, { ...result, duration: Date.now() - startTime });
      } catch (error) {
        results.set(name, {
          status: 'unhealthy',
          message: error.message,
          duration: Date.now() - startTime
        });
      }
    });
    
    await Promise.all(checkPromises);
    
    // Determine overall status
    const criticalFailures = Array.from(results.entries()).filter(
      ([name, result]) => this.checks.get(name)?.critical && result.status === 'unhealthy'
    );
    
    const anyFailures = Array.from(results.values()).some(
      result => result.status === 'unhealthy'
    );
    
    const anyWarnings = Array.from(results.values()).some(
      result => result.status === 'warning'
    );
    
    let overallStatus: HealthStatus;
    if (criticalFailures.length > 0) {
      overallStatus = 'unhealthy';
    } else if (anyFailures) {
      overallStatus = 'degraded';
    } else if (anyWarnings) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'healthy';
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      checks: Object.fromEntries(results),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}
```

---

## Disaster Recovery & Business Continuity

### 1. Backup Strategy

```bash
#!/bin/bash
# scripts/comprehensive-backup.sh

set -e

# Configuration
BACKUP_BASE_DIR="/opt/sentra/backups"
S3_BUCKET="${BACKUP_S3_BUCKET}"
RETENTION_DAYS=30
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Create timestamped backup directory
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$BACKUP_TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "Starting comprehensive backup at $(date)"

# Database backups
echo "Backing up PostgreSQL database..."
docker exec sentra-database pg_dump -U sentra sentra -F c | \
  gpg --symmetric --cipher-algo AES256 --passphrase "$ENCRYPTION_KEY" > \
  "$BACKUP_DIR/postgres.dump.gpg"

echo "Backing up Redis data..."
docker exec sentra-redis redis-cli BGSAVE
sleep 10  # Wait for background save to complete
docker cp sentra-redis:/data/dump.rdb "$BACKUP_DIR/"
gpg --symmetric --cipher-algo AES256 --passphrase "$ENCRYPTION_KEY" \
  "$BACKUP_DIR/dump.rdb"
rm "$BACKUP_DIR/dump.rdb"

# Configuration backups
echo "Backing up configuration files..."
tar -czf "$BACKUP_DIR/config.tar.gz" -C /opt/sentra config/
gpg --symmetric --cipher-algo AES256 --passphrase "$ENCRYPTION_KEY" \
  "$BACKUP_DIR/config.tar.gz"
rm "$BACKUP_DIR/config.tar.gz"

# Application data backups
echo "Backing up application data..."
tar -czf "$BACKUP_DIR/data.tar.gz" -C /opt/sentra data/ --exclude="data/postgres" --exclude="data/redis"
gpg --symmetric --cipher-algo AES256 --passphrase "$ENCRYPTION_KEY" \
  "$BACKUP_DIR/data.tar.gz"
rm "$BACKUP_DIR/data.tar.gz"

# Docker images backup
echo "Backing up Docker images..."
docker save $(docker images --format "table {{.Repository}}:{{.Tag}}" | grep sentra | tr '\n' ' ') | \
  gzip | gpg --symmetric --cipher-algo AES256 --passphrase "$ENCRYPTION_KEY" > \
  "$BACKUP_DIR/docker-images.tar.gz.gpg"

# SSL certificates backup
echo "Backing up SSL certificates..."
tar -czf "$BACKUP_DIR/ssl.tar.gz" /etc/letsencrypt/
gpg --symmetric --cipher-algo AES256 --passphrase "$ENCRYPTION_KEY" \
  "$BACKUP_DIR/ssl.tar.gz"
rm "$BACKUP_DIR/ssl.tar.gz"

# System configuration backup
echo "Backing up system configuration..."
tar -czf "$BACKUP_DIR/system.tar.gz" \
  /etc/nginx/ \
  /etc/fail2ban/ \
  /etc/cron.d/ \
  /etc/logrotate.d/ \
  /opt/sentra/scripts/
gpg --symmetric --cipher-algo AES256 --passphrase "$ENCRYPTION_KEY" \
  "$BACKUP_DIR/system.tar.gz"
rm "$BACKUP_DIR/system.tar.gz"

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "backup_timestamp": "$BACKUP_TIMESTAMP",
  "backup_type": "comprehensive",
  "server_hostname": "$(hostname)",
  "server_ip": "$(curl -s http://checkip.amazonaws.com/)",
  "docker_version": "$(docker --version)",
  "system_info": {
    "os": "$(lsb_release -d | cut -f2)",
    "kernel": "$(uname -r)",
    "uptime": "$(uptime -p)"
  },
  "backup_files": [
    "postgres.dump.gpg",
    "dump.rdb.gpg",
    "config.tar.gz.gpg",
    "data.tar.gz.gpg",
    "docker-images.tar.gz.gpg",
    "ssl.tar.gz.gpg",
    "system.tar.gz.gpg"
  ],
  "backup_size_mb": $(du -sm "$BACKUP_DIR" | cut -f1)
}
EOF

# Upload to S3 if configured
if [ ! -z "$S3_BUCKET" ]; then
  echo "Uploading backup to S3..."
  aws s3 sync "$BACKUP_DIR/" "s3://$S3_BUCKET/backups/$BACKUP_TIMESTAMP/" \
    --storage-class STANDARD_IA \
    --server-side-encryption AES256
  
  # Update latest backup pointer
  echo "$BACKUP_TIMESTAMP" | aws s3 cp - "s3://$S3_BUCKET/latest-backup.txt"
fi

# Cleanup old local backups
echo "Cleaning up old backups..."
find "$BACKUP_BASE_DIR" -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} + || true

# Generate backup report
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
BACKUP_DURATION=$(($(date +%s) - $(date -d "$BACKUP_TIMESTAMP" +%s)))

echo "Backup completed successfully!"
echo "Backup location: $BACKUP_DIR"
echo "Backup size: $BACKUP_SIZE"
echo "Backup duration: ${BACKUP_DURATION}s"

# Send backup notification (if configured)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"SENTRA backup completed successfully\n• Size: $BACKUP_SIZE\n• Duration: ${BACKUP_DURATION}s\n• Location: $BACKUP_TIMESTAMP\"}" \
    "$SLACK_WEBHOOK_URL"
fi
```

### 2. Disaster Recovery Procedures

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

set -e

BACKUP_TIMESTAMP="$1"
RECOVERY_TYPE="${2:-full}"  # full, partial, config-only
S3_BUCKET="${BACKUP_S3_BUCKET}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

if [ -z "$BACKUP_TIMESTAMP" ]; then
  echo "Usage: $0 <backup_timestamp> [recovery_type]"
  echo "Available recovery types: full, partial, config-only"
  exit 1
fi

echo "Starting disaster recovery from backup: $BACKUP_TIMESTAMP"
echo "Recovery type: $RECOVERY_TYPE"

# Create recovery directory
RECOVERY_DIR="/opt/sentra/recovery/$BACKUP_TIMESTAMP"
mkdir -p "$RECOVERY_DIR"

# Download backup from S3 if needed
if [ ! -d "/opt/sentra/backups/$BACKUP_TIMESTAMP" ] && [ ! -z "$S3_BUCKET" ]; then
  echo "Downloading backup from S3..."
  aws s3 sync "s3://$S3_BUCKET/backups/$BACKUP_TIMESTAMP/" "$RECOVERY_DIR/"
else
  echo "Using local backup..."
  cp -r "/opt/sentra/backups/$BACKUP_TIMESTAMP/"* "$RECOVERY_DIR/"
fi

# Verify backup integrity
echo "Verifying backup integrity..."
if [ ! -f "$RECOVERY_DIR/manifest.json" ]; then
  echo "ERROR: Backup manifest not found. Backup may be corrupted."
  exit 1
fi

EXPECTED_FILES=$(jq -r '.backup_files[]' "$RECOVERY_DIR/manifest.json")
for file in $EXPECTED_FILES; do
  if [ ! -f "$RECOVERY_DIR/$file" ]; then
    echo "ERROR: Missing backup file: $file"
    exit 1
  fi
done

echo "Backup integrity verified."

# Stop services for recovery
echo "Stopping SENTRA services..."
docker-compose -f /opt/sentra/docker-compose.production.yml down

case "$RECOVERY_TYPE" in
  "full")
    echo "Performing full system recovery..."
    
    # Decrypt and restore database
    echo "Restoring PostgreSQL database..."
    gpg --decrypt --passphrase "$ENCRYPTION_KEY" "$RECOVERY_DIR/postgres.dump.gpg" | \
      docker run --rm -i --network host -e PGPASSWORD=sentra postgres:15-alpine \
      pg_restore -h localhost -U sentra -d sentra -v --clean --if-exists
    
    # Decrypt and restore Redis
    echo "Restoring Redis data..."
    gpg --decrypt --passphrase "$ENCRYPTION_KEY" "$RECOVERY_DIR/dump.rdb.gpg" > \
      /opt/sentra/data/redis/dump.rdb
    
    # Restore configurations
    echo "Restoring configuration files..."
    gpg --decrypt --passphrase "$ENCRYPTION_KEY" "$RECOVERY_DIR/config.tar.gz.gpg" | \
      tar -xzf - -C /opt/sentra/
    
    # Restore application data
    echo "Restoring application data..."
    gpg --decrypt --passphrase "$ENCRYPTION_KEY" "$RECOVERY_DIR/data.tar.gz.gpg" | \
      tar -xzf - -C /opt/sentra/
    
    # Restore Docker images
    echo "Restoring Docker images..."
    gpg --decrypt --passphrase "$ENCRYPTION_KEY" "$RECOVERY_DIR/docker-images.tar.gz.gpg" | \
      gunzip | docker load
    
    # Restore SSL certificates
    echo "Restoring SSL certificates..."
    gpg --decrypt --passphrase "$ENCRYPTION_KEY" "$RECOVERY_DIR/ssl.tar.gz.gpg" | \
      tar -xzf - -C /
    
    # Restore system configuration
    echo "Restoring system configuration..."
    gpg --decrypt --passphrase "$ENCRYPTION_KEY" "$RECOVERY_DIR/system.tar.gz.gpg" | \
      tar -xzf - -C /
    ;;
    
  "partial")
    echo "Performing partial recovery (data and config only)..."
    
    # Restore database
    gpg --decrypt --passphrase "$ENCRYPTION_KEY" "$RECOVERY_DIR/postgres.dump.gpg" | \
      docker run --rm -i --network host -e PGPASSWORD=sentra postgres:15-alpine \
      pg_restore -h localhost -U sentra -d sentra -v --clean --if-exists
    
    # Restore configurations
    gpg --decrypt --passphrase "$ENCRYPTION_KEY" "$RECOVERY_DIR/config.tar.gz.gpg" | \
      tar -xzf - -C /opt/sentra/
    ;;
    
  "config-only")
    echo "Performing configuration-only recovery..."
    
    gpg --decrypt --passphrase "$ENCRYPTION_KEY" "$RECOVERY_DIR/config.tar.gz.gpg" | \
      tar -xzf - -C /opt/sentra/
    ;;
    
  *)
    echo "ERROR: Unknown recovery type: $RECOVERY_TYPE"
    exit 1
    ;;
esac

# Fix permissions
echo "Fixing file permissions..."
chown -R sentra:sentra /opt/sentra/
chmod -R 755 /opt/sentra/config/
chmod -R 750 /opt/sentra/data/
chmod -R 640 /opt/sentra/data/postgres/
chmod 600 /opt/sentra/ssl/*

# Restart services
echo "Starting SENTRA services..."
docker-compose -f /opt/sentra/docker-compose.production.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 30

# Verify recovery
echo "Verifying recovery..."
HEALTH_CHECK_URL="http://localhost:3000/health"
for i in {1..12}; do
  if curl -f "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    echo "Services are healthy!"
    break
  fi
  echo "Waiting for services to be ready... (attempt $i/12)"
  sleep 10
done

# Final verification
if curl -f "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
  echo "Disaster recovery completed successfully!"
  
  # Generate recovery report
  cat > "/opt/sentra/logs/system/recovery-report-$BACKUP_TIMESTAMP.log" << EOF
Disaster Recovery Report
========================
Recovery Date: $(date)
Backup Timestamp: $BACKUP_TIMESTAMP
Recovery Type: $RECOVERY_TYPE
Recovery Status: SUCCESS

Services Status:
$(docker-compose -f /opt/sentra/docker-compose.production.yml ps)

System Health:
$(curl -s "$HEALTH_CHECK_URL" | jq '.')
EOF

  # Send recovery notification
  if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"🚀 SENTRA disaster recovery completed successfully!\n• Backup: $BACKUP_TIMESTAMP\n• Recovery Type: $RECOVERY_TYPE\n• Services: All healthy\"}" \
      "$SLACK_WEBHOOK_URL"
  fi
else
  echo "ERROR: Services failed to start properly after recovery."
  exit 1
fi
```

---

## Conclusion

This comprehensive deployment and infrastructure architecture provides a complete foundation for SENTRA's production deployment. The architecture delivers:

1. **Cost-Effective Infrastructure**: Single AWS Lightsail server optimized for $84/month operational cost
2. **Containerized Architecture**: Docker-based microservices with comprehensive orchestration
3. **Infrastructure as Code**: Terraform provisioning with automated configuration
4. **CI/CD Pipeline**: Complete GitLab-based deployment automation with security scanning
5. **Monitoring & Observability**: Comprehensive monitoring with Prometheus, Grafana, and ELK stack
6. **Security Hardening**: Multi-layer security with fail2ban, SSL, and container security
7. **Disaster Recovery**: Automated backup and recovery procedures with encryption
8. **High Availability**: Health checks, rolling deployments, and service recovery

**Key Infrastructure Features:**
- Automated server provisioning and configuration
- Container security scanning and runtime protection
- Comprehensive backup strategy with S3 integration
- Real-time monitoring and alerting
- GitOps deployment with automated testing
- SSL certificate automation with Let's Encrypt
- Log aggregation and analysis
- Performance optimization and resource management

The infrastructure supports the complete SENTRA platform while maintaining operational excellence, security best practices, and cost optimization. The architecture is designed to scale horizontally as the platform grows while maintaining the same operational patterns and security standards.

**Deployment Timeline**: The infrastructure can be provisioned and deployed within 2-4 hours using the provided automation scripts, making it suitable for rapid deployment and testing cycles.

---

*This deployment architecture completes the comprehensive technical foundation for SENTRA, providing everything needed to build and operate the world's first AI Code Engineering Platform with multi-agent orchestration.*