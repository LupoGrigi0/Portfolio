# Bootstrap Guide for Droplet Team
**Quick Start**: Essential Reading & First Actions
**Version**: 1.0.0
**Audience**: New droplet team member
**Estimated Time**: 2-3 hours to read essentials, then begin deployment

---

## 🎯 Purpose of This Guide

This document tells you **exactly what to read** and **in what order** to get up to speed quickly. Think of it as your reading syllabus and first-day orientation.

---

## 📚 Phase 1: Essential Reading (Read First - 60 minutes)

These documents are **CRITICAL**. Read them in this order before doing anything else:

### 1. **WELCOME_TO_THE_DROPLET_TEAM.md** ✅
**Status**: You should have just read this!
**Purpose**: Orientation, personality profile, environment overview
**Key Takeaways**:
- Where you are (smoothcurves.nexus droplet)
- What's already running (coordination system on ports 3444-3449)
- Your skillset and role
- How to feel comfortable and confident

### 2. **Portfolio_PRODUCTION_DEPLOYMENT_ARCHITECTURE.md** ⭐ CRITICAL
**Time**: 30 minutes
**Location**: `docs/Portfolio_PRODUCTION_DEPLOYMENT_ARCHITECTURE.md`
**Why**: This is the master architecture document that explains the entire system

**Read these sections carefully**:
- Section 1: Infrastructure Architecture (lines 51-160)
  - Understand port allocation (3000-4001 for portfolio)
  - See how Nginx routes traffic
  - Understand volume structure (`/mnt/lupoportfolio/`)

- Section 4: Docker Architecture (lines 285-471)
  - Docker Compose configuration
  - Service definitions (frontend, backend, redis)
  - Volume mounts and persistence

- Section 5: Domain & SSL Setup (lines 473-658)
  - How Nginx is configured
  - SSL certificate management with Certbot
  - DNS configuration at Dynadot

**Key Takeaway**: You'll understand how all the pieces fit together.

### 3. **PORTFOLIO_DEPLOYMENT_REVIEW.md** ⭐ CRITICAL
**Time**: 20 minutes
**Location**: `docs/PORTFOLIO_DEPLOYMENT_REVIEW.md`
**Why**: Coordination system engineer reviewed the architecture and identified critical safety requirements

