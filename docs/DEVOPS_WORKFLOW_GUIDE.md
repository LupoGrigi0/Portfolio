# Development & Operations Workflow Guide
**Version**: 1.0.0
**Created**: 2025-10-14
**Purpose**: Team coordination for local dev and production droplet environments

---

## 🎯 Overview

This guide explains how development teams work across two environments:
- **Local Development** (Windows machine - D:\Lupo\Source\Portfolio)
- **Production Server** (smoothcurves.nexus droplet)

**Key Concept**: We have a dual-environment system where local developers push code changes that automatically deploy to dev environment, then manually promote to production.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

LOCAL MACHINE (Windows)
  │
  ├── feature/integration branch
  │   ├── Develop new features
  │   ├── Test locally (localhost:3000, localhost:4000)
  │   └── Push to GitHub
  │
  ├── main branch
  │   ├── Stable, production-ready code
  │   └── Manually merged from feature branches
  │
  └── Content (E:\mnt\lupoportfolio\content)
      ├── Art collections, branding, media
      └── Synced to production via rsync

      ↓ Git Push ↓

GITHUB REPOSITORY
  │
  ├── feature/integration branch → Auto-deploys to DEV
  └── main branch → Auto-deploys to PRODUCTION

      ↓ GitHub Actions ↓

DROPLET (smoothcurves.nexus)
  │
  ├── DEV ENVIRONMENT (dev.smoothcurves.art)
  │   ├── Ports: 3001 (frontend), 4001 (backend), 6380 (redis)
  │   ├── Auto-deploy on push to feature branches
  │   └── Separate database and content from production
  │
  └── PRODUCTION ENVIRONMENT (smoothcurves.art)
      ├── Ports: 3000 (frontend), 4000 (backend), 6379 (redis)
      ├── Auto-deploy on push to main
      └── Production database and content
```

---

## 👥 Team Roles & Responsibilities

### Local Development Team (Windows)
**Who**: Frontend/backend developers working on local machine

**Responsibilities**:
- Develop features on feature branches
- Test locally before pushing
- Commit and push code to GitHub
- Sync content to production when needed
- Monitor local development environment

**Tools**:
- VSCode / Claude Code
- Git (feature branches)
- Local backend (localhost:4000)
- Local frontend (localhost:3000)
- Content sync scripts (rsync)

### Droplet Operations Team
**Who**: Server administrators or automated CI/CD (GitHub Actions)

**Responsibilities**:
- Monitor production and dev environments
- Respond to deployment failures
- Manage SSL certificates (auto-renewed)
- Monitor resource usage (RAM, disk)
- Coordinate with coordination system engineer

**Tools**:
- SSH access to droplet
- Docker and docker-compose
- Nginx configuration
- Health monitoring scripts
- Backup scripts

### Integration Engineer (Nova)
**Who**: System architect, deployment coordinator

**Responsibilities**:
- Merge feature branches to main
- Coordinate deployments
- Update infrastructure configuration
- Create deployment documentation
- Troubleshoot deployment issues

---

## 🔄 Development Workflow (Step-by-Step)

### Phase 1: Local Feature Development

```bash
# 1. Create or switch to feature branch
cd D:\Lupo\Source\Portfolio\worktrees\integration
git checkout feature/integration
# OR create new feature branch:
# git checkout -b feature/new-gallery-view

# 2. Make code changes
# - Edit files in src/frontend/ or src/backend/
# - Test locally

# 3. Test locally
# Start backend: npm run dev (in src/backend)
# Start frontend: npm run dev (in src/frontend)
# Visit: http://localhost:3000

# 4. Verify everything works
curl http://localhost:4000/api/health
# Open browser: http://localhost:3000

# 5. Commit changes
git add .
git commit -m "feat: Add new gallery view feature

