# Integration Notes - Frontend/Backend Coordination

**Author**: Zara (UI/UX & React Components Specialist)
**Created**: 2025-09-29
**Last Updated**: 2025-09-29

## Content Strategy & File Organization

### Development Sample Content Location
**Primary Location**: `C:\Users\LupoG\Downloads\portfolio-sample-content\`

This directory serves as the central repository for development sample content and should be referenced by all team members during development.

**⚠️ IMPORTANT**: This directory is NOT tracked in git and should never be committed to the repository.

### Sample Content Structure

```
portfolio-sample-content/
├── Branding/                    # Logo, favicon, brand assets
│   ├── GreyWulfTransparentBG.png (recommended for logo)
│   ├── GreyWolfDark.gif (transparent, animation)
│   ├── GreyWulf.jpg
│   └── thumbnail_gray_wolf.jpg
│
├── couples/                     # Sample collection (simple structure)
│   ├── config.json             # Collection configuration
│   ├── Hero-image.jpg          # Page header image
│   └── Gallery/                # Main gallery images
│       └── *.jpg
│
├── Cafe/                        # Sample collection (complex structure)
│   ├── Hero-image.jpg
│   ├── Gallery/                # Main gallery
│   ├── Coffee/                 # Subcollection
│   ├── DarkBeauty/            # Subcollection
│   └── Flowers/               # Subcollection
│
└── mixed-collection/           # Test edge cases
    ├── *.jpg                   # Various aspect ratios
    ├── *.mp4                   # Video files (edge case!)
    └── subdirectories/         # Nested structures
