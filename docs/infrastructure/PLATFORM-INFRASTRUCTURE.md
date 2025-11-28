# Quetrex Platform Infrastructure

**Version:** 1.0.0
**Last Updated:** 2025-11-28

---

## Overview

This document describes the infrastructure for the Quetrex platform itself (not user runners). The platform is intentionally minimal since users host their own runners.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               Hetzner Cloud - Quetrex Platform              │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                 CX32 VPS (~$9/mo)                       ││
│  │                 4 vCPU | 8GB RAM | 80GB SSD             ││
│  │                                                          ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       ││
│  │  │   Next.js   │ │ PostgreSQL  │ │    Redis    │       ││
│  │  │   Web App   │ │  Database   │ │    Cache    │       ││
│  │  │   Port 3000 │ │  Port 5432  │ │  Port 6379  │       ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘       ││
│  │                                                          ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │                    Nginx                            │││
│  │  │            Reverse Proxy + SSL                      │││
│  │  │              Port 80, 443                           │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Rsync (nightly)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           Hetzner Storage Box BX10 (~$3/mo)                 │
│                         1TB Storage                          │
│                                                             │
│  /backups/                                                  │
│  ├── postgres/          Daily database dumps                │
│  ├── redis/             RDB snapshots                       │
│  └── config/            Docker configs, .env                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Server Specifications

### Production Server

| Spec | Value |
|------|-------|
| Provider | Hetzner Cloud |
| Plan | CX32 |
| vCPU | 4 (shared) |
| RAM | 8GB |
| Storage | 80GB NVMe SSD |
| Traffic | 20TB included |
| Location | Nuremberg, Germany (nbg1) |
| Cost | ~$9/month |

### Backup Storage

| Spec | Value |
|------|-------|
| Provider | Hetzner Storage Box |
| Plan | BX10 |
| Storage | 1TB |
| Access | SFTP, Rsync, Samba |
| Cost | ~$3/month |

### Total Platform Cost

| Component | Monthly |
|-----------|---------|
| CX32 Server | $9 |
| Storage Box | $3 |
| **Total** | **$12/month** |

---

## Services

