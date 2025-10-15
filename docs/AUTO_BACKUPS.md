

  ✅ What's Been Created

  1. Four Backup Scripts (in src/backend/scripts/)

  - backup-database.sh - Daily full database backup (2 AM, 30 day retention)
  - backup-social-tables.sh - Weekly social tables backup (Sunday 3 AM, 12 week retention)
  - backup-on-gallery-add.sh - Event-triggered backup when galleries are added (90 day retention)
  - rotate-logs.sh - Daily log rotation (1 AM) - archives and wipes clean verbose logs (7 day retention)

  2. Cron Configuration (src/backend/crontab)

  - Schedules all automated tasks
  - Logs to /app/logs/backup.log and /app/logs/maintenance.log
  - Runs as non-root user inside container

  3. Updated Dockerfile (src/infrastructure/Dockerfile.backend)

  - Installed cron (dcron) and utilities (bash, gzip, findutils)
  - Copies all backup scripts and makes them executable
  - Creates backup directories structure
  - Modified CMD to start both cron daemon and Node.js server: crond -b && node dist/index.js

  4. Documentation

  - BACKUP_AND_MAINTENANCE_STRATEGY.md - Complete strategy with API endpoints, restore procedures, testing
  - BACKUP_IMPLEMENTATION_SUMMARY.md - Quick reference for what was done and how to use it

  📊 Backup Schedule Summary

  | Task           | When        | Retention | Location                      |
  |----------------|-------------|-----------|-------------------------------|
  | Full DB Backup | Daily 2 AM  | 30 days   | /app/backups/daily/           |
  | Social Tables  | Sunday 3 AM | 12 weeks  | /app/backups/social/          |
  | Log Rotation   | Daily 1 AM  | 7 days    | /app/backups/logs-archive/    |
  | Gallery Events | On creation | 90 days   | /app/backups/event-triggered/ |

  🔧 What You Need to Add

  When Creating docker-compose.prod.yml (Phase 1 of deployment):

  Add this volume mount to the backend service:
  volumes:
    - /mnt/lupoportfolio/portfolio-prod/backups:/app/backups  # ← ADD THIS

  On Droplet (Phase 3):

  sudo mkdir -p /mnt/lupoportfolio/portfolio-prod/backups
  sudo chown -R 1001:1001 /mnt/lupoportfolio/portfolio-prod/backups

  (Optional) API Integration:

  The strategy doc includes full code for API endpoints to:
  - Manually trigger backups: POST /api/admin/trigger-backup
  - Trigger on gallery add: POST /api/admin/backup-on-gallery-add
  - Check backup status: GET /api/admin/backup-status

  🎯 How It Works

  1. Cron daemon starts when container starts (alongside Node.js)
  2. Scripts run automatically according to crontab schedule
  3. Backups save to mounted volume - persist even if container is recreated
  4. Old backups auto-deleted based on retention policies
  5. Verbose logs archived & wiped every night to prevent disk fill