```

### Edge Cases Identified

1. **Subdirectories without standard structure**
   - Some directories lack `Gallery/` folder
   - Some lack `Hero-image.jpg`
   - Some lack `config.json`

2. **Mixed content types**
   - `.jpg` images (standard)
   - `.mp4` video files (needs handling strategy)
   - Various aspect ratios (portrait, landscape, square, panoramic)

3. **Nested collections**
   - Cafe/ has sub-collections (Coffee, DarkBeauty, Flowers)
   - Need to handle hierarchical navigation

4. **Video handling question**
   - Videos should be treated like carousels
   - **Open question**: What background image to use when video scrolls into view?
   - **Zara's recommendation**: Use a default background color or extracted video thumbnail

## Next.js Best Practices & Asset Locations

### Static Assets Structure

```
src/frontend/
├── public/                      # Static assets served by Next.js
│   ├── branding/               # Logo, favicon
│   │   ├── logo.png            # Main logo (from GreyWulfTransparentBG.png)
│   │   ├── logo.svg            # SVG version (if available)
│   │   └── favicon.ico         # Browser favicon
│   │
│   ├── defaults/               # Default/fallback images
│   │   ├── default-hero.jpg    # Default header image
│   │   ├── default-background.jpg
│   │   └── video-placeholder.jpg
│   │
│   └── sample-content/         # DEV ONLY - gitignored
│       └── [symlink to Downloads location]
│
├── src/
│   ├── app/                    # Next.js app directory
│   ├── components/             # React components
│   └── config/                 # App configuration
│       └── content-config.json # Content structure mappings
```

### Gitignore Rules

Add to `.gitignore`:
```
# Sample/dev content - never commit
public/sample-content/
**/sample-content/
C:/Users/*/Downloads/portfolio-sample-content/

# User-uploaded content in production
public/uploads/
public/user-content/
```

## Backend API Requirements for Viktor

### Content Service Endpoints Needed

#### 1. Collection Discovery
```typescript
GET /api/content/collections
Response: {
  collections: [
    {
      id: string,
      name: string,
      slug: string,
      heroImage?: string,
      hasConfig: boolean,
      imageCount: number,
      videoCount: number,
      subcollections?: Collection[]
    }
  ]
}
```

#### 2. Collection Details
```typescript
GET /api/content/collections/:slug
Response: {
  collection: {
    id: string,
    name: string,
    slug: string,
    heroImage?: string,
    config?: CollectionConfig,
    gallery: MediaItem[],
    subcollections?: Collection[]
  }
}

interface MediaItem {
  id: string,
  type: 'image' | 'video',
  filename: string,
  path: string,
  thumbnailPath?: string,  // For videos
  metadata: {
    width: number,
    height: number,
    aspectRatio: number,
    fileSize: number
  }
}
```

#### 3. Media Serving
```typescript
GET /api/media/:collectionSlug/:filename
// Serves actual image/video file
// Handles different sizes/formats based on query params

GET /api/media/:collectionSlug/:filename?size=thumbnail
GET /api/media/:collectionSlug/:filename?size=medium
GET /api/media/:collectionSlug/:filename?format=webp
```

#### 4. Config Management
```typescript
GET /api/content/collections/:slug/config
POST /api/content/collections/:slug/config
// CRUD operations for config.json files
```

### Frontend Consumption Pattern

```typescript
// Frontend will consume like this:
const { collections } = await fetch('/api/content/collections').then(r => r.json());

// For each collection:
const { collection } = await fetch(`/api/content/collections/${slug}`).then(r => r.json());

// Display images using Next.js Image component:
<Image
  src={`/api/media/${collection.slug}/${item.filename}`}
  alt={item.altText}
  width={item.metadata.width}
  height={item.metadata.height}
/>
```

### Video Handling Strategy

**Frontend expectations**:
1. Video files should return a `type: 'video'` in the MediaItem
2. Provide a `thumbnailPath` (extracted first frame or mid-point frame)
3. Frontend will:
   - Display video thumbnail in carousel
   - On click/tap, open video in custom player
   - For background: Use thumbnail or default background color

**Backend responsibilities**:
- Extract video thumbnail on discovery
- Store thumbnails in cache directory
- Serve video files with proper streaming headers
- Generate multiple quality versions for adaptive streaming (future)

## Config.json Schema

### Standard Collection Config

```json
{
  "title": "Collection Title",
  "subtitle": "Optional subtitle",
  "description": "Full description",

  "heroBanner": {
    "enabled": true,
    "image": "Hero-image.jpg",
    "title": "Display Title",
    "subtitle": "Display Subtitle",
    "overlayOpacity": 0.4,
    "textPosition": "center-bottom"
  },

  "layout": {
    "type": "masonry",
    "columns": 3,
    "spacing": "normal",
    "backgroundColor": "rgba(0, 0, 0, 0.3)",
    "backgroundOpacity": 0.8
  },

  "carousels": [
    {
      "title": "Carousel Title",
      "images": ["image1.jpg", "image2.jpg"],
      "transitionType": "fade",
      "autoplaySpeed": 5000
    }
  ],

  "navigation": {
    "menuOrder": 1,
    "urlSlug": "collection-slug",
    "featuredInHome": true,
    "parentCategory": null
  },

  "subcollections": {
    "enabled": true,
    "folders": ["Subcollection1", "Subcollection2"]
  }
}
```

## Edge Case Handling

### Missing config.json
- **Fallback**: Auto-generate basic config from directory structure
- Use folder name as title
- First image as hero (if available)
- All images in root become gallery

### Missing Hero-image.jpg
- **Fallback**: Use first gallery image
- Or use default placeholder from `public/defaults/`

### No Gallery/ folder
- **Fallback**: Treat all images in root directory as gallery
- Recurse into subdirectories (configurable depth)

### Subcollections
- Detect subdirectories with images
- Create nested navigation structure
- Each subcollection can have own config.json

### Videos
- Extract thumbnail (first frame or specified timestamp)
- Display thumbnail in carousel
- Open video player on interaction
- Use thumbnail or default for background transitions

## Team Coordination

### For Viktor (Backend API):
- Implement collection discovery endpoints
- Handle file serving with caching
- Extract video thumbnails
- Provide config CRUD operations
- Document your endpoints in this file!

### For Nova (Integration Specialist):
- Coordinate API contract testing
- Ensure frontend/backend alignment
- Test edge cases with sample content
- Document integration patterns

### For All Frontend Developers:
- Use sample content from Downloads location
- Never commit sample images to git
- Use `/api/media/` endpoints for production
- Handle missing/malformed configs gracefully

## Outstanding Questions

1. **Video background strategy** - What background when video is active?
   - Option A: Use video thumbnail
   - Option B: Default dark gradient
   - Option C: Extract dominant color from thumbnail

2. **Subcollection navigation** - How deep should we recurse?
   - Recommendation: Max 2 levels deep

3. **Performance** - When to implement image optimization?
   - Sharp/next-image optimization
   - CDN integration points

## Next Steps

1. Viktor: Implement initial content discovery API
2. Zara: Create Carousel component briefing document
3. Nova: Design integration test strategy
4. All: Add your notes and findings here!

---

**This document is a living integration guide. Update it as you discover patterns, solutions, and edge cases!**

_Updated by Zara - 2025-09-29_
_Updated by Nova (Integration & System Architecture Specialist) - 2025-09-29_

---

## SYSTEM INTEGRATION ARCHITECTURE

**Author**: Nova (Integration & System Architecture Specialist)
**Created**: 2025-09-29

### Current Development Status

#### Active Worktrees & Branches

```
Portfolio/
├── main branch (5193f93)           # Stable integration point
├── worktrees/
│   ├── frontend-core (6dd59f4)     # Zara - feature/frontend-core
│   ├── backend-api (c214a45)       # Viktor - feature/backend-api
│   ├── integration (7f2d0b1)       # Nova - feature/integration
│   ├── image-processing (7f2d0b1)  # Marcus - feature/image-processing
│   ├── social-features (7f2d0b1)   # Luna - feature/social-features
│   ├── infrastructure (7f2d0b1)    # Aria - feature/infrastructure
│   └── testing (7f2d0b1)           # Sage - feature/testing
```

#### Completed Work (As of 2025-09-29)

**Zara (Frontend - feature/frontend-core)**:
✅ Layout system foundation complete
- Navigation component with scroll-based fade behavior
- Background management system with dynamic transitions
- Grid system with multiple layout variants
- ContentBlock with progressive transparency
- Proper code signing and documentation
- Dev server running on port 3000

**Viktor (Backend - feature/backend-api)**:
✅ Backend API foundation complete
- Express/TypeScript server architecture
- DatabaseManager with SQLite integration
- Content routes (`/api/content/directories`, `/api/content/directories/:slug`, `/api/content/images/:id`)
- Social routes foundation
- WebSocket infrastructure
- Proper logger integration
- Production-ready error handling

### Port Allocations & Service Coordination

#### Development Environment Ports

```
Port 3000  - Frontend (Next.js dev server) - ACTIVE ✅
Port 4000  - Backend API (Express) - Ready to start
Port 6379  - Redis (caching/sessions) - TBD
Port 5432  - PostgreSQL (optional) - TBD
Port 8080  - Nginx (reverse proxy) - Production only
Port 3001  - Frontend (alternative/testing) - Reserved
```

#### Service Dependencies

```
Frontend (3000)
    ↓ HTTP Requests
Backend API (4000)
    ↓
    ├→ SQLite (./data/portfolio.sqlite)
    ├→ Redis (localhost:6379) - TBD
    ├→ File System (sample content)
    └→ Logger (./logs/)
```

### Development Environment Setup

#### Prerequisites

1. **Node.js 20+** (Both frontend and backend use Node)
2. **npm** (Package management)
3. **Git** (Version control and worktrees)
4. **Redis** (Optional for development, required for production)
5. **Sample Content** at `C:\Users\LupoG\Downloads\portfolio-sample-content\`

#### Quick Start - Full Stack Development

```bash
# Terminal 1: Frontend Development Server (Zara's work)
cd D:\Lupo\Source\Portfolio\worktrees\frontend-core\src\frontend
npm run dev
# Runs on http://localhost:3000

# Terminal 2: Backend API Server (Viktor's work)
cd D:\Lupo\Source\Portfolio\worktrees\backend-api\src\backend
npm run dev
# Runs on http://localhost:4000

# Terminal 3: Integration Testing (Nova's work)
cd D:\Lupo\Source\Portfolio\worktrees\integration
# Run integration tests here
```

#### Environment Variables

**Development Strategy**: Use `E:\mnt\lupoportfolio` to mirror production structure

**Frontend (.env.local)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
LOG_PATH=E:/mnt/lupoportfolio/logs
NODE_ENV=development
```

**Backend (.env)**:
```bash
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_PATH=E:/mnt/lupoportfolio/data/portfolio.sqlite
REDIS_URL=redis://localhost:6379
CONTENT_PATH=E:/mnt/lupoportfolio/content
LOG_PATH=E:/mnt/lupoportfolio/logs
NODE_ENV=development
```

**Setup Development Volume Proxy**:
```bash
# Create local structure mirroring Digital Ocean volume
mkdir -p E:\mnt\lupoportfolio\logs
mkdir -p E:\mnt\lupoportfolio\data
mkdir -p E:\mnt\lupoportfolio\content

# Move sample content to unified location
# (Coordinate with Zara for content migration)
```

**Production Volume Mount**: `/mnt/lupoportfolio` (Digital Ocean volume)

### Worktree Integration & Merge Protocol

#### Workflow Philosophy

Each specialist works in their isolated worktree, commits regularly with proper attribution, and coordinates merges through the integration specialist (Nova).

#### Merge Protocol

**Step 1: Pre-Merge Checklist**
```bash
# In your worktree
1. Ensure all tests pass
2. Sign all code with your name
3. Update Integration_Notes.md with your changes
4. Commit and push your feature branch
5. Send message to Nova via coordination system
```

**Step 2: Integration Testing** (Nova's responsibility)
```bash
# In integration worktree
cd D:\Lupo\Source\Portfolio\worktrees\integration

# Pull latest from feature branch
git fetch origin feature/frontend-core
git fetch origin feature/backend-api

# Create integration test branch
git checkout -b integration-test-2025-09-29

# Cherry-pick or merge specific commits
git merge origin/feature/frontend-core --no-ff
git merge origin/feature/backend-api --no-ff

# Run full integration test suite
npm run test:integration

# Test frontend+backend together
npm run dev:all
```

**Step 3: Validation** (Nova validates)
- [ ] Frontend connects to backend successfully
- [ ] API responses match specification
- [ ] No console errors in browser
- [ ] Logger captures all operations
- [ ] Performance targets met (page load <2s)

**Step 4: Merge to Main** (Nova or Phoenix)
```bash
# If integration tests pass
cd D:\Lupo\Source\Portfolio
git checkout main
git merge integration-test-2025-09-29 --no-ff -m "Integrate: Frontend Layout + Backend API"
git push origin main

# Update all worktrees
git worktree list | while read line; do
    worktree=$(echo $line | awk '{print $1}')
    cd $worktree && git pull origin main
done
```

#### Conflict Resolution

- **Code Conflicts**: Integration specialist (Nova) coordinates with affected specialists
- **API Contract Conflicts**: Document in Integration_Notes.md, discuss via coordination system
- **Architectural Conflicts**: Escalate to Foundation Architect (Phoenix)

### Code Signing Standards

**All team members must sign their code:**

```javascript
/**
 * Component/Module Name
 *
 * Description of what this does
 *
 * @author [Your Name] ([Your Role])
 * @created 2025-09-29
 * @updated 2025-09-29
 */
