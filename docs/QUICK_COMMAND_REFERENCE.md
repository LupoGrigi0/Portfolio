# Quick Command Reference for Droplet Operations
**Purpose**: Fast lookup of common commands during deployment and operations
**Audience**: Droplet team member during active work
**Format**: Copy-paste ready commands

---

## 🎯 How to Use This Reference

**During deployment**: Keep this open in a separate terminal/window
**When stuck**: Search (Ctrl+F) for what you need
**Format**: Commands show `$` for user prompt, `#` for comments

---

## 🔍 Critical Health Checks

### Check Coordination System (DO THIS OFTEN!)
```bash
# HTTPS health check
curl https://smoothcurves.nexus/health

# HTTP openapi.json (MUST work - not redirect!)
curl http://smoothcurves.nexus/openapi.json

# Both should return 200 OK with JSON
```

### Check Portfolio Services
```bash
# Backend health (local test before Docker)
curl http://localhost:4000/api/health

# Backend health (through nginx after deployment)
curl https://smoothcurves.art/api/health

# Frontend (through nginx)
curl https://smoothcurves.art
```

---

## 📂 Navigation

### Essential Directories
```bash
# Portfolio production
cd /mnt/lupoportfolio/portfolio-prod

# Backend source
cd /mnt/lupoportfolio/portfolio-prod/src/backend

# Frontend source
cd /mnt/lupoportfolio/portfolio-prod/src/frontend

# Infrastructure
cd /mnt/lupoportfolio/portfolio-prod/src/infrastructure

# Deployment data
cd /mnt/lupoportfolio/portfolio-prod/deployments/data

# Backups
cd /mnt/lupoportfolio/portfolio-prod/backups
```

---

## 🔧 System Information

### Resource Monitoring
```bash
# RAM usage
free -h

# Disk usage
df -h
df -h /mnt/lupoportfolio  # Specific to portfolio volume

# CPU and load
top
# Press 'q' to quit

# Network connections
netstat -tuln

# Ports in use
netstat -tuln | grep LISTEN

# Check specific ports
netstat -tuln | grep -E ":(3000|4000|6379|3444)"
```

### Process Management
```bash
# All processes
ps aux

# Find coordination system
ps aux | grep -i coordination

# Find Node processes
ps aux | grep node

# Find cron
ps aux | grep cron

# Kill a process by PID
kill <PID>
kill -9 <PID>  # Force kill if needed
```

---

## 🐙 Git Operations

### Repository Status
```bash
# Navigate to repo
cd /mnt/lupoportfolio/portfolio-prod

# Check status
git status

# Check branch
git branch
git branch --show-current

# View log
git log --oneline -10
git log --graph --oneline --all -20

# Check remote
git remote -v
```

### Updating Code
```bash
# Pull latest (if needed)
git fetch origin
git pull origin main

# Check what changed
git diff HEAD~1 HEAD

# Reset to specific commit (if needed)
git log --oneline -10  # Find commit hash
git reset --hard <commit-hash>
```

---

## 🐳 Docker Commands

### Docker Status
```bash
# Check Docker is running
systemctl status docker

# Docker version
docker --version
docker compose version

# List all containers
docker ps -a

# List running containers only
docker ps

# List images
docker images

# Docker disk usage
docker system df
```

### Docker Compose Operations

**Starting Services:**
```bash
# Navigate to portfolio directory
cd /mnt/lupoportfolio/portfolio-prod

# Build images
docker compose build

# Build specific service
docker compose build backend

# Start services (detached)
docker compose up -d

# Start services (foreground - see logs)
docker compose up

# Start specific service
docker compose up -d backend
```

**Stopping Services:**
```bash
# Stop all services
docker compose down

# Stop but keep containers
docker compose stop

# Stop specific service
docker compose stop backend

# Restart specific service
docker compose restart backend

# Restart all services
docker compose restart
```