- Implemented masonry layout
- Added lazy loading for images
- Updated collection API endpoint

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 6. Push to GitHub
git push origin feature/integration
```

**Result**: GitHub Actions automatically deploys to **dev.smoothcurves.art**

**Checklist**:
- [ ] Local tests pass
- [ ] Backend health check successful
- [ ] Frontend loads without errors
- [ ] Code committed with descriptive message
- [ ] Pushed to feature branch

### Phase 2: Dev Environment Testing

**Automatic Deployment** (GitHub Actions runs automatically):

1. GitHub detects push to `feature/integration`
2. Workflow `.github/workflows/deploy-dev.yml` triggers
3. SSH to droplet
4. Pull latest code: `git pull origin feature/integration`
5. Build containers: `docker compose -f docker-compose.dev.yml build`
6. Restart services: `docker compose -f docker-compose.dev.yml up -d`
7. Health check: `curl https://dev.smoothcurves.art/api/health`

**Manual Verification** (Developer):

```bash
# Wait 2-3 minutes for deployment to complete

# Check deployment status on GitHub
# Navigate to: https://github.com/YOUR_USERNAME/portfolio/actions

# Test dev environment
curl https://dev.smoothcurves.art/api/health

# Test in browser
# Open: https://dev.smoothcurves.art
```

**Checklist**:
- [ ] GitHub Actions workflow completed successfully
- [ ] Dev environment health check passes
- [ ] New feature visible on dev.smoothcurves.art
- [ ] No errors in browser console

### Phase 3: Code Review & Testing

**QA Testing on Dev**:
- [ ] Feature works as expected
- [ ] No visual bugs
- [ ] API responses correct
- [ ] Performance acceptable
- [ ] Mobile responsive (if applicable)

**If Issues Found**:
```bash
# Make fixes locally
# Edit code, test locally
git add .
git commit -m "fix: Resolve gallery layout issue on mobile"
git push origin feature/integration

# Wait for auto-deploy to dev
# Re-test on dev.smoothcurves.art
```

### Phase 4: Merge to Main (Production Release)

**When Ready for Production**:

```bash
# 1. Ensure feature branch is up to date
cd D:\Lupo\Source\Portfolio\worktrees\integration
git checkout feature/integration
git pull origin feature/integration

# 2. Switch to main branch
cd D:\Lupo\Source\Portfolio\worktrees\main
# OR: git checkout main

git pull origin main

# 3. Merge feature branch
git merge feature/integration

# 4. Resolve any conflicts (if they exist)
# Edit conflicted files, then:
git add .
git commit -m "Merge feature/integration into main"

# 5. Push to main
git push origin main
```

**Result**: GitHub Actions automatically deploys to **smoothcurves.art (production)**

**Checklist**:
- [ ] Main branch updated from remote
- [ ] Feature branch merged successfully
- [ ] No merge conflicts (or resolved)
- [ ] Pushed to origin/main

### Phase 5: Production Deployment

**Automatic Deployment** (GitHub Actions):

1. GitHub detects push to `main`
2. Workflow `.github/workflows/deploy-prod.yml` triggers
3. SSH to droplet
4. Backup current containers (tag as `-backup`)
5. Pull latest code: `git pull origin main`
6. Build containers: `docker compose -f docker-compose.prod.yml build`
7. Restart services: `docker compose -f docker-compose.prod.yml up -d`
8. Health check: `curl https://smoothcurves.art/api/health`
9. If health check fails → automatic rollback

**Manual Verification**:

```bash
# Wait 3-5 minutes for production deployment

# Check deployment status on GitHub
# Navigate to: https://github.com/YOUR_USERNAME/portfolio/actions

# Test production
curl https://smoothcurves.art/api/health

# Test in browser
# Open: https://smoothcurves.art
```

**Checklist**:
- [ ] GitHub Actions workflow completed successfully
- [ ] Production health check passes
- [ ] New feature visible on smoothcurves.art
- [ ] No errors or warnings
- [ ] Performance is good

### Phase 6: Monitor Production

**First 30 minutes after deployment**:
```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# Check logs
cd /mnt/lupoportfolio/portfolio-prod
sudo docker compose -f docker-compose.prod.yml logs -f

# Monitor resources
docker stats

free -h
# Ensure RAM usage <80%
```