```

**Git Commit Format:**
```
feat(module): Brief description

Detailed description of changes:
- Change 1
- Change 2

Author: [Your Name] ([Your Role])
🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Integration Testing Strategy

#### Unit Tests (Each Specialist)
- Test your own modules in isolation
- Use mocks for external dependencies
- Aim for 80%+ code coverage

#### Integration Tests (Nova)
- Test frontend ↔ backend communication
- Test API contract compliance
- Test error handling and edge cases
- Test performance under load

#### End-to-End Tests (Sage)
- Test complete user workflows
- Test across different browsers/devices
- Test accessibility compliance
- Test production-like environment

### Logging Architecture

#### Logger.js Usage

**Location**: `D:\Lupo\Source\Portfolio\src\logger.js` (project root)

**All team members must use this logger** for debugging and monitoring.

**Frontend Usage** (Zara, Kai, etc.):
```javascript
import { createLogger } from '@/../../src/logger.js';
const logger = createLogger('frontend-carousel.log');

await logger.info('Carousel initialized', { images: imageCount });
await logger.error('Image load failed', { imageId, error });
await logger.debug('Touch event', { x, y, velocity });
```

**Backend Usage** (Viktor, etc.):
```javascript
import { createLogger } from '../utils/logger-wrapper.js';
const logger = createLogger('backend-content.log');

await logger.info('ContentScanner', 'Scanning directory', { path });
await logger.error('DatabaseManager', 'Query failed', { error });
```

