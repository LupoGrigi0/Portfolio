# SmoothCurves.art Production Deployment - Master Checklist
**Version**: 1.0.0
**Created**: 2025-10-14
**Author**: Nova (Integration Specialist)
**Reviewer**: Coordination System Team

---

## 🎯 Quick Reference

**Total Estimated Time**: 4-6 hours
**Prerequisites**: Backend/frontend working locally, droplet access, DNS access
**Rollback Time**: <5 minutes if issues occur

**Key Contacts**:
- Local Machine Work: Nova/Lupo
- Droplet Work: Coordination system engineer or Lupo via SSH
- DNS Changes: Lupo (Dynadot account access)

---

## 📋 PHASE 0: PRE-FLIGHT SAFETY CHECKS

**Time**: 15 minutes | **Location**: Both local and droplet

### Local Machine Checks

Run from: `D:\Lupo\Source\Portfolio\worktrees\integration`

```powershell
# 1. Git status
git status
git branch --show-current
```
- [ ] On `feature/integration` branch
- [ ] Working directory clean or only expected modifications
- [ ] All work committed

```powershell
# 2. Local services running
# Backend health check
curl http://localhost:4000/api/health

# Frontend accessible
curl http://localhost:3000
```
- [ ] Backend responds with healthy status
- [ ] Frontend loads successfully
- [ ] Database initialized (no "Database not initialized" errors)

```powershell
# 3. Content directory exists
dir E:\mnt\lupoportfolio\content
```
- [ ] Content directory exists
- [ ] Contains branding/ and home/ folders
- [ ] Has art collection content

```powershell
# 4. Check Dockerfiles
type src\infrastructure\Dockerfile.backend | findstr ffmpeg
type src\infrastructure\Dockerfile.frontend
```
- [ ] Backend Dockerfile includes ffmpeg
- [ ] Both Dockerfiles exist and are valid

### Droplet Checks

```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# 1. Coordination system health
systemctl status mcp-coordination
curl https://smoothcurves.nexus/health
curl http://smoothcurves.nexus/openapi.json
```
- [ ] MCP coordination system running
- [ ] HTTPS health check returns 200 OK
- [ ] HTTP openapi.json accessible (port 80 not blocked)

```bash
# 2. Resource availability
free -h
df -h /mnt/lupoportfolio
netstat -tuln | grep -E ":(3000|3001|4000|4001|6379|6380)"
```
- [ ] RAM: ≥1GB available (of 2GB total)
- [ ] Disk: ≥20GB available on /mnt/lupoportfolio
- [ ] Ports 3000, 3001, 4000, 4001, 6379, 6380 are FREE (empty output)

```bash
# 3. Backup existing configs
sudo cp -r /etc/nginx/sites-enabled /etc/nginx/sites-enabled.backup.$(date +%Y%m%d_%H%M%S)
sudo cp -r /etc/letsencrypt /etc/letsencrypt.backup.$(date +%Y%m%d_%H%M%S)
ls -la /etc/nginx/sites-enabled.backup*
ls -la /etc/letsencrypt.backup*
```
- [ ] Nginx config backed up
- [ ] SSL certificates backed up
- [ ] Backup files exist and have timestamps

**🚨 CRITICAL**: All checks must pass before proceeding!

---

## 📝 PHASE 1: LOCAL CODE PREPARATION

**Time**: 30 minutes | **Location**: Local machine

### Step 1.1: Update Next.js Config for Production

**File**: `src/frontend/next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // ← ADD THIS: Enables Next.js standalone mode for Docker

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/api/media/**',
      },
      // ← ADD THIS: Production domain for image optimization
      {
        protocol: 'https',
        hostname: 'smoothcurves.art',
        port: '',
        pathname: '/api/media/**',
      },
    ],
    qualities: [75, 90, 100],
  },
};

export default nextConfig;
```

**Checklist**:
- [ ] Added `output: 'standalone'`
- [ ] Added `smoothcurves.art` to remotePatterns
- [ ] No TypeScript errors
- [ ] File saved

### Step 1.2: Create Production Docker Compose

**File**: `docker-compose.prod.yml` (create in repo root)

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: src/infrastructure/Dockerfile.frontend
      target: production
    container_name: portfolio-frontend-prod
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://smoothcurves.art/api
    depends_on:
      - backend
    networks:
      - portfolio-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  backend:
    build:
      context: .
      dockerfile: src/infrastructure/Dockerfile.backend
      target: production
    container_name: portfolio-backend-prod
    restart: unless-stopped
    ports:
      - "4000:4000"
    volumes:
      - /mnt/lupoportfolio/portfolio-prod/data:/app/data
      - /mnt/lupoportfolio/portfolio-prod/logs:/app/logs
      - /mnt/lupoportfolio/portfolio-prod/content:/app/content:ro
    environment:
      - NODE_ENV=production
      - PORT=4000
      - FRONTEND_URL=https://smoothcurves.art
      - DATABASE_PATH=/app/data/portfolio.sqlite
      - REDIS_URL=redis://redis:6379
      - CONTENT_PATH=/app/content
      - LOG_PATH=/app/logs
    depends_on:
      - redis
    networks:
      - portfolio-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    container_name: portfolio-redis-prod
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - /mnt/lupoportfolio/portfolio-prod/data/redis:/data
    command: redis-server --appendonly yes
    networks:
      - portfolio-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  portfolio-network:
    driver: bridge
