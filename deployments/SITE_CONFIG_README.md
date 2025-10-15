# Site Configuration System

## Overview

The Luminous Canvas backend uses a flexible configuration system that supports both development and production environments **without modifying source code**. This allows the same codebase to work seamlessly on your local Windows machine and the Digital Ocean production droplet.

## How It Works

### Configuration Files

The project uses JSON configuration files at the root level:

- **`site-config.json`** - Development configuration (Windows paths)
- **`site-config.production.json`** - Production configuration (Linux paths)
- **`site-config.active.json`** - Symlink used in production (points to production config)

### Development Setup (Your Local Machine)

Your development environment uses `site-config.json`:

```json
{
  "environment": "development",
  "paths": {
    "content": "E:/mnt/lupoportfolio/content",
    "database": "./src/backend/data",
    "logs": "./src/backend/logs",
    "source": "."
  },
  "server": {
    "port": 4000,
    "host": "localhost"
  },
  "content": {
    "imageSizes": "640,750,828,1080,1200,1920,2048,3840",
    "supportedFormats": "jpg,jpeg,jfif,png,webp,avif,gif,tiff,bmp"
  }
}
```

No changes needed - the backend automatically uses this file when no other config is specified.

### Production Setup (Digital Ocean Droplet)

Production uses `site-config.production.json` with Linux paths:

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

To activate production config, create a symlink:

```bash
ln -sf site-config.production.json site-config.active.json
```

## Configuration Loader

The backend includes `src/backend/src/utils/config-loader.ts` which:

1. Checks for `SITE_CONFIG` environment variable
2. Falls back to `site-config.active.json` (production symlink)
3. Falls back to `site-config.json` (development default)
4. Resolves relative paths to absolute paths
5. Caches the config for performance

## What Changed in the Backend

### Files Modified

The backend now uses the config loader instead of environment variables:

- `src/backend/src/index.ts` - Uses config for content dir, logs, etc.
- `src/backend/src/services/DatabaseManager.ts` - Uses config for database path
- `src/backend/src/services/DirectoryWatcher.ts` - Uses config for content path
- `src/backend/src/utils/logger-wrapper.ts` - Uses config for log path

### Migration from Environment Variables

**Before:**
```typescript
const contentDir = process.env.CONTENT_DIRECTORY || '../content';
```

**After:**
```typescript
import { loadSiteConfig } from './utils/config-loader.js';
const config = loadSiteConfig();
const contentDir = config.paths.content;
```

## Production Deployment Checklist

When deploying to the Digital Ocean droplet, follow these steps:

### 1. Create Directory Structure

```bash
sudo mkdir -p /mnt/lupoportfolio/{content,database,logs,luminous-canvas}
sudo chown -R $USER:$USER /mnt/lupoportfolio
```

### 2. Clone Repository

```bash
cd /mnt/lupoportfolio
git clone <repo-url> luminous-canvas
cd luminous-canvas
```

### 3. Activate Production Config

```bash
ln -sf site-config.production.json site-config.active.json
```

### 4. Install Dependencies

```bash
cd src/backend
npm install
npm run build
```

### 5. Install FFmpeg

```bash
sudo apt update
sudo apt install -y ffmpeg
```

### 6. Start Server

```bash
pm2 start dist/index.js --name luminous-canvas-backend
pm2 save
```

## Troubleshooting

### Config Not Found

If you see "Site configuration file not found":
- Verify `site-config.json` exists in project root
- Check file permissions
- Ensure you're running from the correct directory

### Wrong Paths Being Used

If the backend uses development paths in production:
- Verify `site-config.active.json` symlink exists
- Check `SITE_CONFIG` environment variable
- Review backend startup logs for config file path

### Database Not Found

If database initialization fails:
- Check `paths.database` in your active config
- Ensure the directory exists and is writable
- Verify path is absolute or correctly resolved from project root

## Benefits of This Approach

1. **No Code Changes**: Same source code works in dev and prod
2. **Easy Configuration**: Just edit JSON files
3. **Version Controlled**: Config files tracked in git
4. **Safe Deployment**: Can't accidentally use dev paths in production
5. **Flexible**: Add new config options without changing code

## Example: Adding a New Path

To add a new configurable path:

1. Add to both config files:
```json
{
  "paths": {
    "content": "...",
    "database": "...",
    "logs": "...",
    "source": "...",
    "uploads": "/path/to/uploads"  // NEW
  }
}
```

2. Use in code:
```typescript
const config = loadSiteConfig();
const uploadsDir = config.paths.uploads;
```

3. Update TypeScript interface in `config-loader.ts`:
```typescript
export interface SiteConfig {
  paths: {
    content: string;
    database: string;
    logs: string;
    source: string;
    uploads: string;  // NEW
  };
  // ...
}
```

That's it! No other changes needed.

## Summary

- **Development**: Uses `site-config.json` automatically
- **Production**: Uses `site-config.active.json` → `site-config.production.json`
- **Both configs** live in the repo safely
- **No code changes** required for deployment
- **Just create symlink** on production server

See `deployments/PRODUCTION_CONFIGURATION.md` for detailed deployment instructions.