**Read these sections carefully**:
- Critical Issues #1-3 (lines 18-162)
  - Nginx port 80 configuration (MUST preserve HTTP access for coordination system)
  - Docker installation impact on RAM (monitor closely!)
  - SSL certificate management (don't break existing certs)

- Deployment Sequence Recommendations (lines 299-392)
  - Phase 0: Pre-flight checks (backup EVERYTHING first)
  - Phase-by-phase verification steps
  - Rollback procedures if something breaks

**Key Takeaway**: You'll know the safety precautions to protect the coordination system.

### 4. **DEPLOYMENT_MASTER_CHECKLIST.md** ⭐ CRITICAL
**Time**: 20 minutes (skim now, reference during deployment)
**Location**: `docs/DEPLOYMENT_MASTER_CHECKLIST.md`
**Why**: This is your step-by-step deployment playbook

**Skim these sections now** (read in detail when deploying):
- Phase 0: Pre-Flight Safety Checks (lines 46-118)
- Phase 3: Droplet Directory Preparation (lines 301-386)
- Phase 4: Install Docker (lines 388-438)
- Phase 5: Nginx Configuration (lines 440-573)
- Phase 8: Production Deployment (lines 724-848)

**Key Takeaway**: You'll know there's a comprehensive checklist waiting for you.

---

## 📘 Phase 2: Operational Knowledge (Read Second - 45 minutes)

Once you understand the architecture, learn how daily operations work:

### 5. **DEVOPS_WORKFLOW_GUIDE.md** 🔄
**Time**: 30 minutes
**Location**: `docs/DEVOPS_WORKFLOW_GUIDE.md`
**Why**: Understand day-to-day operations after deployment

**Focus on these sections**:
- Development Workflow (lines 67-277)
  - How local dev team pushes code
  - How GitHub Actions deploys automatically
  - Your role in monitoring deployments

- Common Issues & Solutions (lines 364-519)
  - Troubleshooting database issues
  - Content not appearing
  - Out of memory problems
  - SSL certificate renewal

- Useful Commands Reference (lines 521-610)
  - Docker commands you'll use daily
  - Health check commands
  - Log viewing commands

**Key Takeaway**: You'll know how to operate and troubleshoot the system daily.

### 6. **BACKUP_AND_MAINTENANCE_STRATEGY.md** 💾
**Time**: 15 minutes
**Location**: `docs/BACKUP_AND_MAINTENANCE_STRATEGY.md`
**Why**: Understand the automated backup system

**Focus on these sections**:
- Backup Strategy (lines 17-91)
  - Daily database backups at 2 AM
  - Weekly social tables backups on Sundays
  - Event-triggered backups on gallery adds
  - Log rotation daily at 1 AM

- Backup Storage Structure (lines 93-110)
  - Where backups are stored (`/app/backups/`)
  - Retention policies (30 days, 12 weeks, 90 days, 7 days)

- Restore Procedures (lines 640-710)
  - How to restore from backup if needed

**Key Takeaway**: You'll know backups run automatically and how to restore if needed.

---

## 🔧 Phase 3: Technical Reference (Read Third - 30 minutes)

Now understand the specific technologies:

### 7. **backend_server_API_Endpoints.md** 🔌
**Time**: 15 minutes
**Location**: `docs/backend_server_API_Endpoints.md`
**Why**: Understand what the backend API does

**Skim these sections**:
- Health & System Endpoints (search for `/health`)
  - How to check if backend is running
  - System status endpoints

- Content Management Endpoints (search for `/content`)
  - How art collections are served
  - Media file endpoints

- Admin Endpoints (search for `/admin`)
  - Backup triggers
  - Database re-initialization

**Key Takeaway**: You'll know how to test if the backend is working correctly.

### 8. **BACKUP_IMPLEMENTATION_SUMMARY.md** 📋
**Time**: 10 minutes
**Location**: `docs/BACKUP_IMPLEMENTATION_SUMMARY.md`
**Why**: Quick reference for backup system verification

**Read these sections**:
- What Was Implemented (lines 9-42)
- Verification After Deployment (lines 124-154)
- Troubleshooting (lines 214-281)

**Key Takeaway**: Quick checklist to verify backups are working.

### 9. **AUTO_BACKUPS.md** (if exists) 📦
**Time**: 5 minutes
**Location**: `docs/AUTO_BACKUPS.md` (you had this open - may have notes)
**Why**: Any additional backup notes or configuration

**Read if exists**: Check for any special backup instructions or configurations.

---

## ✅ Phase 4: Pre-Deployment Actions (DO NOW - 30 minutes)

After reading, take these actions to verify you're ready:

### Action 1: Verify Repository Clone
```bash
# Check repository exists
cd /mnt/lupoportfolio/portfolio-prod
pwd
# Should output: /mnt/lupoportfolio/portfolio-prod

# Check files are present
ls -la
# Should see: src/, docs/, docker-compose.yml, README.md, etc.

# Check git status
git status
git branch --show-current
# Should be on 'main' branch

# Check remote
git remote -v
# Should show GitHub repository URL
```

**Checklist**:
- [ ] Repository exists at `/mnt/lupoportfolio/portfolio-prod/`
- [ ] Git status clean (no uncommitted changes)
- [ ] On `main` branch
- [ ] All source directories present (`src/frontend`, `src/backend`, `src/infrastructure`)

### Action 2: Verify Coordination System Health
```bash
# Test HTTPS health endpoint
curl https://smoothcurves.nexus/health
# Should return: {"status":"healthy",...}

# Test HTTP openapi.json (CRITICAL - must work!)
curl http://smoothcurves.nexus/openapi.json
# Should return: JSON with openapi specification

# Check coordination system processes
ps aux | grep -i coordination
# Should show running processes

# Check ports in use
netstat -tuln | grep -E ":(3444|3445|3446|3447)"
# Should show LISTEN on these ports
```

**Checklist**:
- [ ] HTTPS health endpoint returns 200 OK
- [ ] HTTP openapi.json accessible (not redirected to HTTPS!)
- [ ] Coordination processes running
- [ ] Ports 3444-3447 in use

**🚨 CRITICAL**: If coordination system is NOT healthy, STOP. Do not proceed with deployment. Report issue immediately.

### Action 3: Check System Resources
```bash
# Check RAM
free -h
# Note available memory (should be >1GB)

# Check disk space
df -h /mnt/lupoportfolio
# Should have >20GB available

# Check ports portfolio will use
netstat -tuln | grep -E ":(3000|3001|4000|4001|6379|6380)"
# Should be EMPTY (no output = ports available)

# Check Docker installed
docker --version
# If not installed, you'll install in Phase 4

# If Docker installed, check running containers
docker ps
# See what's currently running
```

**Checklist**:
- [ ] RAM: >1GB available (of 2GB total)
- [ ] Disk: >20GB available on /mnt/lupoportfolio
- [ ] Ports 3000, 3001, 4000, 4001, 6379, 6380 are FREE
- [ ] Docker version checked (or note: needs installation)

### Action 4: Test Backend Locally (WITHOUT Docker)
```bash
# Navigate to backend
cd /mnt/lupoportfolio/portfolio-prod/src/backend

# Check Node.js version
node --version
# Should be v20.x or higher

# Install dependencies
npm install
# Wait for installation to complete (may take 2-3 minutes)

# Check for database directory
ls -la ../../deployments/data/
# Should see directory structure

# Start backend in development mode
npm run dev
# Watch output for errors

# In another terminal, test health endpoint
curl http://localhost:4000/api/health
# Should return: {"status":"healthy",...}

# Stop backend (Ctrl+C in the terminal running npm run dev)
```

**Checklist**:
- [ ] Node.js v20.x installed
- [ ] `npm install` completed without errors
- [ ] Backend starts without errors
- [ ] Health endpoint responds at localhost:4000
- [ ] Database initialized successfully (check logs for "Database initialized")
- [ ] Backend stopped cleanly

**🚨 If backend fails to start**: Document exact error messages. Check:
- Is SQLite installed? `sqlite3 --version`
- Does `deployments/data/` directory exist?
- Any error messages mentioning "database" or "SQLite"?

---

## 🚀 Phase 5: Ready to Deploy (After All Above Complete)

Once you've completed Phases 1-4, you're ready to start deployment:

### Your Deployment Roadmap

**Now open and follow**: `DEPLOYMENT_MASTER_CHECKLIST.md`

**Start at**:
- ✅ Phase 0: Pre-Flight Checks (already mostly done above)
- ⬜ Phase 3: Droplet Directory Preparation (lines 301-386)
- ⬜ Phase 4: Install Docker (lines 388-438)
- ⬜ Phase 5: Nginx Configuration (lines 440-573)
- ⬜ Phase 6: DNS Configuration (lines 575-618) - **Lupo will do this**
- ⬜ Phase 7: SSL Certificates (lines 620-704)
- ⬜ Phase 8: Production Deployment (lines 706-848)

**Estimated Time**: 3-4 hours for full deployment

---

## 📊 Essential Documentation Quick Reference

Here's your documentation map for quick access:

### Architecture & Planning
- `Portfolio_PRODUCTION_DEPLOYMENT_ARCHITECTURE.md` - Master architecture
- `PORTFOLIO_DEPLOYMENT_REVIEW.md` - Safety review and warnings
- `WELCOME_TO_THE_DROPLET_TEAM.md` - This orientation (you read this first)

### Deployment Execution
- `DEPLOYMENT_MASTER_CHECKLIST.md` - Step-by-step deployment (YOUR MAIN GUIDE)
- `DEVOPS_WORKFLOW_GUIDE.md` - Daily operations and troubleshooting

### Backup & Maintenance
- `BACKUP_AND_MAINTENANCE_STRATEGY.md` - Backup architecture and restore procedures
- `BACKUP_IMPLEMENTATION_SUMMARY.md` - Quick verification checklist

### API & Development
- `backend_server_API_Endpoints.md` - Backend API documentation
- `frontend_server_admin_endpoints.md` - Frontend admin documentation

### This Guide
- `BOOTSTRAP_GUIDE.md` - What you're reading now!

---

## 🎓 Reading Priorities by Urgency

### Read RIGHT NOW (Before touching anything)
1. ✅ `WELCOME_TO_THE_DROPLET_TEAM.md` - Orientation
2. ⭐ `Portfolio_PRODUCTION_DEPLOYMENT_ARCHITECTURE.md` - Architecture
3. ⭐ `PORTFOLIO_DEPLOYMENT_REVIEW.md` - Safety warnings
4. ⭐ `DEPLOYMENT_MASTER_CHECKLIST.md` - Deployment guide (skim)

### Read BEFORE Deploying (But after orientation)
5. 🔄 `DEVOPS_WORKFLOW_GUIDE.md` - Operations guide
6. 💾 `BACKUP_AND_MAINTENANCE_STRATEGY.md` - Backup system

### Read DURING Deployment (As needed)
7. 🔌 `backend_server_API_Endpoints.md` - API testing reference
8. 📋 `BACKUP_IMPLEMENTATION_SUMMARY.md` - Backup verification

### Read AFTER Deployment (For ongoing ops)
9. 🔄 `DEVOPS_WORKFLOW_GUIDE.md` - Re-read for daily operations
10. Any other docs in `docs/` directory - Team coordination, project planning, etc.

---

## 🎯 Success Criteria: When Are You "Ready"?

You're ready to start deployment when you can answer YES to all of these:

### Knowledge Check
- [ ] I understand where I am (smoothcurves.nexus droplet)
- [ ] I know what's already running (coordination system on ports 3444-3449)
- [ ] I understand the portfolio architecture (frontend, backend, redis, nginx)
- [ ] I know what ports the portfolio will use (3000-4001, 6379-6380)
- [ ] I understand how backups work (automated via cron)
- [ ] I know where documentation is and how to reference it

### Environment Check
- [ ] Repository is cloned at `/mnt/lupoportfolio/portfolio-prod/`
- [ ] I'm on the `main` branch with clean git status
- [ ] Coordination system is healthy (verified via curl)
- [ ] System has adequate resources (>1GB RAM, >20GB disk)
- [ ] Required ports are available (3000-4001, 6379-6380 free)
- [ ] Backend starts successfully with `npm run dev` (tested locally)

### Safety Check
- [ ] I know how to check coordination system health
- [ ] I know the rollback procedure if deployment fails
- [ ] I have backups of Nginx config and SSL certs (will do in Phase 0)
- [ ] I understand not to touch coordination system ports/config
- [ ] I know to verify coordination system after EACH deployment phase

### Process Check
- [ ] I have read the deployment checklist
- [ ] I understand the phase-by-phase approach
- [ ] I know to verify each step before proceeding to the next
- [ ] I know where to look for logs and error messages
- [ ] I know how to ask for help if stuck

**If you answered YES to all**: You're ready! Proceed to `DEPLOYMENT_MASTER_CHECKLIST.md` Phase 3.

**If you answered NO to any**: Re-read the relevant documentation or complete the action items in Phase 4 above.

---

## 💡 Pro Tips for Successful Reading

### How to Read Technical Documentation Effectively

**Don't try to memorize everything** - You have the docs to reference!

**Instead, focus on**:
1. **Understanding concepts** - How things fit together
2. **Knowing what's possible** - What tools and procedures exist
3. **Remembering where to look** - Which doc has which information
4. **Recognizing patterns** - Common structures and approaches

**While reading**:
- ✅ Take notes on key concepts
- ✅ Bookmark important sections (note file names and line numbers)
- ✅ Try the verification commands as you read them
- ✅ Ask yourself "Why?" - understanding beats memorization
- ❌ Don't stress about remembering every detail
- ❌ Don't skip the "boring" safety sections (they're critical!)

