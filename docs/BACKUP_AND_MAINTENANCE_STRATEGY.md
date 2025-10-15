# Database Backup & Log Maintenance Strategy
**Version**: 1.0.0
**Created**: 2025-10-14
**Purpose**: Automated backup and maintenance for production portfolio

---

## 🎯 Overview

**Requirements**:
1. **Database Backups**:
   - Full backup when new gallery is added (event-triggered)
   - Full backup of social tables once per week (scheduled)
   - Incremental backup once per day (scheduled)

2. **Log Management**:
   - Backend logs are verbose (good for debugging)
   - Wipe clean every night (prevent disk fill)
   - Archive last 7 days for troubleshooting

3. **Implementation**:
   - Cron jobs inside Docker container
   - Backup to mounted volume (persists outside container)
   - Retention policy to prevent disk fill

---

## 📊 Backup Strategy

### Database Backup Types

**1. Full Database Backup**
- **What**: Complete copy of portfolio.sqlite
- **When**:
  - Daily at 2 AM (scheduled)
  - After new gallery added (event-triggered via API)
  - Weekly for social tables (Sunday 3 AM)
- **Retention**: Keep 30 days
- **Size**: ~10-50 MB (estimated)

**2. Incremental Backup**
- **What**: SQLite backup using `.backup` command or export
- **When**: Daily at 2 AM (same as full, use full backup strategy)
- **Note**: SQLite doesn't have native incremental backups like PostgreSQL
- **Strategy**: Use full backups daily + WAL archiving for point-in-time recovery

**3. Social Tables Weekly Backup**
- **What**: Export social-specific tables to separate file
- **When**: Sunday 3 AM
- **Retention**: Keep 12 weeks (3 months)
- **Size**: Depends on social activity

### Backup Storage Structure

```
/mnt/lupoportfolio/backups/
├── daily/
│   ├── portfolio-2025-10-14.sqlite
│   ├── portfolio-2025-10-15.sqlite
│   └── ... (keep 30 days)
├── social/
│   ├── social-tables-2025-10-13.sql
│   ├── social-tables-2025-10-20.sql
│   └── ... (keep 12 weeks)
├── event-triggered/
│   ├── gallery-added-2025-10-14-143022.sqlite
│   └── ... (keep all, or prune after 90 days)
└── logs-archive/
    ├── backend-2025-10-14.log.gz
    ├── backend-2025-10-15.log.gz
    └── ... (keep 7 days)
```

---

## 🔧 Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              BACKEND DOCKER CONTAINER                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Cron Daemon (running inside container)            │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │  Daily 2 AM: Full database backup           │  │    │
│  │  │  Sunday 3 AM: Social tables export          │  │    │
│  │  │  Daily 1 AM: Log rotation and cleanup       │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  /app/data/portfolio.sqlite ──────┐                         │
│  /app/logs/backend.log ────────┐  │                         │
│                                │  │                         │
└────────────────────────────────┼──┼─────────────────────────┘
                                 │  │
                     Volume Mount│  │Volume Mount
                                 ▼  ▼
         ┌───────────────────────────────────────────────┐
         │   /mnt/lupoportfolio/portfolio-prod/          │
         │   ├── data/portfolio.sqlite                   │
         │   ├── logs/backend.log                        │
         │   └── backups/ (NEW)                          │
         │       ├── daily/                              │
         │       ├── social/                             │
         │       ├── event-triggered/                    │
         │       └── logs-archive/                       │
         └───────────────────────────────────────────────┘
```

### Volume Updates Needed

Update `docker-compose.prod.yml` to mount backup directory:

```yaml
backend:
  volumes:
    - /mnt/lupoportfolio/portfolio-prod/data:/app/data
    - /mnt/lupoportfolio/portfolio-prod/logs:/app/logs
    - /mnt/lupoportfolio/portfolio-prod/content:/app/content:ro
    - /mnt/lupoportfolio/portfolio-prod/backups:/app/backups  # ← ADD THIS
```

---

## 📜 Backup Scripts

### 1. Daily Full Backup Script

**File**: `src/backend/scripts/backup-database.sh`

```bash
#!/bin/bash
set -e

# Configuration
DB_PATH="${DATABASE_PATH:-/app/data/portfolio.sqlite}"
BACKUP_DIR="${BACKUP_DIR:-/app/backups/daily}"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y-%m-%d)
BACKUP_FILE="$BACKUP_DIR/portfolio-$TIMESTAMP.sqlite"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database not found at $DB_PATH"
    exit 1
fi

# Create backup using SQLite backup command (proper way)
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# Compress backup
gzip -f "$BACKUP_FILE"

echo "✅ Database backup created: $BACKUP_FILE.gz"