```

**Checklist**:
- [ ] File created at repo root
- [ ] All volume paths use `/mnt/lupoportfolio/portfolio-prod/`
- [ ] Ports are 3000, 4000, 6379 (production)
- [ ] Environment variables reference `smoothcurves.art`

### Step 1.3: Create Dev Docker Compose

**File**: `docker-compose.dev.yml` (create in repo root)

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: src/infrastructure/Dockerfile.frontend
      target: production
    container_name: portfolio-frontend-dev
    restart: unless-stopped
    ports:
      - "3001:3000"  # External 3001 maps to internal 3000
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=https://dev.smoothcurves.art/api
    depends_on:
      - backend
    networks:
      - portfolio-dev-network

  backend:
    build:
      context: .
      dockerfile: src/infrastructure/Dockerfile.backend
      target: production
    container_name: portfolio-backend-dev
    restart: unless-stopped
    ports:
      - "4001:4000"  # External 4001 maps to internal 4000
    volumes:
      - /mnt/lupoportfolio/portfolio-dev/data:/app/data
      - /mnt/lupoportfolio/portfolio-dev/logs:/app/logs
      - /mnt/lupoportfolio/portfolio-dev/content:/app/content:ro
    environment:
      - NODE_ENV=development
      - PORT=4000
      - FRONTEND_URL=https://dev.smoothcurves.art
      - DATABASE_PATH=/app/data/portfolio.sqlite
      - REDIS_URL=redis://redis:6379
      - CONTENT_PATH=/app/content
      - LOG_PATH=/app/logs
    depends_on:
      - redis
    networks:
      - portfolio-dev-network

  redis:
    image: redis:7-alpine
    container_name: portfolio-redis-dev
    restart: unless-stopped
    ports:
      - "6380:6379"  # External 6380 maps to internal 6379
    volumes:
      - /mnt/lupoportfolio/portfolio-dev/data/redis:/data
    command: redis-server --appendonly yes
    networks:
      - portfolio-dev-network

networks:
  portfolio-dev-network:
    driver: bridge
```

**Checklist**:
- [ ] File created at repo root
- [ ] Ports are 3001, 4001, 6380 (dev - different from prod)
- [ ] Volume paths use `/mnt/lupoportfolio/portfolio-dev/`
- [ ] Environment references `dev.smoothcurves.art`

### Step 1.4: Create Deployment Scripts

**File**: `scripts/deploy-prod.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Deploying SmoothCurves.art to Production"
echo "=========================================="

cd /mnt/lupoportfolio/portfolio-prod

# Backup
echo "📦 Creating backup..."
docker tag portfolio-frontend-prod portfolio-frontend-prod-backup 2>/dev/null || true
docker tag portfolio-backend-prod portfolio-backend-prod-backup 2>/dev/null || true

# Pull and build
echo "🔄 Pulling latest changes..."
git pull origin main

echo "🔨 Building containers..."
docker compose -f docker-compose.prod.yml build

# Deploy
echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Health check
echo "🏥 Running health check..."
sleep 20
if curl --fail https://smoothcurves.art/api/health; then
    echo "✅ Deployment successful!"
    docker system prune -f
else
    echo "❌ Health check failed! Rolling back..."
    docker compose -f docker-compose.prod.yml down
    docker tag portfolio-frontend-prod-backup portfolio-frontend-prod 2>/dev/null || true
    docker tag portfolio-backend-prod-backup portfolio-backend-prod 2>/dev/null || true
    docker compose -f docker-compose.prod.yml up -d
    exit 1
fi
```

**Checklist**:
- [ ] File created at `scripts/deploy-prod.sh`
- [ ] Has health check with rollback logic
- [ ] References production paths

### Step 1.5: Commit Changes

```bash
cd D:\Lupo\Source\Portfolio\worktrees\integration

# Stage all changes
git add src/frontend/next.config.ts
git add docker-compose.prod.yml
git add docker-compose.dev.yml
git add scripts/deploy-prod.sh

# Commit
git commit -m "feat: Add production deployment configuration

- Enable Next.js standalone output mode for Docker
- Add production Docker Compose configuration
- Add dev environment Docker Compose (separate ports)
- Add deployment script with health check and rollback
- Configure remote image patterns for smoothcurves.art domain
- Backend includes ffmpeg for video processing

Addresses: Production deployment to smoothcurves.nexus droplet

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to integration branch
git push origin feature/integration
```

**Checklist**:
- [ ] All files staged
- [ ] Commit created with descriptive message
- [ ] Pushed to feature/integration branch
- [ ] No errors during push

---

## 🔀 PHASE 2: MERGE TO MAIN BRANCH

**Time**: 15 minutes | **Location**: Local machine

### Step 2.1: Merge Integration to Main

```bash
cd D:\Lupo\Source\Portfolio\worktrees\integration

# Ensure integration is clean
git status

# Switch to main worktree
cd D:\Lupo\Source\Portfolio\worktrees\main
# OR checkout main in integration worktree
git checkout main
git pull origin main

# Merge integration branch
git merge feature/integration

# Resolve any conflicts if they exist
# Then commit the merge

git push origin main
```

**Checklist**:
- [ ] Main branch updated from remote
- [ ] Integration branch merged into main
- [ ] No merge conflicts (or conflicts resolved)
- [ ] Merge pushed to origin/main

### Step 2.2: Verify Main Branch