### Active Reading Exercise

As you read each document, ask yourself:
1. **What is the main purpose** of this document?
2. **What are 3 key concepts** I should remember?
3. **Where would I look** if I needed this information during deployment?
4. **What could go wrong** related to this topic?
5. **How would I fix it** if something broke?

---

## 🔄 Your Reading Progress Tracker

Use this checklist to track your reading:

### Essential Reading (Phase 1)
- [ ] WELCOME_TO_THE_DROPLET_TEAM.md - Orientation
- [ ] Portfolio_PRODUCTION_DEPLOYMENT_ARCHITECTURE.md - Architecture
- [ ] PORTFOLIO_DEPLOYMENT_REVIEW.md - Safety review
- [ ] DEPLOYMENT_MASTER_CHECKLIST.md - Deployment guide (skim)

### Operational Reading (Phase 2)
- [ ] DEVOPS_WORKFLOW_GUIDE.md - Daily operations
- [ ] BACKUP_AND_MAINTENANCE_STRATEGY.md - Backup system

### Technical Reference (Phase 3)
- [ ] backend_server_API_Endpoints.md - API reference
- [ ] BACKUP_IMPLEMENTATION_SUMMARY.md - Backup verification

### Pre-Deployment Actions (Phase 4)
- [ ] Verified repository clone
- [ ] Verified coordination system health
- [ ] Checked system resources
- [ ] Tested backend locally

