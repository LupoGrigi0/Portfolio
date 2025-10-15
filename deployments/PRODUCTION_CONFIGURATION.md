# Production Deployment Configuration

## Overview

This document describes how to configure the Luminous Canvas backend for production deployment on the Digital Ocean droplet.

## Directory Structure

The production server uses the following directory structure:

```
/mnt/lupoportfolio/
├── luminous-canvas/          # Source code (git repo)
├── content/                  # Media files (images, videos)
├── database/                 # SQLite database files
└── logs/                     # Application logs
```

## Configuration Files

The project uses `site-config.json` files to manage environment-specific paths:

- **Development**: `site-config.json` (root of repo)
- **Production**: `site-config.production.json` (root of repo)

### Production Configuration

The production server should use `site-config.production.json`:

```json
{
  "environment": "production",
  "paths": {
    "content": "/mnt/lupoportfolio/content",
    "database": "/mnt/lupoportfolio/database",
    "logs": "/mnt/lupoportfolio/logs",
    "source": "/mnt/lupoportfolio/luminous-canvas"
  },
  "server": {
    "port": 4000,
    "host": "0.0.0.0"
  },
  "content": {
    "imageSizes": "640,750,828,1080,1200,1920,2048,3840",
    "supportedFormats": "jpg,jpeg,jfif,png,webp,avif,gif,tiff,bmp"
  }
}
```

## Deployment Steps

### 1. Create Required Directories

```bash
sudo mkdir -p /mnt/lupoportfolio/{content,database,logs}
sudo chown -R $USER:$USER /mnt/lupoportfolio
```

### 2. Clone Repository

```bash
cd /mnt/lupoportfolio
git clone <repository-url> luminous-canvas
cd luminous-canvas
```

### 3. Copy Production Config

```bash
# The production config is already in the repo
# Just create a symlink for the backend to use
ln -sf $(pwd)/site-config.production.json $(pwd)/site-config.active.json
```

### 4. Install Dependencies

```bash
cd src/backend
npm install
```

### 5. Build TypeScript

```bash
npm run build
```

### 6. Install FFmpeg (Required for Video Processing)

```bash
sudo apt update
sudo apt install -y ffmpeg
```

Verify installation:
```bash
ffmpeg -version
ffprobe -version
```

### 7. Set Environment Variables

Create `/mnt/lupoportfolio/luminous-canvas/.env`:

```bash
NODE_ENV=production
SITE_CONFIG=site-config.active.json
```

### 8. Initialize Database

The database will be created automatically on first run at:
`/mnt/lupoportfolio/database/portfolio.sqlite`

### 9. Start the Server

Using PM2 (recommended for production):

```bash
npm install -g pm2
cd src/backend
pm2 start dist/index.js --name luminous-canvas-backend
pm2 save
pm2 startup
```

Or using systemd:

```bash
sudo cp deployments/luminous-canvas.service /etc/systemd/system/
sudo systemctl enable luminous-canvas
sudo systemctl start luminous-canvas
```

## Configuration Validation

After deployment, verify the configuration:

1. Check server is running:
   ```bash
   curl http://localhost:4000/api/health
   ```

2. Check logs are being written to correct location:
   ```bash
   ls -la /mnt/lupoportfolio/logs/
   ```

3. Check database location:
   ```bash
   ls -la /mnt/lupoportfolio/database/
   ```

4. Check content directory is accessible:
   ```bash
   ls -la /mnt/lupoportfolio/content/
   ```

## Troubleshooting

### Paths Not Working

If the backend can't find directories:
1. Verify `site-config.active.json` symlink exists
2. Check file permissions on all directories
3. Review logs at `/mnt/lupoportfolio/logs/backend-server.log`

### Database Issues

If database initialization fails:
1. Ensure `/mnt/lupoportfolio/database` exists and is writable
2. Check database schema at `src/backend/database/schema.sql`

### Content Not Loading

If media files aren't being served:
1. Verify content directory path in config
2. Check file permissions on content directory
3. Run initial content scan: `curl -X POST http://localhost:4000/api/admin/scan`

## Migration from Old Configuration

If migrating from a version that used hardcoded paths:

1. Pull latest code with site-config support
2. Create production config as described above
3. Move database file: `mv src/backend/data/portfolio.sqlite /mnt/lupoportfolio/database/`
4. Update symlink and restart server

## Notes

- **DO NOT** modify source code for path configuration
- **DO** edit `site-config.production.json` for production-specific settings
- Development and production configs coexist safely in the same repo
- The backend automatically selects the correct config based on `SITE_CONFIG` environment variable