**Checklist**:
- [ ] No errors in logs
- [ ] RAM usage acceptable
- [ ] All containers running
- [ ] Coordination system unaffected

---

## 📦 Content Deployment Workflow

Content (images, media files) is deployed separately from code.

### When to Sync Content

- Adding new art collections
- Updating existing images
- Adding branding assets
- Changing media files

### Content Sync Process

```bash
# 1. Ensure content is organized locally
# E:\mnt\lupoportfolio\content\
#   ├── branding/
#   ├── home/
#   └── collections/...

# 2. Run content sync script (from local machine)
cd D:\Lupo\Source\Portfolio

bash scripts/sync-content-prod.sh
# This uses rsync to sync to /mnt/lupoportfolio/portfolio-prod/content

# 3. Verify on production
ssh root@YOUR_DROPLET_IP "ls -la /mnt/lupoportfolio/portfolio-prod/content"

# 4. Restart backend to scan new content
ssh root@YOUR_DROPLET_IP "cd /mnt/lupoportfolio/portfolio-prod && docker compose restart backend"

# 5. Test content API
curl https://smoothcurves.art/api/content/collections
```

**Checklist**:
- [ ] Content organized locally
- [ ] rsync completed without errors
- [ ] Files visible on droplet
- [ ] Backend restarted and scanned content
- [ ] Content API returns new items

---

## 🚨 Common Issues & Solutions

### Issue 1: GitHub Actions Deployment Fails

**Symptoms**:
- Red X on GitHub Actions workflow
- Dev or production site doesn't update

**Diagnosis**:
```bash
# Check workflow logs on GitHub
# Navigate to: Actions → Click failed workflow → View logs
```

**Solutions**:
```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# Check if containers are running
docker ps

# View container logs
cd /mnt/lupoportfolio/portfolio-prod  # or portfolio-dev
sudo docker compose logs

# Manually rebuild and restart
sudo docker compose -f docker-compose.prod.yml build
sudo docker compose -f docker-compose.prod.yml up -d

# Check health
curl https://smoothcurves.art/api/health
```

### Issue 2: Database Not Initialized

**Symptoms**:
- API returns "Database not initialized" error
- Collections endpoint fails

**Solution**:
```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# Restart backend container
cd /mnt/lupoportfolio/portfolio-prod
sudo docker compose restart backend

# Check logs for initialization
sudo docker logs portfolio-backend-prod

# If database file is missing
ls -la /mnt/lupoportfolio/portfolio-prod/data/portfolio.sqlite

# Backend should auto-create it, but if needed, restart:
sudo docker compose down
sudo docker compose up -d
```

### Issue 3: Content Not Appearing

**Symptoms**:
- API returns empty collections
- Images don't load

**Solution**:
```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# Check content directory exists and has files
ls -la /mnt/lupoportfolio/portfolio-prod/content/
find /mnt/lupoportfolio/portfolio-prod/content -type f | head -20

# Check permissions
ls -ld /mnt/lupoportfolio/portfolio-prod/content/

# Restart backend to re-scan
cd /mnt/lupoportfolio/portfolio-prod
sudo docker compose restart backend

# Check content API
curl https://smoothcurves.art/api/content/collections
```

### Issue 4: Out of Memory

**Symptoms**:
- Containers randomly stop
- System becomes slow
- `docker ps` shows containers as "Exited"

**Solution**:
```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# Check memory usage
free -h

# If RAM >85%, stop dev environment
cd /mnt/lupoportfolio/portfolio-dev
sudo docker compose down

# Check memory again
free -h

# If still high, consider droplet resize
# Contact system administrator
```

### Issue 5: SSL Certificate Expired

**Symptoms**:
- Browser shows "Certificate expired" warning
- HTTPS doesn't work

**Solution**:
```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx

# Test
curl -I https://smoothcurves.art
```

---

## 🔧 Useful Commands Reference

### Local Development