**Viewing Logs:**
```bash
# All services (follow mode)
docker compose logs -f

# All services (last 100 lines)
docker compose logs --tail=100

# Specific service
docker compose logs -f backend
docker compose logs -f frontend

# Since specific time
docker compose logs --since 30m backend
```

**Container Management:**
```bash
# Enter running container
docker exec -it portfolio-backend-prod sh
docker exec -it portfolio-backend-prod bash  # If bash available

# Run command in container
docker exec portfolio-backend-prod ls -la /app/data

# Check container stats
docker stats

# Check container stats (no stream)
docker stats --no-stream

# Inspect container
docker inspect portfolio-backend-prod
```

**Cleanup:**
```bash
# Remove unused images
docker image prune

# Remove stopped containers
docker container prune

# Remove unused volumes
docker volume prune

# Full cleanup (be careful!)
docker system prune

# Full cleanup including volumes (DANGEROUS!)
docker system prune -a --volumes
```

---

## 📦 Backend Operations

### Local Backend (Without Docker)
```bash
cd /mnt/lupoportfolio/portfolio-prod/src/backend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Check TypeScript types
npm run type-check

# Run tests (if configured)
npm test
```

### Backend Inside Docker
```bash
# Enter backend container
docker exec -it portfolio-backend-prod sh

# Once inside container:
cd /app
ls -la data/          # Check database
ls -la logs/          # Check logs
ls -la backups/       # Check backups
cat logs/backend.log  # View log file
ps aux                # Check processes (cron, node)
crontab -l            # View cron jobs
env                   # View environment variables
exit                  # Leave container
```

### Database Operations
```bash
# Check database file exists
ls -la /mnt/lupoportfolio/portfolio-prod/deployments/data/portfolio.sqlite

# Enter container and check database
docker exec -it portfolio-backend-prod sh
sqlite3 /app/data/portfolio.sqlite
# Inside SQLite:
.tables               # List tables
.schema              # Show schema
SELECT * FROM collections LIMIT 5;  # Query data
.quit                # Exit SQLite

# Backup database manually
docker exec portfolio-backend-prod /app/scripts/backup-database.sh

# Check backups
docker exec portfolio-backend-prod ls -lh /app/backups/daily/
```

---

## 🌐 Nginx Operations

### Nginx Status
```bash
# Check Nginx is running
systemctl status nginx

# Test configuration syntax
sudo nginx -t

# Reload configuration (graceful)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Stop Nginx
sudo systemctl stop nginx

# Start Nginx
sudo systemctl start nginx
```

### Nginx Configuration
```bash
# View portfolio config
sudo cat /etc/nginx/sites-available/smoothcurves.art

# View coordination system config
sudo cat /etc/nginx/sites-enabled/smoothcurves-nexus

# Edit portfolio config
sudo nano /etc/nginx/sites-available/smoothcurves.art

# Enable site
sudo ln -s /etc/nginx/sites-available/smoothcurves.art /etc/nginx/sites-enabled/

# Disable site
sudo rm /etc/nginx/sites-enabled/smoothcurves.art

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Last 100 lines
sudo tail -100 /var/log/nginx/error.log

# Search for errors
sudo grep -i error /var/log/nginx/error.log | tail -50
```

---

## 🔐 SSL Certificate Management

### Certificate Status
```bash
# List all certificates
sudo certbot certificates

# Check expiry dates
sudo certbot certificates | grep -E "(Certificate Name|Expiry)"

# Test renewal (dry run - safe)
sudo certbot renew --dry-run
```

### Certificate Operations
```bash
# Renew certificates (if needed)
sudo certbot renew

# Request new certificate
sudo certbot --nginx -d smoothcurves.art -d www.smoothcurves.art

# Revoke certificate (if needed)
sudo certbot revoke --cert-path /etc/letsencrypt/live/smoothcurves.art/fullchain.pem

# View certificate details
sudo openssl x509 -in /etc/letsencrypt/live/smoothcurves.art/fullchain.pem -text -noout
```