```bash
# Check that all deployment files exist on main
git checkout main
ls docker-compose.prod.yml
ls docker-compose.dev.yml
ls scripts/deploy-prod.sh
```

**Checklist**:
- [ ] `docker-compose.prod.yml` exists on main
- [ ] `docker-compose.dev.yml` exists on main
- [ ] `scripts/deploy-prod.sh` exists on main
- [ ] `src/frontend/next.config.ts` has standalone output

---

## 🖥️ PHASE 3: DROPLET DIRECTORY PREPARATION

**Time**: 20 minutes | **Location**: Droplet (SSH)

```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP
```

### Step 3.1: Create Directory Structure

```bash
# Create production directories
sudo mkdir -p /mnt/lupoportfolio/portfolio-prod/data/redis
sudo mkdir -p /mnt/lupoportfolio/portfolio-prod/logs
sudo mkdir -p /mnt/lupoportfolio/portfolio-prod/content

# Create dev directories
sudo mkdir -p /mnt/lupoportfolio/portfolio-dev/data/redis
sudo mkdir -p /mnt/lupoportfolio/portfolio-dev/logs
sudo mkdir -p /mnt/lupoportfolio/portfolio-dev/content

# Create shared directories
sudo mkdir -p /mnt/lupoportfolio/backups
sudo mkdir -p /mnt/lupoportfolio/scripts

# Verify structure
ls -la /mnt/lupoportfolio/
```

**Checklist**:
- [ ] `/mnt/lupoportfolio/portfolio-prod/` directory exists
- [ ] `/mnt/lupoportfolio/portfolio-dev/` directory exists
- [ ] Subdirectories (data, logs, content) created for both
- [ ] `/mnt/lupoportfolio/backups/` exists
- [ ] `/mnt/lupoportfolio/scripts/` exists

### Step 3.2: Create Deployment User

```bash
# Create deployuser if doesn't exist
id deployuser || sudo useradd -m -s /bin/bash deployuser

# Add to docker group (will add docker in next phase)
# This will be done after Docker is installed

# Set ownership
sudo chown -R root:root /mnt/lupoportfolio
sudo chmod -R 755 /mnt/lupoportfolio
```

**Checklist**:
- [ ] deployuser account created
- [ ] Directories have correct permissions

### Step 3.3: Clone Repository (Production)

```bash
cd /mnt/lupoportfolio/portfolio-prod

# Clone from GitHub (replace with your actual repo URL)
sudo git clone https://github.com/YOURUSERNAME/portfolio.git .

# Checkout main branch
sudo git checkout main

# Verify files exist
ls docker-compose.prod.yml
ls docker-compose.dev.yml
```

**Checklist**:
- [ ] Repository cloned to `/mnt/lupoportfolio/portfolio-prod/`
- [ ] On main branch
- [ ] Docker compose files exist
- [ ] Source code (src/) directory exists

### Step 3.4: Clone Repository (Dev)

```bash
cd /mnt/lupoportfolio/portfolio-dev

# Clone from GitHub
sudo git clone https://github.com/YOURUSERNAME/portfolio.git .

# Checkout develop branch (or integration for testing)
sudo git checkout develop
# OR: sudo git checkout feature/integration

# Verify
ls docker-compose.dev.yml
```

**Checklist**:
- [ ] Repository cloned to `/mnt/lupoportfolio/portfolio-dev/`
- [ ] On develop or feature branch
- [ ] Docker compose files exist

---

## 🐳 PHASE 4: INSTALL DOCKER

**Time**: 20 minutes | **Location**: Droplet

### Step 4.1: Install Docker

```bash
# Update package index
sudo apt update

# Install Docker (lightweight Ubuntu package)
sudo apt install -y docker.io docker-compose

# Verify installation
docker --version
docker-compose --version

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Check status
sudo systemctl status docker
```

**Checklist**:
- [ ] Docker installed successfully
- [ ] docker-compose installed successfully
- [ ] Docker service running (active)
- [ ] Docker service enabled (starts on boot)

### Step 4.2: Configure Docker Permissions

```bash
# Add deployuser to docker group
sudo usermod -aG docker deployuser

# Verify group membership
groups deployuser
```

**Checklist**:
- [ ] deployuser added to docker group
- [ ] Groups output shows 'docker'

### Step 4.3: Verify Coordination System Still Running

```bash
# CRITICAL: Check coordination system wasn't affected
systemctl status mcp-coordination
curl https://smoothcurves.nexus/health
```

**Checklist**:
- [ ] MCP coordination system still active
- [ ] Health endpoint returns 200 OK
- [ ] No service disruption

---

## 🌐 PHASE 5: NGINX CONFIGURATION

**Time**: 30 minutes | **Location**: Droplet

### Step 5.1: Create Portfolio Nginx Config

```bash
# Create new config file (DO NOT modify existing smoothcurves-nexus config)
sudo nano /etc/nginx/sites-available/smoothcurves.art
```

**Paste this configuration**:

```nginx
# Portfolio domains - Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name smoothcurves.art www.smoothcurves.art smoothcurves.love www.smoothcurves.love dev.smoothcurves.art;
    return 301 https://$server_name$request_uri;
}

# Production - smoothcurves.art
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name smoothcurves.art www.smoothcurves.art;

    # SSL certificates (will be configured by Certbot in Phase 7)
    ssl_certificate /etc/letsencrypt/live/smoothcurves.art/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smoothcurves.art/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend - Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets with aggressive caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # Media files
    location ~* \.(jpg|jpeg|png|gif|webp|svg|mp4)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}

# Redirect smoothcurves.love to smoothcurves.art
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name smoothcurves.love www.smoothcurves.love;

    ssl_certificate /etc/letsencrypt/live/smoothcurves.love/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smoothcurves.love/privkey.pem;

    return 301 https://smoothcurves.art$request_uri;
}

# Dev environment - dev.smoothcurves.art
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dev.smoothcurves.art;

    ssl_certificate /etc/letsencrypt/live/dev.smoothcurves.art/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.smoothcurves.art/privkey.pem;

    # Frontend dev
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend dev API
    location /api {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Save and exit (Ctrl+X, Y, Enter)

**Checklist**:
- [ ] Config file created at `/etc/nginx/sites-available/smoothcurves.art`
- [ ] All server blocks included (production, love redirect, dev)
- [ ] Ports match docker-compose (3000, 4000, 3001, 4001)

### Step 5.2: Enable Configuration (TEMPORARILY COMMENT SSL)

Before enabling, we need to comment out SSL certificate lines since they don't exist yet:

```bash
# Edit the config to comment SSL lines temporarily
sudo nano /etc/nginx/sites-available/smoothcurves.art

# Comment out these lines in EACH server block (add # at start):
#    ssl_certificate /etc/letsencrypt/live/smoothcurves.art/fullchain.pem;
#    ssl_certificate_key /etc/letsencrypt/live/smoothcurves.art/privkey.pem;
# (Repeat for .love and dev.smoothcurves.art)

# Also change "listen 443 ssl http2" to "listen 443 http2" (remove 'ssl')
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/smoothcurves.art /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

**Checklist**:
- [ ] SSL lines commented out (temporarily)
- [ ] Config symlinked to sites-enabled
- [ ] `nginx -t` test PASSED
- [ ] Nginx reloaded without errors

### Step 5.3: Verify Coordination System Unaffected

```bash
# CRITICAL: Verify existing config still works
curl https://smoothcurves.nexus/health
curl http://smoothcurves.nexus/openapi.json

# Verify original config file unchanged
diff /etc/nginx/sites-enabled/smoothcurves-nexus /etc/nginx/sites-enabled/smoothcurves-nexus.backup.*
```

**Checklist**:
- [ ] Coordination system health check passes
- [ ] openapi.json still accessible on HTTP
- [ ] Original nginx config unchanged (diff shows no differences)

---

## 🌍 PHASE 6: DNS CONFIGURATION

**Time**: 15 minutes | **Location**: Dynadot web interface
**Person**: Lupo (requires Dynadot account access)

### Step 6.1: Get Droplet IP Address

```bash
# On droplet, get public IP
curl -4 icanhazip.com

# OR
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Write down the IP**: `___.___.___. ___`

### Step 6.2: Configure DNS Records at Dynadot

**For smoothcurves.art**:
1. Login to Dynadot: https://www.dynadot.com/
2. Navigate to: My Domains → smoothcurves.art → DNS Settings
3. Select: "Dynadot DNS" (not forwarding)
4. Add these A records:

| Type | Host | Value (IP Address) | TTL |
|------|------|-------------------|-----|
| A | @ | YOUR_DROPLET_IP | 300 |
| A | www | YOUR_DROPLET_IP | 300 |
| A | dev | YOUR_DROPLET_IP | 300 |

5. Click "Save DNS"

**For smoothcurves.love**:
1. Navigate to: My Domains → smoothcurves.love → DNS Settings
2. Add these A records:

| Type | Host | Value (IP Address) | TTL |
|------|------|-------------------|-----|
| A | @ | YOUR_DROPLET_IP | 300 |
| A | www | YOUR_DROPLET_IP | 300 |

3. Click "Save DNS"

### Step 6.3: Wait for Propagation

```bash
# Check DNS propagation (from local machine or droplet)
nslookup smoothcurves.art
nslookup www.smoothcurves.art
nslookup dev.smoothcurves.art
nslookup smoothcurves.love

# Should all return YOUR_DROPLET_IP
```

**Wait 5-15 minutes for DNS propagation**

**Checklist**:
- [ ] A records created for smoothcurves.art (@, www, dev)
- [ ] A records created for smoothcurves.love (@, www)
- [ ] All records point to correct droplet IP
- [ ] DNS propagation verified (nslookup returns correct IP)

---

## 🔐 PHASE 7: SSL CERTIFICATES

**Time**: 20 minutes | **Location**: Droplet

### Step 7.1: Install Certbot (if not already installed)

```bash
# Check if certbot exists
which certbot

# If not installed:
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

**Checklist**:
- [ ] Certbot installed
- [ ] python3-certbot-nginx plugin installed

### Step 7.2: Generate SSL Certificates

**IMPORTANT**: DNS must be fully propagated before running these commands!

```bash
# Generate certificate for smoothcurves.art
sudo certbot --nginx -d smoothcurves.art -d www.smoothcurves.art

# Generate certificate for smoothcurves.love
sudo certbot --nginx -d smoothcurves.love -d www.smoothcurves.love

# Generate certificate for dev subdomain
sudo certbot --nginx -d dev.smoothcurves.art
```