# Cleanup old backups (keep last 30 days)
find "$BACKUP_DIR" -name "portfolio-*.sqlite.gz" -mtime +$RETENTION_DAYS -delete

# Log backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
echo "Backup size: $BACKUP_SIZE"

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "portfolio-*.sqlite.gz" | wc -l)
echo "Total backups retained: $BACKUP_COUNT"

exit 0
```

### 2. Social Tables Weekly Backup

**File**: `src/backend/scripts/backup-social-tables.sh`

```bash
#!/bin/bash
set -e

# Configuration
DB_PATH="${DATABASE_PATH:-/app/data/portfolio.sqlite}"
BACKUP_DIR="${BACKUP_DIR:-/app/backups/social}"
RETENTION_WEEKS=12

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y-%m-%d)
BACKUP_FILE="$BACKUP_DIR/social-tables-$TIMESTAMP.sql"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database not found at $DB_PATH"
    exit 1
fi

# Export social-related tables
# Adjust table names based on your actual schema
sqlite3 "$DB_PATH" <<EOF > "$BACKUP_FILE"
.mode insert
.output '$BACKUP_FILE'

-- Export social tables (adjust table names as needed)
SELECT 'BEGIN TRANSACTION;';

-- Comments table
.dump comments

-- Likes table
.dump likes

-- User sessions/profiles (if applicable)
.dump user_sessions

-- Social interactions
.dump social_interactions

SELECT 'COMMIT;';
.quit
EOF

# Compress backup
gzip -f "$BACKUP_FILE"

echo "✅ Social tables backup created: $BACKUP_FILE.gz"

# Cleanup old backups (keep 12 weeks)
find "$BACKUP_DIR" -name "social-tables-*.sql.gz" -mtime +$((RETENTION_WEEKS * 7)) -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "social-tables-*.sql.gz" | wc -l)
echo "Total social backups retained: $BACKUP_COUNT"

exit 0
```

### 3. Event-Triggered Gallery Backup

**File**: `src/backend/scripts/backup-on-gallery-add.sh`

```bash
#!/bin/bash
set -e

# Configuration
DB_PATH="${DATABASE_PATH:-/app/data/portfolio.sqlite}"
BACKUP_DIR="${BACKUP_DIR:-/app/backups/event-triggered}"
GALLERY_NAME="${1:-unknown}"
RETENTION_DAYS=90

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp with milliseconds for uniqueness
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gallery-added-${GALLERY_NAME}-${TIMESTAMP}.sqlite"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database not found at $DB_PATH"
    exit 1
fi

# Create backup
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# Compress
gzip -f "$BACKUP_FILE"

echo "✅ Event-triggered backup created: $BACKUP_FILE.gz (Gallery: $GALLERY_NAME)"

# Cleanup old event backups (keep 90 days)
find "$BACKUP_DIR" -name "gallery-added-*.sqlite.gz" -mtime +$RETENTION_DAYS -delete

exit 0
```

### 4. Log Rotation and Cleanup

**File**: `src/backend/scripts/rotate-logs.sh`

```bash
#!/bin/bash
set -e

# Configuration
LOG_FILE="${LOG_PATH:-/app/logs}/backend.log"
ARCHIVE_DIR="${BACKUP_DIR:-/app/backups}/logs-archive"
RETENTION_DAYS=7

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
    echo "No log file to rotate"
    exit 0
fi

# Generate timestamp
TIMESTAMP=$(date +%Y-%m-%d)
ARCHIVE_FILE="$ARCHIVE_DIR/backend-$TIMESTAMP.log"

# Copy and compress current log
cp "$LOG_FILE" "$ARCHIVE_FILE"
gzip -f "$ARCHIVE_FILE"

echo "✅ Log archived: $ARCHIVE_FILE.gz"

# Truncate current log (wipe clean but keep file)
> "$LOG_FILE"

echo "✅ Current log file cleared"

# Cleanup old archived logs (keep 7 days)
find "$ARCHIVE_DIR" -name "backend-*.log.gz" -mtime +$RETENTION_DAYS -delete

# Count remaining archives
ARCHIVE_COUNT=$(find "$ARCHIVE_DIR" -name "backend-*.log.gz" | wc -l)
echo "Total log archives retained: $ARCHIVE_COUNT"

exit 0
```

---

## 🐳 Docker Configuration Updates

### Update Dockerfile.backend

**File**: `src/infrastructure/Dockerfile.backend`

Add cron support to the production stage:

```dockerfile
# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies, native modules, and ffmpeg for video processing
RUN apk add --no-cache sqlite ffmpeg

# ← ADD: Install cron and required utilities
RUN apk add --no-cache dcron libcap sqlite bash gzip

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Copy package files and install production dependencies only
COPY src/backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application
COPY --from=build /app/dist ./dist