---

## 🔄 Backup Operations

### Manual Backups
```bash
# Trigger database backup
docker exec portfolio-backend-prod /app/scripts/backup-database.sh

# Trigger social tables backup
docker exec portfolio-backend-prod /app/scripts/backup-social-tables.sh

# Trigger gallery backup (with name)
docker exec portfolio-backend-prod /app/scripts/backup-on-gallery-add.sh "test-gallery"

# Rotate logs manually
docker exec portfolio-backend-prod /app/scripts/rotate-logs.sh
```

### Check Backups
```bash
# List all backups
docker exec portfolio-backend-prod ls -lh /app/backups/daily/
docker exec portfolio-backend-prod ls -lh /app/backups/social/
docker exec portfolio-backend-prod ls -lh /app/backups/event-triggered/
docker exec portfolio-backend-prod ls -lh /app/backups/logs-archive/

# Check backup logs
docker exec portfolio-backend-prod cat /app/logs/backup.log
docker exec portfolio-backend-prod cat /app/logs/maintenance.log

# Verify cron is running
docker exec portfolio-backend-prod ps aux | grep crond

# Check crontab
docker exec portfolio-backend-prod crontab -l
```

### Restore Operations
```bash
# Stop backend
docker compose stop backend

# List available backups
ls -lh /mnt/lupoportfolio/portfolio-prod/backups/daily/

# Restore from backup
gunzip -c /mnt/lupoportfolio/portfolio-prod/backups/daily/portfolio-2025-10-14.sqlite.gz > \
  /mnt/lupoportfolio/portfolio-prod/deployments/data/portfolio.sqlite

# Restart backend
docker compose start backend

# Verify
curl http://localhost:4000/api/health
```

---

## 📊 Monitoring & Debugging

### Real-time Monitoring
```bash
# Watch resource usage
watch -n 5 'free -h && df -h /mnt/lupoportfolio'

# Watch Docker stats
watch -n 2 docker stats --no-stream

# Watch logs
docker compose logs -f --tail=50

# Watch specific service
docker compose logs -f backend
```

### Log Analysis
```bash
# Search for errors in backend
docker compose logs backend | grep -i error

# Search for specific term
docker compose logs backend | grep -i "database"

# Count errors
docker compose logs backend | grep -i error | wc -l

# Last hour of logs
docker compose logs backend --since 1h

# Specific time range
docker compose logs backend --since "2025-10-14T10:00:00" --until "2025-10-14T11:00:00"
```

### Health Monitoring Script
```bash
# Create quick health check script
cat > /tmp/health-check.sh << 'EOF'
#!/bin/bash
echo "=== System Health Check ==="
echo "Time: $(date)"
echo ""
echo "[Coordination System]"
curl -s https://smoothcurves.nexus/health | jq . || echo "FAILED"
echo ""
echo "[Portfolio Backend]"
curl -s http://localhost:4000/api/health | jq . || echo "FAILED"
echo ""
echo "[Resources]"
free -h | grep Mem
df -h /mnt/lupoportfolio | grep lupoportfolio
echo ""
echo "[Docker]"
docker ps --format "{{.Names}}: {{.Status}}"
EOF

chmod +x /tmp/health-check.sh
/tmp/health-check.sh
```

---

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Stop portfolio services
cd /mnt/lupoportfolio/portfolio-prod
docker compose down

# Check coordination system still works
curl https://smoothcurves.nexus/health

# Revert to previous commit
git log --oneline -10  # Find previous commit
git reset --hard <previous-commit-hash>

# Rebuild and restart
docker compose build
docker compose up -d

# Verify
curl http://localhost:4000/api/health
```

### If Coordination System Breaks
```bash
# IMMEDIATE: Stop portfolio
docker compose down

# Restore Nginx config
sudo cp /etc/nginx/sites-enabled/smoothcurves-nexus.backup.* \
       /etc/nginx/sites-enabled/smoothcurves-nexus