**During prompts**:
- Email: Enter a valid email for renewal notifications
- Terms of Service: Agree
- Share email: Your choice
- Redirect HTTP to HTTPS: Yes (Certbot will handle this)

**Checklist**:
- [ ] Certificate generated for smoothcurves.art (+ www)
- [ ] Certificate generated for smoothcurves.love (+ www)
- [ ] Certificate generated for dev.smoothcurves.art
- [ ] No errors during certificate generation

### Step 7.3: Verify Certificates

```bash
# List all certificates
sudo certbot certificates

# Should show:
# - smoothcurves.nexus (existing - coordination system)
# - smoothcurves.art
# - smoothcurves.love
# - dev.smoothcurves.art

# Test auto-renewal
sudo certbot renew --dry-run
```

**Checklist**:
- [ ] All 4 domains listed in `certbot certificates`
- [ ] All certificates valid (expiry date ~90 days from now)
- [ ] Dry-run renewal test PASSED

### Step 7.4: Verify Coordination System Still Works

```bash
# CRITICAL: Ensure coordination system wasn't affected
curl https://smoothcurves.nexus/health
curl http://smoothcurves.nexus/openapi.json

systemctl status mcp-coordination
```

**Checklist**:
- [ ] Coordination system health check PASSES
- [ ] openapi.json still accessible via HTTP (port 80)
- [ ] MCP service still running

### Step 7.5: Uncomment SSL Lines in Nginx Config

Now that certificates exist, we can restore the SSL configuration:

```bash
# Edit portfolio nginx config
sudo nano /etc/nginx/sites-available/smoothcurves.art

# Uncomment all SSL certificate lines:
#    ssl_certificate /etc/letsencrypt/live/...
#    ssl_certificate_key /etc/letsencrypt/live/...

# Change "listen 443 http2" back to "listen 443 ssl http2"

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

**Checklist**:
- [ ] All SSL certificate lines uncommented
- [ ] `listen 443 ssl http2` on all HTTPS server blocks
- [ ] `nginx -t` test PASSED
- [ ] Nginx reloaded successfully

---

## 🚀 PHASE 8: PRODUCTION DEPLOYMENT

**Time**: 30 minutes | **Location**: Droplet

### Step 8.1: Build Production Containers

```bash
cd /mnt/lupoportfolio/portfolio-prod

# Build all containers
sudo docker compose -f docker-compose.prod.yml build

# This will take 5-10 minutes (downloading dependencies, building Next.js, etc.)
```

**Checklist**:
- [ ] Build started without errors
- [ ] Frontend image built successfully
- [ ] Backend image built successfully
- [ ] Redis image pulled successfully

### Step 8.2: Start Production Containers

```bash
# Start all services
sudo docker compose -f docker-compose.prod.yml up -d

# Check status
sudo docker compose -f docker-compose.prod.yml ps

# Should show:
# portfolio-frontend-prod  running  0.0.0.0:3000->3000/tcp
# portfolio-backend-prod   running  0.0.0.0:4000->4000/tcp
# portfolio-redis-prod     running  0.0.0.0:6379->6379/tcp
```

**Checklist**:
- [ ] All containers started (exit code 0)
- [ ] `docker compose ps` shows all 3 containers as "running"
- [ ] No error messages in output

### Step 8.3: Check Logs

```bash
# View all logs
sudo docker compose -f docker-compose.prod.yml logs

# View specific service logs
sudo docker logs portfolio-frontend-prod
sudo docker logs portfolio-backend-prod
sudo docker logs portfolio-redis-prod

# Follow logs in real-time
sudo docker compose -f docker-compose.prod.yml logs -f
```

**Checklist**:
- [ ] Frontend started successfully (listening on port 3000)
- [ ] Backend started successfully (listening on port 4000)
- [ ] No critical errors in logs
- [ ] Database initialized successfully

### Step 8.4: Health Checks

```bash
# Wait 20 seconds for services to fully start
sleep 20

# Check backend health directly
curl http://localhost:4000/api/health

# Expected output: {"status":"healthy","timestamp":"...","uptime":...}

# Check frontend directly
curl -I http://localhost:3000

# Expected: HTTP/1.1 200 OK or 301/302 redirect
```

**Checklist**:
- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend responds (200, 301, or 302)
- [ ] No connection refused errors

### Step 8.5: Test via Nginx (HTTPS)

```bash
# Test production domain via HTTPS
curl https://smoothcurves.art/api/health

# Expected: {"status":"healthy",...}

# Test homepage
curl -I https://smoothcurves.art

# Expected: HTTP/2 200 OK

# Test .love redirect
curl -I https://smoothcurves.love

# Expected: HTTP/2 301 (redirect to smoothcurves.art)
```

**Checklist**:
- [ ] `https://smoothcurves.art/api/health` returns healthy status
- [ ] `https://smoothcurves.art` returns 200 OK
- [ ] `https://smoothcurves.love` redirects to .art (301)
- [ ] SSL certificate valid (no certificate warnings)

### Step 8.6: Verify Coordination System STILL Works

```bash
# CRITICAL: Final check that coordination system is unaffected
curl https://smoothcurves.nexus/health
curl http://smoothcurves.nexus/openapi.json
systemctl status mcp-coordination

# Check resource usage
free -h
docker stats --no-stream
```

**Checklist**:
- [ ] Coordination system health check PASSES
- [ ] MCP service running
- [ ] RAM usage <80% (should be ~1.2-1.4GB / 2GB)
- [ ] No OOM errors in `dmesg`