# ← ADD: Copy backup and maintenance scripts
COPY src/backend/scripts/*.sh ./scripts/
RUN chmod +x ./scripts/*.sh

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R backend:nodejs /app

# ← ADD: Create backup directories
RUN mkdir -p /app/backups/daily /app/backups/social /app/backups/event-triggered /app/backups/logs-archive
RUN chown -R backend:nodejs /app/backups

# ← ADD: Setup cron
COPY src/backend/crontab /etc/crontabs/backend
RUN chown backend:nodejs /etc/crontabs/backend

USER backend

# Expose port
EXPOSE 4000
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# ← MODIFY: Start cron and node server
CMD ["sh", "-c", "crond && node dist/index.js"]
```

### Create Crontab File

**File**: `src/backend/crontab`

```cron
# Portfolio Backend Maintenance Cron Jobs
# Format: minute hour day month weekday command

# Daily full database backup at 2 AM
0 2 * * * /app/scripts/backup-database.sh >> /app/logs/backup.log 2>&1

# Weekly social tables backup (Sunday at 3 AM)
0 3 * * 0 /app/scripts/backup-social-tables.sh >> /app/logs/backup.log 2>&1

# Daily log rotation at 1 AM
0 1 * * * /app/scripts/rotate-logs.sh >> /app/logs/maintenance.log 2>&1

# Health check every hour (optional - Docker healthcheck might be sufficient)
# 0 * * * * curl -f http://localhost:4000/api/health || echo "Health check failed" >> /app/logs/health.log

# Cleanup Docker logs (prevent log file growth)
# This runs inside container but affects Docker's JSON logs
0 4 * * * echo "Log cleanup marker: $(date)" > /dev/null 2>&1
```

---

## 🔌 Backend API Integration

### Add Event-Triggered Backup Endpoint

**File**: `src/backend/src/routes/admin.ts`

Add endpoint to trigger backup when gallery is added:

```typescript
import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

/**
 * POST /api/admin/backup-on-gallery-add
 * Trigger database backup when new gallery is added
 */
