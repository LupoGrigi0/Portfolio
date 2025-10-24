# Infrastructure Configuration

This directory contains all infrastructure configuration files for deploying the SmoothCurves.art portfolio.

## Files

### Docker Configuration

- **`Dockerfile.backend`** - Multi-stage Docker build for Express.js backend
  - Maintains dev directory structure for path compatibility
  - Includes schema.sql, logger.js, and site-config files
  - Runs as non-root user (uid 1001)

- **`Dockerfile.frontend`** - Multi-stage Docker build for Next.js frontend
  - Accepts `NEXT_PUBLIC_API_URL` as build argument (critical!)
  - Creates standalone production build
  - Runs as non-root user (nextjs:nodejs)

### Nginx Configuration

- **`nginx-smoothcurves.art.conf`** - Nginx reverse proxy configuration
  - Routes portfolio domains to Docker containers
  - Production: smoothcurves.art → ports 3000 (frontend) + 4000 (backend)
  - Dev: dev.smoothcurves.art → ports 3001 + 4001
  - Redirect: smoothcurves.love → smoothcurves.art
  - SSL/TLS with Let's Encrypt certificates
  - WebSocket support for real-time features
  - Security headers (HSTS, X-Frame-Options, etc.)

**Installation:**
```bash
sudo cp src/infrastructure/nginx-smoothcurves.art.conf /etc/nginx/sites-available/smoothcurves.art
sudo ln -sf /etc/nginx/sites-available/smoothcurves.art /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

- **`nginx-smoothcurves-nexus.conf`** - MCP Coordination System nginx configuration
  - Routes MCP coordination endpoints (separate system/repository)
  - Production: smoothcurves.nexus/mcp → port 3444
  - Dev: smoothcurves.nexus/mcp/dev → port 3446
  - OAuth 2.1 endpoints: /authorize, /token, /register
  - Privacy policy: /privacy-policy → static HTML file
  - Web UI dashboard: /web-ui/ → static files
  - Health check: /health
  - openapi.json served on HTTP for MCP discovery

**Installation:**
```bash
sudo cp src/infrastructure/nginx-smoothcurves-nexus.conf /etc/nginx/sites-available/smoothcurves-nexus
sudo ln -sf /etc/nginx/sites-available/smoothcurves-nexus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Note:** MCP Coordination System lives in separate repository at `/mnt/coordinaton_mcp_data/production`

## Docker Compose Files (Project Root)

- **`docker-compose.prod.yml`** - Production deployment
  - Passes `NEXT_PUBLIC_API_URL` as build argument
  - Volume mounts for content, database, logs
  - Auto-restart enabled
  - JSON logging with rotation

- **`docker-compose.dev.yml`** - Development environment
  - Hot-reload enabled
  - Ports: 3001 (frontend dev), 4001 (backend dev)

## Deployment Scripts (Project Root)

Located in `/scripts/`:
- `deploy-backend.sh` - Deploy backend only (~18 sec)
- `deploy-frontend.sh` - Deploy frontend only (~1-2 min)
- `deploy-all.sh` - Deploy both services with clean restart
- `status.sh` - Check health of all services

## Critical Configuration Notes

### NEXT_PUBLIC_* Environment Variables

**IMPORTANT:** Next.js `NEXT_PUBLIC_*` variables are **build-time constants**, not runtime configuration!

They must be:
1. Passed as Docker build arguments in `docker-compose.yml`
2. Accepted as `ARG` in the Dockerfile
3. Set as `ENV` before `npm run build`

**Wrong (runtime only):**
```yaml
frontend:
  environment:
    - NEXT_PUBLIC_API_URL=https://smoothcurves.art
```

**Correct (build-time):**
```yaml
frontend:
  build:
    args:
      NEXT_PUBLIC_API_URL: https://smoothcurves.art
  environment:
    - NEXT_PUBLIC_API_URL=https://smoothcurves.art  # Also set for clarity
```

### Volume Mounts

Content updates are **instant** (no rebuild required):
- `/mnt/lupoportfolio/content` → Backend serves files directly
- Add/remove files → Backend sees changes immediately

Code updates require rebuild:
- Backend: ~18 seconds
- Frontend: ~1-2 minutes

### Port Mapping

| Service | Environment | Ports | SSL |
|---------|-------------|-------|-----|
| Portfolio Frontend | Production | 3000 | Via Nginx |
| Portfolio Backend | Production | 4000 | Via Nginx |
| Portfolio Frontend | Dev | 3001 | Via Nginx |
| Portfolio Backend | Dev | 4001 | Via Nginx |
| MCP Coordination | Production | 3444-3449 | Via Nginx |

Nginx listens on 80 (HTTP) and 443 (HTTPS), proxying to appropriate localhost ports.

## SSL/TLS Certificates

Managed by Certbot (Let's Encrypt):
- `smoothcurves.art` + `www.smoothcurves.art`
- `smoothcurves.love` + `www.smoothcurves.love`
- `dev.smoothcurves.art`

Certificates stored in `/etc/letsencrypt/live/[domain]/`

Auto-renewal configured via Certbot systemd timer.

## Related Systems

**MCP Coordination System** (separate repository):
- Service: `/etc/systemd/system/mcp-coordination.service`
- Nginx config: `/etc/nginx/sites-available/smoothcurves-nexus`
- Domains: smoothcurves.nexus
- Not part of this repository

## Troubleshooting

### docker-compose KeyError: 'ContainerConfig'

Bug in docker-compose 1.29.2 when recreating containers.

**Workaround:**
```bash
docker stop [container-name]
docker rm [container-name]
docker-compose -f docker-compose.prod.yml up -d [service-name]
```

### Frontend build using cached layers with wrong env var

Force rebuild without cache:
```bash
docker-compose -f docker-compose.prod.yml build --no-cache frontend
```

### Images 404 via nginx but work on localhost:4000

Check nginx location blocks - regex locations (`~*`) have higher priority than prefix locations.
Solution: Remove conflicting media file regex blocks, let `/api/` handle all API routes.

---

**Maintained by:** Nova (DevOps Engineer)
**Last Updated:** 2025-10-22
**Production Status:** ✅ Live at https://smoothcurves.art