---

## 📦 PHASE 9: CONTENT DEPLOYMENT

**Time**: 20-60 minutes (depending on content size) | **Location**: Local machine

### Step 9.1: Create SSH Key for Content Sync

```bash
# Generate SSH key (if not already exists)
ssh-keygen -t ed25519 -f ~/.ssh/lupoportfolio_ed25519 -C "content-deploy"

# Copy public key to droplet
type ~/.ssh/lupoportfolio_ed25519.pub | ssh root@YOUR_DROPLET_IP "cat >> ~/.ssh/authorized_keys"

# Test SSH connection
ssh -i ~/.ssh/lupoportfolio_ed25519 root@YOUR_DROPLET_IP "echo SSH connection successful"
```

**Checklist**:
- [ ] SSH key generated
- [ ] Public key added to droplet
- [ ] SSH connection test successful

### Step 9.2: Create Content Sync Script

**File**: `scripts/sync-content-prod.sh` (create on local machine)

```bash
#!/bin/bash
set -euo pipefail

# Configuration
LOCAL_CONTENT="E:/mnt/lupoportfolio/content"
REMOTE_USER="root"
REMOTE_HOST="YOUR_DROPLET_IP"  # ← Replace with actual IP
REMOTE_PATH="/mnt/lupoportfolio/portfolio-prod/content"
SSH_KEY="$HOME/.ssh/lupoportfolio_ed25519"

echo "🚀 Syncing content to production..."

# Sync content
rsync -avz --progress --stats \
    --delete-after \
    --exclude='.thumbnails' \
    --exclude='.DS_Store' \
    --exclude='Thumbs.db' \
    --checksum \
    -e "ssh -i $SSH_KEY" \
    "$LOCAL_CONTENT/" \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

echo "✅ Content sync completed!"
```

Make executable:
```bash
chmod +x scripts/sync-content-prod.sh
```

**Checklist**:
- [ ] Script created
- [ ] REMOTE_HOST updated with actual droplet IP
- [ ] Script is executable

### Step 9.3: Sync Content

```bash
# Run from local machine
cd D:\Lupo\Source\Portfolio

# First sync (may take 10-20 minutes for initial upload)
./scripts/sync-content-prod.sh

# Or if using WSL/Git Bash:
bash scripts/sync-content-prod.sh
```

**Checklist**:
- [ ] Sync completed without errors
- [ ] File counts match (local vs remote)
- [ ] No permission denied errors

### Step 9.4: Verify Content on Droplet

```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# Check content structure
ls -la /mnt/lupoportfolio/portfolio-prod/content/
ls -la /mnt/lupoportfolio/portfolio-prod/content/branding/
ls -la /mnt/lupoportfolio/portfolio-prod/content/home/

# Count files
find /mnt/lupoportfolio/portfolio-prod/content -type f | wc -l
```

**Checklist**:
- [ ] Content directory populated
- [ ] branding/ and home/ directories exist
- [ ] File count matches expectations
- [ ] Permissions are readable by backend container

### Step 9.5: Test Backend Content API

```bash
# Test content collections endpoint
curl https://smoothcurves.art/api/content/collections

# Expected: JSON with collections (branding, home, etc.)

# Test specific collection
curl https://smoothcurves.art/api/content/collections/home

# Expected: JSON with items from home collection
```

**Checklist**:
- [ ] Collections endpoint returns data (not empty)
- [ ] No "Database not initialized" errors
- [ ] Content items have correct paths

---

## 🧪 PHASE 10: DEV ENVIRONMENT SETUP

**Time**: 20 minutes | **Location**: Droplet

### Step 10.1: Build and Start Dev Containers

```bash
cd /mnt/lupoportfolio/portfolio-dev

# Build dev containers
sudo docker compose -f docker-compose.dev.yml build

# Start dev containers
sudo docker compose -f docker-compose.dev.yml up -d

# Check status
sudo docker compose -f docker-compose.dev.yml ps
```

**Checklist**:
- [ ] Dev containers built successfully
- [ ] All 3 containers running (frontend-dev, backend-dev, redis-dev)
- [ ] Ports are 3001, 4001, 6380 (different from production)

### Step 10.2: Sync Dev Content

```bash
# From local machine
# Create dev content sync script (similar to prod but different paths)

# OR manually copy prod content to dev on droplet:
ssh root@YOUR_DROPLET_IP "cp -r /mnt/lupoportfolio/portfolio-prod/content/* /mnt/lupoportfolio/portfolio-dev/content/"
```

**Checklist**:
- [ ] Dev content directory populated
- [ ] Content matches production (or has test content)

### Step 10.3: Test Dev Environment

```bash
# Test dev environment via HTTPS
curl https://dev.smoothcurves.art/api/health

# Test dev homepage
curl -I https://dev.smoothcurves.art

# Test dev content
curl https://dev.smoothcurves.art/api/content/collections
```

**Checklist**:
- [ ] `https://dev.smoothcurves.art/api/health` returns healthy
- [ ] `https://dev.smoothcurves.art` returns 200 OK
- [ ] Dev environment accessible and working
- [ ] Dev uses different database than production

---

## 🔄 PHASE 11: CI/CD PIPELINE (GITHUB ACTIONS)

**Time**: 30 minutes | **Location**: Local machine + GitHub

### Step 11.1: Generate Deploy SSH Key