#### Log File Organization

**Development** (`E:\mnt\lupoportfolio\logs\`):
```
E:\mnt\lupoportfolio\logs\
├── frontend-carousel.log      # Kai's carousel debugging
├── frontend-layout.log         # Zara's layout components
├── frontend-social.log         # Luna's social features
├── backend-content.log         # Viktor's content API
├── backend-database.log        # Viktor's database operations
├── backend-social.log          # Luna's backend social
└── integration.log             # Nova's integration tests
```

**Production** (`/mnt/lupoportfolio/logs/`):
```
/mnt/lupoportfolio/logs/
├── frontend.log                # Next.js application logs
├── backend.log                 # Express application logs
├── backend-content.log         # Content scanning/serving
├── backend-database.log        # Database operations
├── nginx-access.log            # Nginx access logs
├── nginx-error.log             # Nginx error logs
└── redis.log                   # Redis logs (if needed)
```

#### Viewing Logs During Development

```bash
# Watch all logs in real-time
tail -f E:\mnt\lupoportfolio\logs\*.log

# Watch specific module
tail -f E:\mnt\lupoportfolio\logs\frontend-carousel.log

# Search for errors across all logs
grep -r "ERROR" E:\mnt\lupoportfolio\logs\

# Watch backend and frontend together
tail -f E:\mnt\lupoportfolio\logs\frontend*.log E:\mnt\lupoportfolio\logs\backend*.log
```

#### Log Rotation (Production)

Add to docker-compose.prod.yml:
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### Key Logging Principles

1. **Always use logger.js** - Never use `console.log()` in production code
2. **Name your logs** - Use descriptive names: `createLogger('module-feature.log')`
3. **Include context** - Always pass relevant objects: `logger.info('Action', { userId, itemId })`
4. **Log levels**:
   - `info`: Normal operations (API calls, state changes)
   - `error`: Failures and exceptions
   - `warn`: Potential issues
   - `debug`: Detailed debugging info (verbose)

### Current Integration Gaps & TODOs

#### Frontend → Backend Integration
- [ ] Frontend needs to connect to real backend API (currently using default Next.js pages)
- [ ] Implement API client wrapper for `/api/content/*` endpoints
- [ ] Add error handling for API failures
- [ ] Implement loading states during API calls

#### Backend → Content Integration
- [ ] Backend needs content scanning service implementation
- [ ] Connect DirectoryWatcher to sample content location
- [ ] Implement image optimization pipeline (Sharp integration)
- [ ] Create seed data for development testing

#### Missing Services
- [ ] Redis setup for caching/sessions
- [ ] WebSocket real-time updates implementation
- [ ] Image optimization service
- [ ] Video thumbnail extraction

---

## PRODUCTION DEPLOYMENT ARCHITECTURE

**Author**: Nova (Integration & System Architecture Specialist)

### Deployment Target: Digital Ocean Droplet

#### Infrastructure Design

```
                    ┌─────────────────────┐
                    │   Digital Ocean    │
                    │   Droplet          │
                    │   (Ubuntu 22.04)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Nginx (Port 80)   │
                    │   SSL/TLS Termination│
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                                 │
    ┌─────────▼─────────┐           ┌──────────▼────────┐
    │  Frontend         │           │  Backend API      │
    │  (Next.js)        │           │  (Express)        │
    │  Port 3000        │◄──────────┤  Port 4000        │
    │  (Docker)         │   HTTP    │  (Docker)         │
    └───────────────────┘           └──────────┬────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              │                │                │
                    ┌─────────▼───────┐  ┌─────▼─────┐  ┌──────▼──────┐
                    │ SQLite          │  │  Redis    │  │  File       │
                    │ (Persistent)    │  │  (Cache)  │  │  Storage    │
                    │ /data           │  │  :6379    │  │  /content   │
                    └─────────────────┘  └───────────┘  └─────────────┘
```

#### Docker Compose Production Configuration

**File**: `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./src/frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${FRONTEND_API_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile.prod
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
      - DATABASE_PATH=/mnt/lupoportfolio/data/portfolio.sqlite
      - REDIS_URL=redis://redis:6379
      - CONTENT_PATH=/mnt/lupoportfolio/content
      - LOG_PATH=/mnt/lupoportfolio/logs
    volumes:
      # Mount Digital Ocean volume directly
      - /mnt/lupoportfolio:/mnt/lupoportfolio
    restart: unless-stopped
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  # Redis data uses Docker volume, everything else on /mnt/lupoportfolio
  redis-data:
```

#### Nginx Production Configuration

**File**: `nginx/nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:4000;
    }

    server {
        listen 80;
        server_name portfolio.lupo.art;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name portfolio.lupo.art;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API routes → backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket support
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static assets caching
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|webp)$ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

#### Deployment Checklist

**Pre-Deployment**:
- [ ] All integration tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Backup procedures tested
- [ ] SSL certificates obtained
- [ ] Environment variables configured
- [ ] Content migrated to production storage

**Deployment Steps**:
```bash
# 1. SSH into Digital Ocean droplet
ssh root@portfolio.lupo.art

# 2. Clone repository
git clone https://github.com/lupo/portfolio.git
cd portfolio

# 3. Create production environment file
cp .env.example .env.production
nano .env.production  # Configure production values

# 4. Build and start services
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify all services healthy
docker-compose -f docker-compose.prod.yml ps

# 6. Check logs
docker-compose -f docker-compose.prod.yml logs -f

# 7. Test endpoints
curl https://portfolio.lupo.art/api/health
```

**Post-Deployment**:
- [ ] Monitor application logs
- [ ] Verify frontend accessible
- [ ] Test API endpoints
- [ ] Verify WebSocket connections
- [ ] Check performance metrics
- [ ] Setup automated backups
- [ ] Configure monitoring/alerting

### Continuous Integration & Deployment (Future)

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run integration tests
        run: npm run test:integration

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Digital Ocean
        run: |
          # SSH and deploy logic here
          echo "Deployment script"
```

---

## QUESTIONS & OUTSTANDING ISSUES

### For Lupo:
1. **Domain name confirmation**: Is `portfolio.lupo.art` the correct domain?
2. **SSL certificate**: Do you have SSL certs, or should we use Let's Encrypt?
3. **Content storage**: Where will the 50k+ production images be stored long-term?
4. **Budget constraints**: Any specific hosting budget limitations?

### For Phoenix:
1. **Merge strategy**: Should I handle all merges to main, or coordinate with you?
2. **Production deployment**: Who manages the Digital Ocean droplet initially?
3. **Monitoring**: What monitoring/alerting tools do you prefer?

### For Viktor:
1. **Content scanning**: When will DirectoryWatcher connect to real content?
2. **Redis dependency**: Required for MVP or can we defer?
3. **WebSocket implementation**: Timeline for real-time features?

### For Zara:
1. **API integration**: Ready to connect your components to Viktor's backend?
2. **Error handling**: Need standardized error display components?
3. **Loading states**: Standardized loading/skeleton components needed?

---

**Integration Status**: 🟡 Active Development - Core services operational, integration in progress

_Nova (Integration & System Architecture Specialist)_
_Context: 🟢 Fresh (~95k/200k tokens)_
_Last Updated: 2025-09-29T19:15:00Z_