### Docker Compose Stack

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://quetrex:${DB_PASSWORD}@postgres:5432/quetrex
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - HETZNER_REFERRAL_URL=${HETZNER_REFERRAL_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=quetrex
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=quetrex

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - certbot_data:/var/www/certbot:ro
    depends_on:
      - web

volumes:
  postgres_data:
  redis_data:
  certbot_data:
```

### Resource Allocation

| Service | RAM | CPU | Notes |
|---------|-----|-----|-------|
| Next.js | 2GB | 1 core | Main application |
| PostgreSQL | 2GB | 1 core | User data, configs |
| Redis | 512MB | 0.25 core | Sessions, cache |
| Nginx | 256MB | 0.25 core | Reverse proxy |
| System | 1GB | 0.5 core | OS overhead |
| **Buffer** | **2GB** | **1 core** | **Headroom** |
| **Total** | **8GB** | **4 cores** | **CX32 capacity** |

---

## Database Schema (Key Tables)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  subscription_tier VARCHAR(50) DEFAULT 'individual',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  github_repo VARCHAR(255),
  github_owner VARCHAR(255),
  runner_status VARCHAR(50) DEFAULT 'disconnected',
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Runner Configs
CREATE TABLE runner_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hetzner_server_id VARCHAR(255),
  hetzner_server_ip VARCHAR(45),
  hetzner_server_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Billing History
CREATE TABLE billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255),
  amount_cents INTEGER,
  status VARCHAR(50),
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Backup Strategy

### Automated Backup Script

```bash
#!/bin/bash
# /opt/quetrex/scripts/backup.sh
# Runs via cron: 0 3 * * * /opt/quetrex/scripts/backup.sh

set -e

DATE=$(date +%Y%m%d)
BACKUP_DIR="/tmp/backup-${DATE}"
STORAGE_BOX="u123456@u123456.your-storagebox.de"

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup PostgreSQL
docker exec quetrex-postgres-1 pg_dump -U quetrex quetrex > ${BACKUP_DIR}/postgres.sql

# Backup Redis
docker exec quetrex-redis-1 redis-cli BGSAVE
sleep 5
docker cp quetrex-redis-1:/data/dump.rdb ${BACKUP_DIR}/redis.rdb

# Backup configs (excluding secrets in .env)
cp /opt/quetrex/docker-compose.yml ${BACKUP_DIR}/
cp /opt/quetrex/nginx.conf ${BACKUP_DIR}/

# Compress
tar -czf /tmp/backup-${DATE}.tar.gz -C /tmp backup-${DATE}

# Upload to Storage Box
rsync -avz /tmp/backup-${DATE}.tar.gz ${STORAGE_BOX}:backups/

# Cleanup local
rm -rf ${BACKUP_DIR} /tmp/backup-${DATE}.tar.gz

# Cleanup old backups (keep 30 days)
ssh ${STORAGE_BOX} 'find ~/backups -mtime +30 -delete'

echo "Backup completed: ${DATE}"
```

### Backup Schedule

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| PostgreSQL | Daily 3am | 30 days |
| Redis | Daily 3am | 7 days |
| Configs | Daily 3am | 30 days |
| Full server snapshot | Weekly | 4 weeks |

---

## Deployment

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t quetrex:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag quetrex:${{ github.sha }} ${{ secrets.DOCKER_REGISTRY }}/quetrex:${{ github.sha }}
          docker tag quetrex:${{ github.sha }} ${{ secrets.DOCKER_REGISTRY }}/quetrex:latest
          docker push ${{ secrets.DOCKER_REGISTRY }}/quetrex:${{ github.sha }}
          docker push ${{ secrets.DOCKER_REGISTRY }}/quetrex:latest

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/quetrex
            docker compose pull
            docker compose up -d
            docker system prune -f
```

---

## Monitoring

### Health Checks

```bash
# /opt/quetrex/scripts/healthcheck.sh
#!/bin/bash

# Check web app
curl -sf http://localhost:3000/api/health || exit 1

# Check PostgreSQL
docker exec quetrex-postgres-1 pg_isready -U quetrex || exit 1

# Check Redis
docker exec quetrex-redis-1 redis-cli ping | grep -q PONG || exit 1

echo "All services healthy"
```

### Uptime Monitoring

Use external service (e.g., UptimeRobot, Better Uptime) to monitor:
- `https://quetrex.app/api/health`
- Alert on 5+ minutes downtime

---

## Scaling Plan

| Users | Server | Action |
|-------|--------|--------|
| 0-500 | CX32 ($9) | Current setup |
| 500-2000 | CX42 ($18) | Upgrade in-place |
| 2000-5000 | Dedicated + replicas | Split web/db |
| 5000+ | Kubernetes cluster | Full orchestration |

---

## Security

### Firewall Rules

```bash
# UFW configuration
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### SSL/TLS

- Let's Encrypt via Certbot
- Auto-renewal via cron
- TLS 1.2+ only
- HSTS enabled

### Secrets Management

| Secret | Storage |
|--------|---------|
| Database password | .env file (not in git) |
| Stripe keys | .env file |
| JWT secret | .env file |
| SSH keys | GitHub Secrets + server |

---

## Disaster Recovery

### Recovery Time Objective (RTO)

| Scenario | RTO |
|----------|-----|
| Service restart | < 5 minutes |
| Server migration | < 1 hour |
| Full rebuild from backup | < 4 hours |

### Recovery Procedure

1. Provision new CX32 server
2. Run Ansible playbook to configure
3. Restore PostgreSQL from backup
4. Restore Redis from backup
5. Deploy latest Docker images
6. Update DNS to new IP
7. Verify health checks

---

*Document created by Glen Barnhardt with Claude Code assistance.*