```bash
# On local machine
ssh-keygen -t ed25519 -f ~/.ssh/github-actions-portfolio -C "github-actions-deploy"

# Copy public key to droplet
type ~/.ssh/github-actions-portfolio.pub | ssh root@YOUR_DROPLET_IP "cat >> ~/.ssh/authorized_keys"

# Copy private key for GitHub Secret
type ~/.ssh/github-actions-portfolio
# Copy this entire output (including BEGIN and END lines)
```

**Checklist**:
- [ ] SSH key generated
- [ ] Public key added to droplet authorized_keys
- [ ] Private key copied to clipboard

### Step 11.2: Add GitHub Secrets

1. Navigate to GitHub repository
2. Go to: Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add these secrets:

| Name | Value |
|------|-------|
| DROPLET_IP | Your droplet IP address |
| DROPLET_USER | `root` (or `deployuser`) |
| SSH_PRIVATE_KEY | (Paste entire private key from previous step) |

**Checklist**:
- [ ] DROPLET_IP secret added
- [ ] DROPLET_USER secret added
- [ ] SSH_PRIVATE_KEY secret added

### Step 11.3: Create GitHub Actions Workflows

**File**: `.github/workflows/deploy-prod.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:  # Manual trigger

jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to Production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: ${{ secrets.DROPLET_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /mnt/lupoportfolio/portfolio-prod
            git pull origin main
            docker compose -f docker-compose.prod.yml build
            docker compose -f docker-compose.prod.yml up -d
            sleep 15
            curl --fail https://smoothcurves.art/api/health || exit 1
            docker system prune -f

      - name: Notify Success
        if: success()
        run: echo "✅ Production deployment successful"
```

**File**: `.github/workflows/deploy-dev.yml`

```yaml
name: Deploy to Dev

on:
  push:
    branches:
      - develop
      - feature/integration

jobs:
  deploy-dev:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to Dev Environment
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: ${{ secrets.DROPLET_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /mnt/lupoportfolio/portfolio-dev
            git fetch origin
            git checkout ${{ github.ref_name }}
            git pull origin ${{ github.ref_name }}
            docker compose -f docker-compose.dev.yml build
            docker compose -f docker-compose.dev.yml up -d
            sleep 15
            curl --fail https://dev.smoothcurves.art/api/health || exit 1
            docker system prune -f

      - name: Notify Success
        if: success()
        run: echo "✅ Dev deployment successful"
```

**Checklist**:
- [ ] `.github/workflows/deploy-prod.yml` created
- [ ] `.github/workflows/deploy-dev.yml` created
- [ ] Files committed to repository
- [ ] Files pushed to GitHub

### Step 11.4: Test GitHub Actions

```bash
# Make a small change to trigger workflow
git checkout main
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: Trigger production deployment"
git push origin main

# Watch GitHub Actions: https://github.com/YOUR_USERNAME/portfolio/actions
```

**Checklist**:
- [ ] GitHub Actions workflow triggered
- [ ] Workflow completes successfully
- [ ] Production site updated
- [ ] Health check passed

---

## 📊 PHASE 12: POST-DEPLOYMENT MONITORING

**Time**: 30 minutes + ongoing | **Location**: Both

### Step 12.1: Create Monitoring Scripts

**File**: `/mnt/lupoportfolio/scripts/health-check.sh` (on droplet)

```bash
#!/bin/bash

echo "=== Portfolio Health Check ==="
echo "Timestamp: $(date)"

# Production checks
echo -e "\n[Production]"
curl -s https://smoothcurves.art/api/health | jq . || echo "❌ Production FAILED"

# Dev checks
echo -e "\n[Dev]"
curl -s https://dev.smoothcurves.art/api/health | jq . || echo "❌ Dev FAILED"

# Coordination system check
echo -e "\n[Coordination System]"
curl -s https://smoothcurves.nexus/health | jq . || echo "❌ Coordination FAILED"

# Resource usage
echo -e "\n[Resources]"
free -h | awk 'NR==2{printf "RAM: %s/%s (%.0f%%)\n", $3, $2, $3/$2*100}'
df -h /mnt/lupoportfolio | awk 'NR==2{printf "Disk: %s/%s (%s used)\n", $3, $2, $5}'

# Docker status
echo -e "\n[Docker Containers]"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Make executable:
```bash
chmod +x /mnt/lupoportfolio/scripts/health-check.sh
```

**Checklist**:
- [ ] health-check.sh script created
- [ ] Script is executable
- [ ] Running script shows all services healthy

### Step 12.2: Setup Automated Backups

**File**: `/mnt/lupoportfolio/scripts/backup-portfolio.sh`

```bash
#!/bin/bash
BACKUP_DIR="/mnt/lupoportfolio/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Backup production database
echo "📦 Backing up database..."
cp /mnt/lupoportfolio/portfolio-prod/data/portfolio.sqlite "$BACKUP_DIR/" 2>/dev/null || echo "No DB found"

# Backup Redis data
echo "📦 Backing up Redis..."
tar czf "$BACKUP_DIR/redis-data.tar.gz" /mnt/lupoportfolio/portfolio-prod/data/redis/ 2>/dev/null

# Keep only last 7 days
find /mnt/lupoportfolio/backups/ -type d -mtime +7 -exec rm -rf {} + 2>/dev/null

echo "✅ Backup completed: $BACKUP_DIR"
```

Add to cron:
```bash
sudo crontab -e