```bash
# Start local backend
cd D:\Lupo\Source\Portfolio\src\backend
npm run dev

# Start local frontend
cd D:\Lupo\Source\Portfolio\src\frontend
npm run dev

# Run backend restart script
cmd /c "D:\Lupo\Source\Portfolio\src\scripts\start-backend.bat restart"

# Check git status
git status
git branch --show-current

# View recent commits
git log --oneline -10

# Sync content to production
bash scripts/sync-content-prod.sh
```

### Droplet Operations

```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# View all containers
docker ps -a

# View production logs
cd /mnt/lupoportfolio/portfolio-prod
sudo docker compose -f docker-compose.prod.yml logs -f

# View dev logs
cd /mnt/lupoportfolio/portfolio-dev
sudo docker compose -f docker-compose.dev.yml logs -f

# Restart production
cd /mnt/lupoportfolio/portfolio-prod
sudo docker compose restart

# Restart dev
cd /mnt/lupoportfolio/portfolio-dev
sudo docker compose restart

# Health check script
/mnt/lupoportfolio/scripts/health-check.sh

# Check resource usage
free -h
df -h /mnt/lupoportfolio
docker stats --no-stream

# View nginx config
sudo nginx -t
sudo cat /etc/nginx/sites-available/smoothcurves.art

# Reload nginx
sudo systemctl reload nginx

# Check SSL certificates
sudo certbot certificates

# Manual backup
/mnt/lupoportfolio/scripts/backup-portfolio.sh
```

### GitHub Actions

```bash
# View workflows
# Navigate to: https://github.com/YOUR_USERNAME/portfolio/actions

# Manually trigger production deployment
# Actions → Deploy to Production → Run workflow → Run

# View deployment logs
# Click on specific workflow run → View job logs
```

---

## 📊 Monitoring & Health Checks

### Daily Checks (Automated)

These run automatically via cron jobs:
- **Health checks**: Every hour (via cron or Docker healthcheck)
- **Backups**: Daily at 3 AM
- **Resource monitoring**: Every hour

### Weekly Manual Checks

```bash
# 1. Check all services are healthy
/mnt/lupoportfolio/scripts/health-check.sh

# 2. Review resource usage trends
tail -100 /var/log/resource-monitor.log

# 3. Check disk space
df -h /mnt/lupoportfolio

# 4. Verify backups exist
ls -lh /mnt/lupoportfolio/backups/

# 5. Check SSL certificate expiry
sudo certbot certificates
# Should show ~60-90 days remaining

# 6. Review nginx logs for errors
sudo tail -100 /var/log/nginx/error.log

# 7. Check for Docker image updates (optional)
docker images | grep portfolio
```

### Monthly Checks

- [ ] Review GitHub Actions usage (free tier: 2000 min/month)
- [ ] Check DigitalOcean billing and bandwidth usage
- [ ] Review and rotate SSH keys if needed
- [ ] Test disaster recovery procedures (optional)
- [ ] Update dependencies (npm audit, Docker image updates)

---

## 🔐 Security Best Practices

### SSH Keys

```bash
# Use separate SSH keys for different purposes
~/.ssh/lupoportfolio_ed25519        # Content sync
~/.ssh/github-actions-portfolio     # GitHub Actions deployment
~/.ssh/id_ed25519                   # Personal SSH access

# Rotate SSH keys every 6 months
ssh-keygen -t ed25519 -f ~/.ssh/new_key -C "description"
```

### Secrets Management

- ✅ **GitHub Secrets**: Store SSH keys, IP addresses in GitHub Actions secrets
- ✅ **Environment Variables**: Use `.env` files (NOT committed to git)
- ❌ **Never commit**: API keys, passwords, private keys, `.env` files

### Access Control

- **Production**: Only merge to `main` after thorough testing
- **Dev**: Can push directly to feature branches
- **Droplet**: Use SSH keys, disable password authentication
- **GitHub**: Use branch protection rules for `main` branch

---

## 📚 Documentation References