### Ready to Deploy (Phase 5)
- [ ] All above complete
- [ ] Answered YES to all success criteria
- [ ] Ready to open DEPLOYMENT_MASTER_CHECKLIST.md

---

## 🆘 If You Get Stuck

### During Reading
- **Confused about architecture?** Re-read `Portfolio_PRODUCTION_DEPLOYMENT_ARCHITECTURE.md` Section 1
- **Unsure about safety?** Re-read `PORTFOLIO_DEPLOYMENT_REVIEW.md` Critical Issues
- **Lost in documentation?** Come back to this bootstrap guide and use the quick reference

### During Verification
- **Coordination system unhealthy?** STOP. Document issue. Do not proceed.
- **Backend won't start?** Check error messages. Look in `DEVOPS_WORKFLOW_GUIDE.md` troubleshooting section.
- **Ports in use?** Check what's using them: `netstat -tulnp | grep <port>`

### During Deployment
- **Something breaks?** Check `DEPLOYMENT_MASTER_CHECKLIST.md` rollback procedures
- **Coordination system affected?** IMMEDIATELY stop and rollback
- **Stuck on a step?** Re-read that section of the checklist carefully

### Communication
- **Document your issue**: What you tried, error messages, steps to reproduce
- **Check coordination system** is still healthy before reporting
- **Use deployment log**: Write status to `/mnt/lupoportfolio/deployment.log`

---

## ✨ Final Thoughts

**You're about to deploy a production website.** That's exciting and a bit daunting.

**Remember**:
- 📚 The documentation is comprehensive - use it!
- 🛡️ Safety checks exist for a reason - don't skip them
- 🔄 Everything is reversible - you can rollback
- 🤝 You have teammates - you're not alone
- ⏰ Take your time - there's no rush

**Start with reading**, then verification, then deployment. One step at a time.

**You've got this!** 🚀

---

## 📍 Next Step

**Right Now**: If you haven't already, start reading `Portfolio_PRODUCTION_DEPLOYMENT_ARCHITECTURE.md`.

**After Reading**: Complete Phase 4 verification actions above.

**Then**: Open `DEPLOYMENT_MASTER_CHECKLIST.md` and begin Phase 3.

---

**Welcome to the team. Let's deploy this portfolio!**

_— Your teammates and documentation authors_

---

**Last Updated**: 2025-10-14
**Document Version**: 1.0.0
**Maintainer**: Integration Team