# Add this line (runs daily at 3 AM):
0 3 * * * /mnt/lupoportfolio/scripts/backup-portfolio.sh >> /var/log/portfolio-backup.log 2>&1
```

**Checklist**:
- [ ] backup-portfolio.sh script created
- [ ] Cron job added
- [ ] Manual backup test successful

### Step 12.3: Resource Monitoring

```bash
# Create resource monitoring cron job
sudo crontab -e

# Add this line (runs every hour):
0 * * * * free -h | awk 'NR==2{printf "[%s] RAM: %s/%s (%.0f%%)\n", strftime("%Y-%m-%d %H:%M"), $3, $2, $3/$2*100}' >> /var/log/resource-monitor.log
```

**Checklist**:
- [ ] Resource monitoring cron job added
- [ ] Log file created at /var/log/resource-monitor.log

### Step 12.4: Final Verification Checklist

**Production Environment**:
- [ ] https://smoothcurves.art loads successfully
- [ ] https://smoothcurves.art/api/health returns healthy
- [ ] https://smoothcurves.art/api/content/collections returns data
- [ ] Images load from content directory
- [ ] SSL certificate valid (no warnings)
- [ ] HTTP redirects to HTTPS

**Dev Environment**:
- [ ] https://dev.smoothcurves.art loads successfully
- [ ] https://dev.smoothcurves.art/api/health returns healthy
- [ ] Dev uses separate database from production

**Domain Redirects**:
- [ ] https://smoothcurves.love redirects to smoothcurves.art
- [ ] www subdomains work correctly

**Coordination System**:
- [ ] https://smoothcurves.nexus/health still works
- [ ] http://smoothcurves.nexus/openapi.json accessible (HTTP port 80)
- [ ] MCP coordination system running and accessible

**Resources**:
- [ ] RAM usage <80%
- [ ] Disk usage <70%
- [ ] All Docker containers running
- [ ] No OOM errors in system logs

**Backups**:
- [ ] Automated backups configured
- [ ] Manual backup test successful
- [ ] Nginx configs backed up
- [ ] SSL certs backed up

---

## 🚨 EMERGENCY ROLLBACK PROCEDURES

### If Portfolio Breaks Coordination System

```bash
# IMMEDIATE ACTION: Stop all portfolio containers
cd /mnt/lupoportfolio/portfolio-prod
sudo docker compose -f docker-compose.prod.yml down

cd /mnt/lupoportfolio/portfolio-dev
sudo docker compose -f docker-compose.dev.yml down

# Restore nginx config
sudo rm /etc/nginx/sites-enabled/smoothcurves.art
sudo cp /etc/nginx/sites-enabled/smoothcurves-nexus.backup.* /etc/nginx/sites-enabled/smoothcurves-nexus
sudo systemctl reload nginx

# Verify coordination system recovered
curl https://smoothcurves.nexus/health
systemctl status mcp-coordination
```

### If Resource Exhaustion Occurs

```bash
# Stop dev environment (less critical)
cd /mnt/lupoportfolio/portfolio-dev
sudo docker compose -f docker-compose.dev.yml down

# Check resources
free -h
docker stats --no-stream

# If still problematic, stop production too
cd /mnt/lupoportfolio/portfolio-prod
sudo docker compose -f docker-compose.prod.yml down
```

### If Deployment Fails

```bash
# View logs
sudo docker compose -f docker-compose.prod.yml logs

# Restart specific service
sudo docker compose -f docker-compose.prod.yml restart backend

# Or restart all
sudo docker compose -f docker-compose.prod.yml down
sudo docker compose -f docker-compose.prod.yml up -d
```

---

## 📞 SUPPORT CONTACTS & RESOURCES

**Documentation**:
- Architecture: `Portfolio_PRODUCTION_DEPLOYMENT_ARCHITECTURE.md`
- Review: `PORTFOLIO_DEPLOYMENT_REVIEW.md`
- This Checklist: `DEPLOYMENT_MASTER_CHECKLIST.md`

**Key Commands**:
```bash
# View all running containers
docker ps

# View portfolio logs
docker compose -f /mnt/lupoportfolio/portfolio-prod/docker-compose.prod.yml logs -f

# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl reload nginx

# Check SSL certs
sudo certbot certificates

# Health check script
/mnt/lupoportfolio/scripts/health-check.sh
```

**Useful Logs**:
- Nginx: `/var/log/nginx/error.log`
- Docker: `docker compose logs`
- System: `/var/log/syslog`
- Resource monitoring: `/var/log/resource-monitor.log`

---

## ✅ DEPLOYMENT COMPLETE!

Once all phases are complete, you have:
- ✅ Production portfolio at https://smoothcurves.art
- ✅ Dev environment at https://dev.smoothcurves.art
- ✅ Automated deployments via GitHub Actions
- ✅ SSL certificates (auto-renewing)
- ✅ Content sync capability
- ✅ Monitoring and backups
- ✅ Coordination system unaffected and running

**Next Steps**:
1. Monitor resource usage for 48 hours
2. Test full deployment workflow (code change → GitHub → auto-deploy)
3. Create team documentation for dev workflow
4. Plan droplet resize if RAM usage consistently >80%

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-14
**Prepared by**: Nova (Integration & System Architecture Specialist)
**Approved by**: Coordination System Team

_Foundation Architecture - Building Something That Will Last Forever_ 🤖