**For Deployment**:
- `DEPLOYMENT_MASTER_CHECKLIST.md` - Complete deployment steps
- `Portfolio_PRODUCTION_DEPLOYMENT_ARCHITECTURE.md` - Architecture details
- `PORTFOLIO_DEPLOYMENT_REVIEW.md` - Security review and recommendations

**For Development**:
- `backend_server_API_Endpoints.md` - Backend API documentation
- `frontend_server_admin_endpoints.md` - Frontend admin docs
- This guide - Dev/ops workflow

**For Troubleshooting**:
- Docker logs: `docker compose logs`
- Nginx logs: `/var/log/nginx/error.log`
- System logs: `/var/log/syslog`

---

## 🎯 Quick Decision Tree

**I want to...**

### ...deploy a new feature
1. Develop locally on feature branch
2. Test locally (localhost:3000)
3. Push to feature branch → Auto-deploys to dev.smoothcurves.art
4. Test on dev environment
5. Merge to main → Auto-deploys to smoothcurves.art

### ...update content (images, media)
1. Organize content in E:\mnt\lupoportfolio\content
2. Run `bash scripts/sync-content-prod.sh`
3. Restart backend: `docker compose restart backend`
4. Verify: `curl https://smoothcurves.art/api/content/collections`

### ...fix a production bug
1. Identify issue (check logs, health checks)
2. Create fix on feature branch
3. Test locally
4. Push to feature branch → Test on dev
5. If urgent: merge to main immediately
6. If not urgent: follow normal workflow

### ...rollback a deployment
1. SSH to droplet
2. `cd /mnt/lupoportfolio/portfolio-prod`
3. `git log --oneline -5` (find previous commit)
4. `git checkout <previous-commit-hash>`
5. `docker compose build && docker compose up -d`

### ...add a new environment variable
1. Edit `docker-compose.prod.yml` (add to `environment:` section)
2. Commit and push to main
3. SSH to droplet
4. `cd /mnt/lupoportfolio/portfolio-prod`
5. `git pull origin main`
6. `docker compose up -d` (will recreate containers with new env)

### ...check why something is broken
1. **Check health**: `curl https://smoothcurves.art/api/health`
2. **Check logs**: `docker compose logs backend` or `docker compose logs frontend`
3. **Check resources**: `free -h` and `docker stats`
4. **Check coordination system**: `curl https://smoothcurves.nexus/health`
5. **If all else fails**: Restart containers: `docker compose restart`

---

## 📞 Escalation & Support

### Minor Issues (Self-Service)
- Deployment failures → Check GitHub Actions logs, retry
- Content not loading → Re-sync content, restart backend
- Slow performance → Check resources, restart containers

### Major Issues (Requires Intervention)
- Coordination system down → **CRITICAL** - Contact system admin immediately
- Out of memory repeatedly → Plan droplet resize
- SSL certificate issues → Check certbot, renew manually if needed
- Complete site outage → Check logs, consider rollback

### Emergency Contacts
- **System Administrator**: [Contact info]
- **Integration Engineer**: Nova (via coordination system or email)
- **DigitalOcean Support**: https://www.digitalocean.com/support (if droplet issues)

---

## ✅ Checklist for New Team Members

**Setup (One-Time)**:
- [ ] Clone repository locally
- [ ] Install Node.js, npm, Docker (for local development)
- [ ] Setup SSH keys for droplet access (if needed)
- [ ] Configure git with name and email
- [ ] Read architecture documentation
- [ ] Read this workflow guide

**Before First Deployment**:
- [ ] Understand git branching strategy
- [ ] Know how to test locally
- [ ] Understand dev vs production environments
- [ ] Know where to view deployment logs (GitHub Actions)
- [ ] Know how to rollback if needed

**Regular Workflow**:
- [ ] Always test locally before pushing
- [ ] Write descriptive commit messages
- [ ] Test on dev before merging to main
- [ ] Monitor GitHub Actions after pushing
- [ ] Check production after deployment

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-14
**Maintained by**: Integration Team

_Foundation Architecture - Clear Processes for Sustainable Development_ 🤖