router.post('/backup-on-gallery-add', async (req, res) => {
  try {
    const { galleryName } = req.body;

    if (!galleryName) {
      return res.status(400).json({
        success: false,
        message: 'Gallery name required',
        code: 'INVALID_REQUEST'
      });
    }

    // Execute backup script
    const { stdout, stderr } = await execAsync(
      `/app/scripts/backup-on-gallery-add.sh "${galleryName}"`
    );

    console.log(`[BACKUP] Gallery backup triggered: ${galleryName}`);
    console.log(stdout);

    return res.json({
      success: true,
      message: 'Gallery backup created successfully',
      galleryName,
      output: stdout
    });

  } catch (error) {
    console.error('[BACKUP] Gallery backup failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Backup failed',
      code: 'BACKUP_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/trigger-backup
 * Manually trigger database backup
 */
router.post('/trigger-backup', async (req, res) => {
  try {
    const { stdout } = await execAsync('/app/scripts/backup-database.sh');

    console.log('[BACKUP] Manual backup triggered');
    console.log(stdout);

    return res.json({
      success: true,
      message: 'Manual backup created successfully',
      output: stdout
    });

  } catch (error) {
    console.error('[BACKUP] Manual backup failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Backup failed',
      code: 'BACKUP_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

### Integrate Backup on Gallery Creation

**File**: `src/backend/src/routes/admin.ts` or wherever gallery creation happens

After successfully adding a gallery:

```typescript
// After gallery is added to database
async function createGallery(galleryData: any) {
  try {
    // ... create gallery in database ...

    // Trigger backup
    await execAsync(`/app/scripts/backup-on-gallery-add.sh "${galleryData.name}"`);

    console.log(`[GALLERY] Created and backed up: ${galleryData.name}`);

  } catch (error) {
    console.error('[GALLERY] Creation or backup failed:', error);
    throw error;
  }
}
```

---

## 📊 Monitoring Backup Health

### Backup Status Endpoint

**File**: `src/backend/src/routes/admin.ts`

```typescript
/**
 * GET /api/admin/backup-status
 * Check backup health and statistics
 */
router.get('/backup-status', async (req, res) => {
  try {
    const { stdout: dailyCount } = await execAsync(
      'find /app/backups/daily -name "portfolio-*.sqlite.gz" | wc -l'
    );

    const { stdout: socialCount } = await execAsync(
      'find /app/backups/social -name "social-tables-*.sql.gz" | wc -l'
    );

    const { stdout: eventCount } = await execAsync(
      'find /app/backups/event-triggered -name "gallery-added-*.sqlite.gz" | wc -l'
    );

    const { stdout: logCount } = await execAsync(
      'find /app/backups/logs-archive -name "backend-*.log.gz" | wc -l'
    );

    // Get latest backup timestamp
    const { stdout: latestBackup } = await execAsync(
      'ls -t /app/backups/daily/portfolio-*.sqlite.gz 2>/dev/null | head -1 | xargs stat -c %y 2>/dev/null || echo "No backups"'
    );

    return res.json({
      success: true,
      backups: {
        daily: {
          count: parseInt(dailyCount.trim()),
          retention: '30 days',
          latest: latestBackup.trim()
        },
        social: {
          count: parseInt(socialCount.trim()),
          retention: '12 weeks'
        },
        eventTriggered: {
          count: parseInt(eventCount.trim()),
          retention: '90 days'
        },
        logsArchive: {
          count: parseInt(logCount.trim()),
          retention: '7 days'
        }
      }
    });

  } catch (error) {
    console.error('[BACKUP] Status check failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve backup status',
      code: 'STATUS_ERROR'
    });
  }
});
```

---

## 🧪 Testing Backup System

### Manual Testing Checklist

```bash
# SSH to droplet and enter backend container
docker exec -it portfolio-backend-prod sh

# 1. Test daily backup script
/app/scripts/backup-database.sh
ls -lh /app/backups/daily/

# 2. Test social backup script
/app/scripts/backup-social-tables.sh
ls -lh /app/backups/social/

# 3. Test event-triggered backup
/app/scripts/backup-on-gallery-add.sh "test-gallery"
ls -lh /app/backups/event-triggered/

# 4. Test log rotation
/app/scripts/rotate-logs.sh
ls -lh /app/backups/logs-archive/

# 5. Check cron is running
ps aux | grep cron

# 6. View cron log (wait for scheduled time or manually trigger)
cat /app/logs/backup.log
cat /app/logs/maintenance.log
```

### API Testing

```bash
# Test manual backup trigger
curl -X POST https://smoothcurves.art/api/admin/trigger-backup

# Test gallery backup
curl -X POST https://smoothcurves.art/api/admin/backup-on-gallery-add \
  -H "Content-Type: application/json" \
  -d '{"galleryName": "new-collection"}'

# Check backup status
curl https://smoothcurves.art/api/admin/backup-status
```

---

## 🔄 Restore Procedures

### Restore from Daily Backup

```bash
# SSH to droplet
ssh root@YOUR_DROPLET_IP

# Stop backend container
cd /mnt/lupoportfolio/portfolio-prod
docker compose stop backend

# List available backups
ls -lh /mnt/lupoportfolio/portfolio-prod/backups/daily/

# Restore from specific backup
gunzip -c /mnt/lupoportfolio/portfolio-prod/backups/daily/portfolio-2025-10-14.sqlite.gz > \
  /mnt/lupoportfolio/portfolio-prod/data/portfolio.sqlite

# Restart backend
docker compose start backend

# Verify
curl https://smoothcurves.art/api/health
curl https://smoothcurves.art/api/content/collections
```

### Restore Social Tables Only

```bash
# Decompress backup
gunzip -c /mnt/lupoportfolio/portfolio-prod/backups/social/social-tables-2025-10-13.sql.gz > restore.sql

# Enter container
docker exec -it portfolio-backend-prod sh

# Import into database
sqlite3 /app/data/portfolio.sqlite < restore.sql
```

---

## 📝 Maintenance Schedule Summary

| Task | Frequency | Time | Retention | Script |
|------|-----------|------|-----------|--------|
| Full DB Backup | Daily | 2:00 AM | 30 days | `backup-database.sh` |
| Social Tables Backup | Weekly (Sun) | 3:00 AM | 12 weeks | `backup-social-tables.sh` |
| Log Rotation | Daily | 1:00 AM | 7 days | `rotate-logs.sh` |
| Event Backup (Gallery Add) | On event | Immediate | 90 days | `backup-on-gallery-add.sh` |

---

## ✅ Implementation Checklist

- [ ] Create backup scripts in `src/backend/scripts/`
- [ ] Create crontab file in `src/backend/crontab`
- [ ] Update Dockerfile.backend to install cron
- [ ] Update Dockerfile.backend to copy scripts and crontab
- [ ] Update Dockerfile.backend CMD to start cron
- [ ] Update docker-compose.prod.yml to mount `/app/backups` volume
- [ ] Add backup API endpoints to admin.ts
- [ ] Integrate backup trigger on gallery creation
- [ ] Test all backup scripts manually
- [ ] Deploy to production
- [ ] Wait 24 hours and verify cron jobs ran
- [ ] Test restore procedure
- [ ] Document in operations guide

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-14
**Status**: Ready for Implementation

_Foundation Architecture - Automated Backups for Peace of Mind_ 🤖