# Remove portfolio config
sudo rm /etc/nginx/sites-enabled/smoothcurves.art

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# Test coordination system
curl https://smoothcurves.nexus/health

# Report issue
echo "$(date): Coordination system issue - portfolio rolled back" >> \
  /mnt/lupoportfolio/deployment.log
```

### Out of Memory
```bash
# Stop dev environment (less critical)
cd /mnt/lupoportfolio/portfolio-dev
docker compose down

# Check memory
free -h

# If still problematic, stop production too
cd /mnt/lupoportfolio/portfolio-prod
docker compose down

# Check what's using memory
ps aux --sort=-%mem | head -20

# Plan droplet upgrade if needed
```

---

## 📝 Logging & Documentation

### Create Deployment Log
```bash
# Start logging
exec > >(tee -a /mnt/lupoportfolio/deployment.log) 2>&1
echo "=== Deployment started: $(date) ==="

# Now all your commands will be logged

# End logging
echo "=== Deployment completed: $(date) ==="
```

### Quick Status Updates
```bash
# Append to deployment log
echo "$(date): Starting Phase 3 - Docker installation" >> /mnt/lupoportfolio/deployment.log

echo "$(date): Backend health check passed" >> /mnt/lupoportfolio/deployment.log

echo "$(date): Deployment complete, all services running" >> /mnt/lupoportfolio/deployment.log
```

### View Deployment History
```bash
# View entire log
cat /mnt/lupoportfolio/deployment.log

# Last 50 lines
tail -50 /mnt/lupoportfolio/deployment.log

# Search log
grep -i "error" /mnt/lupoportfolio/deployment.log
```

---

## 🔍 Troubleshooting Quick Checks

### Service Won't Start
```bash
# Check logs
docker compose logs <service>

# Check if port in use
netstat -tuln | grep <port>

# Check disk space
df -h

# Check memory
free -h

# Rebuild container
docker compose build <service>
docker compose up -d <service>
```

### Database Issues
```bash
# Check database file exists
ls -la /mnt/lupoportfolio/portfolio-prod/deployments/data/portfolio.sqlite

# Check permissions
ls -l /mnt/lupoportfolio/portfolio-prod/deployments/data/

# Check container can access
docker exec portfolio-backend-prod ls -la /app/data/

# Check environment variable
docker exec portfolio-backend-prod env | grep DATABASE
```

### Network Issues
```bash
# Check ports listening
netstat -tuln | grep LISTEN

# Test connectivity
curl http://localhost:4000/api/health
curl http://localhost:3000

# Check Docker networks
docker network ls
docker network inspect portfolio-network

# Check Nginx is routing correctly
curl -v http://localhost/api/health
```

---

## 📚 Quick Reference Summary

**Most Used Commands:**
```bash
# Health checks
curl https://smoothcurves.nexus/health
curl http://localhost:4000/api/health

# Docker operations
cd /mnt/lupoportfolio/portfolio-prod
docker compose ps
docker compose logs -f
docker compose restart

# System resources
free -h
df -h

# Nginx
sudo nginx -t
sudo systemctl reload nginx
```

**Emergency Commands:**
```bash
# Rollback
docker compose down
git reset --hard <previous-commit>

# Check coordination system
curl https://smoothcurves.nexus/health
```

**Monitoring:**
```bash
# Continuous monitoring
docker compose logs -f
docker stats
tail -f /var/log/nginx/error.log
```

---

## 🎯 Command Not Here?

**Check these docs:**
- Full deployment: `DEPLOYMENT_MASTER_CHECKLIST.md`
- Operations: `DEVOPS_WORKFLOW_GUIDE.md`
- Backups: `BACKUP_AND_MAINTENANCE_STRATEGY.md`
- API testing: `backend_server_API_Endpoints.md`

---

**Last Updated**: 2025-10-14
**Quick Ref Version**: 1.0.0
**For**: Droplet Operations Team
