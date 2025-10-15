# Backend API Endpoints Reference

**Author:** Viktor (Backend API & Database Specialist)
**Last Updated:** 2025-10-13
**Base URL:** `http://localhost:4000`

---

## Table of Contents

1. [Health & Admin](#health--admin)
2. [Site Configuration](#site-configuration)
3. [Thumbnail Management](#thumbnail-management)
4. [Content API](#content-api)
5. [Media API](#media-api)
6. [Quick Testing Guide](#quick-testing-guide)

---

## Health & Admin

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-01T12:00:00.000Z",
  "uptime": 12345,
  "database": "connected",
  "contentDirectory": "E:/mnt/lupoportfolio/content"
}
```

**Test:**
```bash
curl http://localhost:4000/api/health
```

---

### POST /api/admin/shutdown
Gracefully shutdown the server.

**Response:**
```json
{
  "success": true,
  "message": "Server shutting down..."
}
```

**Test:**
```bash
curl -X POST http://localhost:4000/api/admin/shutdown
```

**⚠️ Important:** Always use this endpoint to stop the server. Never use `taskkill` or kill processes directly.

---

### POST /api/admin/scan
Trigger manual content directory scan for all collections.

**Response:**
```json
{
  "success": true,
  "message": "Content scan initiated",
  "data": {
    "status": "scanning",
    "startedAt": "2025-10-11T02:45:03.459Z"
  }
}
```

**Test:**
```bash
curl -X POST http://localhost:4000/api/admin/scan -H "Content-Type: application/json"
```

---

### POST /api/admin/scan/:slug
Trigger manual content scan for a specific collection.

**Path Parameters:**
- `slug` (required): Collection slug (e.g., "posted", "scientists")

**Query Parameters:**
- `mode` (optional, default: "incremental"): Scan mode
  - `full` - **Full Rescan**: Purges all database entries for the collection and rebuilds from disk. Use when database is out of sync.
  - `incremental` - **Incremental Scan** (Default): Adds new images, updates changed images, removes orphaned entries (files that no longer exist on disk).
  - `lightweight` - **Lightweight Scan**: Filesystem-only operations, minimal metadata extraction.

**Response:**
```json
{
  "success": true,
  "message": "Content scan initiated for directory: posted (mode: full)",
  "data": {
    "status": "scanning",
    "slug": "posted",
    "mode": "full",
    "startedAt": "2025-10-11T02:45:03.459Z"
  }
}
```

**Performance:**
- **Posted collection** (2,407 images): ~2m 36s for metadata-only scan (Phase 1)
- **Speed**: ~15 images/second
- **Improvement**: ~46x faster than previous implementation

**Examples:**
```bash
# Incremental scan (default) - adds/updates/cleans up
curl -X POST "http://localhost:4000/api/admin/scan/posted" -H "Content-Type: application/json"

# Full rescan - purges and rebuilds database
curl -X POST "http://localhost:4000/api/admin/scan/posted?mode=full" -H "Content-Type: application/json"

# Lightweight scan - minimal metadata
curl -X POST "http://localhost:4000/api/admin/scan/posted?mode=lightweight" -H "Content-Type: application/json"
```

**When to use each mode:**
- **Full**: First-time setup, major filesystem changes, database corruption, or significant discrepancies
- **Incremental**: Regular updates, adding/removing images, daily operations
- **Lightweight**: Quick refresh when only file existence matters

---

### PUT /api/admin/config/:slug
Update config.json for a collection (both filesystem and database).

**Path Parameters:**
- `slug` (required): Collection slug (e.g., "scientists", "couples")

**Request Body:**
JSON object representing the new configuration. All fields are optional but recommended:
```json
{
  "title": "Collection Title",
  "description": "Collection description text",
  "featured": false,
  "tags": ["tag1", "tag2", "tag3"],
  "customField": "Any custom data you want"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Config updated for collection: scientists",
  "data": {
    "slug": "scientists",
    "config": {
      "title": "Scientists",
      "description": "Updated description",
      "featured": false,
      "tags": ["science", "art"]
    },
    "updatedAt": "2025-10-13T00:39:35.368Z",
    "path": "E:\\mnt\\lupoportfolio\\content\\Scientists\\config.json"
  }
}
```

**Behavior:**
- **Dual Write**: Updates both filesystem (`config.json`) and database (directories.config field)
- **Replaces Entirely**: New config completely replaces the old one (does not merge)
- **Creates Files**: If `config.json` doesn't exist, it will be created
- **Pretty Formatted**: Filesystem file is written with 2-space indentation for readability
- **Path Detection**: Automatically determines filesystem directory name from database images

**Use Cases:**
- Visual portfolio editing from frontend
- Bulk config updates via scripts
- Real-time config changes without filesystem access
- Testing different collection settings

**Examples:**
```bash
# Update collection description
curl -X PUT "http://localhost:4000/api/admin/config/scientists" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Scientists",
    "description": "My amazing science art collection",
    "featured": true,
    "tags": ["science", "art", "digital"]
  }'

# Update from file
curl -X PUT "http://localhost:4000/api/admin/config/couples" \
  -H "Content-Type: application/json" \
  -d @couples-config.json

# Toggle featured status
curl -X PUT "http://localhost:4000/api/admin/config/posted" \
  -H "Content-Type: application/json" \
  -d '{"featured": true}'
```

**Alternative: POST Method**
For easier testing, the same endpoint is available via POST:
```bash
curl -X POST "http://localhost:4000/api/admin/config/scientists" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
```

**Error Responses:**
```json
// Collection not found
{
  "success": false,
  "message": "Collection not found: invalid-slug",
  "code": "COLLECTION_NOT_FOUND"
}

// Invalid JSON
{
  "success": false,
  "message": "Config must be a valid JSON object",
  "code": "INVALID_CONFIG"
}

// Database not initialized
{
  "success": false,
  "message": "Database manager not initialized",
  "code": "DB_NOT_INITIALIZED"
}
```

**Important Notes:**
- Config is retrieved via GET `/api/content/collections/:slug` (returns config in response)
- Changes are immediate - no server restart needed
- Both POST and PUT methods work identically
- Config can contain any valid JSON structure (not limited to predefined fields)

---

### POST /api/admin/thumbnails/:slug
Generate thumbnails for a specific collection (Phase 2 - Parallel Generation).

**Path Parameters:**
- `slug` (required): Collection slug (e.g., "posted", "scientists")

**Response:**
```json
{
  "success": true,
  "message": "Thumbnail generation initiated for directory: posted",
  "data": {
    "status": "generating",
    "slug": "posted",
    "startedAt": "2025-10-11T02:45:03.459Z"
  }
}
```

**Process:**
- Generates 3 priority sizes: **1920w** (large), **1200w** (medium), **640w** (thumbnail)
- Uses 5 parallel workers for concurrent processing
- Skips existing thumbnails (idempotent)
- Run this after Phase 1 metadata scan completes

**Test:**
```bash
curl -X POST "http://localhost:4000/api/admin/thumbnails/posted" -H "Content-Type: application/json"
```

---

## Site Configuration

### GET /api/site/config
Fetch site-wide configuration (branding, contact info, social links, SEO).

**Response:**
```json
{
  "success": true,
  "data": {
    "siteName": "Modern Art Portfolio",
    "tagline": "Contemporary Digital Art & Photography",
    "copyright": "© 2025 Artist Name. All rights reserved.",
    "contact": {
      "email": "contact@example.com",
      "phone": "+1-234-567-8900",
      "location": "City, Country"
    },
    "social": [
      {
        "platform": "Instagram",
        "url": "https://instagram.com/username",
        "icon": "instagram"
      },
      {
        "platform": "Twitter",
        "url": "https://twitter.com/username",
        "icon": "twitter"
      }
    ],
    "branding": {
      "logo": "logo.png",
      "logoUrl": "/api/media/branding/logo.png",
      "favicon": "favicon.ico",
      "faviconUrl": "/api/media/branding/favicon.ico",
      "appleTouchIcon": "apple-touch-icon.png",
      "appleTouchIconUrl": "/api/media/branding/apple-touch-icon.png",
      "primaryColor": "#1a1a1a",
      "accentColor": "#ff6b6b"
    },
    "seo": {
      "description": "Portfolio of contemporary digital art and photography",
      "keywords": ["art", "photography", "digital art", "portfolio"]
    }
  }
}
```

**Response (Default Config - when site-config.json doesn't exist):**
```json
{
  "success": true,
  "data": {
    "siteName": "Modern Art Portfolio",
    "tagline": "",
    "copyright": "© 2025 All rights reserved.",
    "contact": {},
    "social": [],
    "branding": {},
    "seo": {
      "description": "Art Portfolio",
      "keywords": []
    }
  },
  "default": true,
  "message": "Using default configuration. Create site-config.json in branding directory to customize."
}
```

**Behavior:**
- **Configuration Location**: Reads from `E:/mnt/lupoportfolio/content/branding/site-config.json`
- **Caching**: Cached in memory for 1 minute (60s TTL)
- **Image URL Resolution**: Automatically converts relative image paths to full media URLs
- **Default Fallback**: Returns sensible defaults if config file doesn't exist
- **No Rate Limiting**: Site config endpoint has no rate limiting for fast page loads

**Use Cases:**
- Load site branding on app initialization
- Display favicon, logo, and site identity
- Show contact information in footer
- Render social media links
- SEO meta tags (description, keywords)

**Configuration File Structure** (`branding/site-config.json`):
```json
{
  "siteName": "Modern Art Portfolio",
  "tagline": "Contemporary Digital Art & Photography",
  "copyright": "© 2025 Artist Name. All rights reserved.",
  "contact": {
    "email": "contact@example.com",
    "phone": "+1-234-567-8900",
    "location": "City, Country"
  },
  "social": [
    {
      "platform": "Instagram",
      "url": "https://instagram.com/username",
      "icon": "instagram"
    }
  ],
  "branding": {
    "logo": "logo.png",
    "favicon": "favicon.ico",
    "appleTouchIcon": "apple-touch-icon.png",
    "primaryColor": "#1a1a1a",
    "accentColor": "#ff6b6b"
  },
  "seo": {
    "description": "Portfolio of contemporary digital art and photography",
    "keywords": ["art", "photography", "digital art", "portfolio"]
  }
}
```

**Test:**
```bash
curl http://localhost:4000/api/site/config
```

---

### PUT /api/site/config
Update site-wide configuration (Development mode only).

**Request Body:**
JSON object representing the new site configuration:
```json
{
  "siteName": "My Art Portfolio",
  "tagline": "Digital Art & Photography",
  "copyright": "© 2025 Artist Name",
  "contact": {
    "email": "artist@example.com"
  },
  "branding": {
    "logo": "my-logo.png",
    "favicon": "my-favicon.ico",
    "primaryColor": "#2a2a2a"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Site configuration updated successfully",
  "data": {
    "config": {
      "siteName": "My Art Portfolio",
      "tagline": "Digital Art & Photography",
      ...
    },
    "updatedAt": "2025-10-13T02:00:00.000Z",
    "path": "E:/mnt/lupoportfolio/content/branding/site-config.json"
  }
}
```

**Behavior:**
- **Development Only**: Only works when `NODE_ENV !== 'production'`
- **File Creation**: Creates `branding/` directory and `site-config.json` if they don't exist
- **Pretty Formatted**: Written with 2-space indentation for readability
- **Cache Invalidation**: Automatically clears in-memory cache after update
- **Flexible Structure**: Accepts any valid JSON structure (not limited to predefined fields)

**Error Responses:**
```json
// Production mode (forbidden)
{
  "success": false,
  "message": "Site config updates only available in development mode",
  "code": "PRODUCTION_MODE"
}

// Invalid JSON
{
  "success": false,
  "message": "Config must be a valid JSON object",
  "code": "INVALID_CONFIG"
}

// Directory creation failed
{
  "success": false,
  "message": "Cannot create branding directory",
  "code": "MKDIR_ERROR",
  "error": {
    "code": "MKDIR_ERROR",
    "message": "EACCES: permission denied",
    "suggestion": "Check directory permissions"
  }
}
```

**Examples:**
```bash
# Update site name and tagline
curl -X PUT "http://localhost:4000/api/site/config" \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "My Art Portfolio",
    "tagline": "Digital Art & Photography"
  }'

# Update from file
curl -X PUT "http://localhost:4000/api/site/config" \
  -H "Content-Type: application/json" \
  -d @site-config.json

# Update social links
curl -X PUT "http://localhost:4000/api/site/config" \
  -H "Content-Type: application/json" \
  -d '{
    "social": [
      {"platform": "Instagram", "url": "https://instagram.com/artist"},
      {"platform": "Twitter", "url": "https://twitter.com/artist"}
    ]
  }'
```

**Alternative: POST Method**
For easier testing, the same endpoint is available via POST:
```bash
curl -X POST "http://localhost:4000/api/site/config" \
  -H "Content-Type: application/json" \
  -d '{"siteName": "Updated Name"}'
```

---

### DELETE /api/site/config/cache
Clear the in-memory site config cache (dev convenience).

**Response:**
```json
{
  "success": true,
  "message": "Site config cache cleared"
}
```

**Use Cases:**
- Force reload of site config after manual file edits
- Development testing of cache behavior
- Debugging configuration issues

**Test:**
```bash
# DELETE method
curl -X DELETE http://localhost:4000/api/site/config/cache

# GET method (dev convenience)
curl http://localhost:4000/api/site/config/cache
```

---

## Thumbnail Management

### POST /api/thumbnails/regenerate/:imageId
Regenerate thumbnails for a single image (diagnostic/fix tool).

**Path Parameters:**
- `imageId` (required): Image ID from database

**Query Parameters:**
- `sizes` (optional): Comma-separated sizes (e.g., "640,1200,1920"). Default: 1920,1200,640
- `force` (optional, default: true): Delete existing thumbnails before regenerating

**Response (Success):**
```json
{
  "success": true,
  "message": "Thumbnails regenerated successfully",
  "data": {
    "imageId": "abc123",
    "filename": "scientist.jpg",
    "originalPath": "E:/mnt/lupoportfolio/content/Scientists/scientist.jpg",
    "thumbnailsGenerated": [
      { "size": "640w", "path": ".../_thumbnails/scientist_640w.webp", "fileSize": 45231 },
      { "size": "1200w", "path": ".../_thumbnails/scientist_1200w.webp", "fileSize": 120450 },
      { "size": "1920w", "path": ".../_thumbnails/scientist_1920w.webp", "fileSize": 245120 }
    ],
    "timeTaken": "1.2s"
  }
}
```

**Response (Error with Full Diagnostics):**
```json
{
  "success": false,
  "message": "Source image file not accessible",
  "code": "SOURCE_FILE_ERROR",
  "error": {
    "code": "SOURCE_FILE_ERROR",
    "message": "ENOENT: no such file or directory",
    "details": {
      "imageId": "abc123",
      "filename": "extremely_long_filename.jpg",
      "originalPath": "E:/mnt/.../extremely_long_filename.jpg",
      "pathLength": 285,
      "fileExists": false,
      "platform": "win32",
      "reason": "Windows MAX_PATH limit (260 characters) exceeded",
      "suggestion": "Path exceeds Windows limit. Rename file/directories to shorten path, or use Linux server."
    },
    "stack": "Error: ENOENT: no such file or directory..."
  }
}
```

**Error Categories:**
- **IMAGE_NOT_FOUND**: Image ID doesn't exist in database
- **NO_IMAGE_PATH**: Image record exists but has no filesystem path
- **SOURCE_FILE_ERROR**: File doesn't exist, path too long, or permission denied
- **MKDIR_ERROR**: Cannot create thumbnail directory (permissions/disk full)
- **SHARP_ERROR**: Image processing failed (corrupted file, unsupported format)
- **DB_UPDATE_ERROR**: Thumbnails generated but database update failed

**Examples:**
```bash
# Regenerate all default sizes for an image
curl -X POST "http://localhost:4000/api/thumbnails/regenerate/abc123imageId"

# Regenerate only specific sizes
curl -X POST "http://localhost:4000/api/thumbnails/regenerate/abc123?sizes=640,1920"

# Keep existing thumbnails, only generate missing ones
curl -X POST "http://localhost:4000/api/thumbnails/regenerate/abc123?force=false"
```

**Use Cases:**
- Fix broken/blank thumbnails identified in diagnostic tools
- Regenerate after image file replacement
- Generate thumbnails for manually added images
- Troubleshoot thumbnail generation issues with full error diagnostics

---

### POST /api/thumbnails/regenerate-collection/:slug
Regenerate thumbnails for all images in a collection (bulk operation).

**Path Parameters:**
- `slug` (required): Collection slug (e.g., "scientists", "posted")

**Query Parameters:**
- `sizes` (optional): Comma-separated sizes (e.g., "640,1200,1920"). Default: 1920,1200,640
- `force` (optional, default: true): Delete existing thumbnails before regenerating
- `workers` (optional, default: 5, max: 10): Number of parallel workers

**Response:**
```json
{
  "success": true,
  "message": "Thumbnail regeneration initiated for 542 images",
  "data": {
    "slug": "scientists",
    "imageCount": 542,
    "sizes": [1920, 1200, 640],
    "workers": 5,
    "startedAt": "2025-10-13T01:00:00.000Z",
    "status": "processing"
  }
}
```

**Behavior:**
- Returns immediately, processes in background
- Progress logged to server logs (backend-thumbnails.log)
- Processes images in parallel batches
- Skips thumbnails larger than original image
- Updates database with new thumbnail paths
- Continues on individual errors, logs failures

**Performance:**
- **5 workers** (default): ~300-600 images/minute
- **10 workers** (max): ~500-1000 images/minute
- **3000 image collection**: Approximately 5-10 minutes with default settings

**Examples:**
```bash
# Regenerate all thumbnails for a collection (default settings)
curl -X POST "http://localhost:4000/api/thumbnails/regenerate-collection/scientists"

# Use 8 parallel workers for faster processing
curl -X POST "http://localhost:4000/api/thumbnails/regenerate-collection/posted?workers=8"

# Regenerate only specific sizes
curl -X POST "http://localhost:4000/api/thumbnails/regenerate-collection/couples?sizes=640,1920"

# Keep existing thumbnails, only generate missing
curl -X POST "http://localhost:4000/api/thumbnails/regenerate-collection/cafe?force=false"
```

**Use Cases:**
- Fix all broken thumbnails in a collection
- Regenerate after bulk image updates
- Change thumbnail sizes for entire collection
- Recover from filesystem issues or accidental deletions

**Monitoring:**
Check server logs for progress:
```bash
tail -f D:/Lupo/Source/Portfolio/worktrees/backend-api/src/backend/logs/backend-thumbnails.log
```

---

## Content API

### GET /api/content/collections
Get all collections (directories) with their subcollections hierarchy.

**Query Parameters:**
- `status` (optional): Filter by status (published, draft, archived)

**Response:**
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "id": "abc123",
        "name": "Couples",
        "slug": "couples",
        "heroImage": "/api/media/couples/Hero-image.jpg",
        "imageCount": 150,
        "videoCount": 0,
        "description": "...",
        "featured": true,
        "tags": ["tag1", "tag2"],
        "subcollections": [
          {
            "id": "sub123",
            "title": "Dancing Gynoids",
            "slug": "dancing-gynoids",
            "description": "Dancing Gynoids subcollection",
            "coverImage": null,
            "imageCount": 25,
            "featured": false,
            "subcollections": []
          }
        ]
      }
    ],
    "total": 4
  }
}
```

### Subcollections:**
- Each collection may have a `subcollections` array containing nested subcollections
- Maximum depth: 4 levels (configurable to prevent infinite recursion)
- Subcollections are fully recursive - each can contain its own subcollections
- Empty array `[]` means no subcollections

**Test:**
```bash
curl http://localhost:4000/api/content/collections
```

---

### GET /api/content/collections/:slug
Get detailed collection with paginated gallery and subcollections.

**Path Parameters:**
- `slug` (required): Collection slug (e.g., "couples", "cafe", "bugs")
  - Can be a top-level collection OR a subcollection slug
  - Each collection/subcollection is accessible via its unique slug

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50, max: 100): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "abc123",
      "name": "Couples",
      "slug": "couples",
      "heroImage": "/api/media/couples/Hero-image.jpg",
      "imageCount": 150,
      "videoCount": 0,
      "description": "...",
      "featured": true,
      "tags": ["tag1", "tag2"],
      "subcollections": [
        {
          "id": "sub123",
          "title": "Dancing Gynoids",
          "slug": "dancing-gynoids",
          "description": "Dancing Gynoids subcollection",
          "coverImage": null,
          "imageCount": 25,
          "featured": false,
          "subcollections": []
        }
      ],
      "gallery": [
        {
          "id": "img123",
          "filename": "image.jpg",
          "title": "Beautiful Image",
          "type": "image",
          "urls": {
            "thumbnail": "/api/media/couples/image.jpg?size=thumbnail",
            "small": "/api/media/couples/image.jpg?size=small",
            "medium": "/api/media/couples/image.jpg?size=medium",
            "large": "/api/media/couples/image.jpg?size=large",
            "original": "/api/media/couples/image.jpg"
          },
          "dimensions": {
            "width": 3840,
            "height": 2160,
            "aspectRatio": 1.7778
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 50,
        "total": 150,
        "totalPages": 3,
        "hasNext": true,
        "hasPrev": false
      }
    }
  }
}
```

**Test:**
```bash
# Top-level collection
curl "http://localhost:4000/api/content/collections/couples"

# Mixed collections - use slug name from /collections
curl "http://localhost:4000/api/content/collections/mixed-collection"

# Subcollection (accessed via its slug)
curl "http://localhost:4000/api/content/collections/bugs"

# Page 2 with 25 items
curl "http://localhost:4000/api/content/collections/couples?page=2&limit=25"
```

---

## Navigating Subcollections

### Tree Structure

The API uses a hierarchical tree structure with subcollections up to 4 levels deep:

```
Collection (Level 0)
├── Subcollection (Level 1)
│   ├── Nested Subcollection (Level 2)
│   │   └── Deeply Nested (Level 3)
│   └── Another Nested (Level 2)
└── Another Subcollection (Level 1)
```

### Navigation Pattern

**Step 1: Get all collections**
```bash
GET /api/content/collections
```
Returns all top-level collections with their subcollections tree.

**Step 2: Navigate to a collection**
```bash
GET /api/content/collections/:slug
```
Returns collection details, gallery, and its immediate subcollections.

**Step 3: Navigate to a subcollection**
```bash
GET /api/content/collections/:subcollection-slug
```
Each subcollection is accessible via its unique slug, just like top-level collections.

### Real Example: Navigating Gynoids Collection

**1. List all collections:**
```bash
curl "http://localhost:4000/api/content/collections"
```
Response includes Gynoids with its 5 subcollections.

**2. View Gynoids collection:**
```bash
curl "http://localhost:4000/api/content/collections/gynoids"
```
Returns:
- Gallery of images in Gynoids
- Subcollections array: `["bugs", "horses", "seahorse", "snakes", "wolves-n-foxes"]`

**3. Navigate to Bugs subcollection:**
```bash
curl "http://localhost:4000/api/content/collections/bugs"
```
Returns:
- Gallery of images in Bugs
- Subcollections array (if Bugs has nested subcollections)

### Frontend Implementation

**Drawer Navigation Pattern:**

```javascript
// 1. Load all collections on mount
const collections = await fetch('/api/content/collections').then(r => r.json());

// 2. Render collection tree in drawer
function renderCollectionTree(collections) {
  collections.forEach(collection => {
    // Render collection button
    // If subcollections.length > 0, add expand/collapse icon
    if (collection.subcollections.length > 0) {
      // Render subcollections recursively
      renderCollectionTree(collection.subcollections);
    }
  });
}

// 3. On collection click, fetch full details
async function selectCollection(slug) {
  const response = await fetch(`/api/content/collections/${slug}`);
  const data = await response.json();

  // Display gallery
  displayGallery(data.data.collection.gallery);

  // Update drawer to show current location
  highlightCurrentCollection(slug);
}
```

### Subcollection Properties

Each subcollection object contains:
- `id`: Unique database ID
- `title`: Display name (e.g., "Dancing Gynoids")
- `slug`: URL-safe identifier (e.g., "dancing-gynoids")
- `description`: Subcollection description
- `coverImage`: Hero image path (or null)
- `imageCount`: Number of images in this subcollection
- `featured`: Boolean flag
- `subcollections`: Array of nested subcollections (may be empty)

### Depth Limiting

- **Maximum depth:** 4 levels (configurable in ContentScanner)
- **Prevents:** Infinite recursion and UI clutter
- **Implementation:** Recursive tree building with depth counter
- **When limit reached:** Returns empty `subcollections: []` array

---

### GET /api/content/collections/:slug/images
Get paginated images for a collection (alias for above).

**Same parameters and response as** `/api/content/collections/:slug`

**Test:**
```bash
curl "http://localhost:4000/api/content/collections/couples/images?page=1&limit=10"
```

---

### GET /api/content/images/:id
Get single image details by ID.

**Path Parameters:**
- `id` (required): Image ID

**Response:**
```json
{
  "success": true,
  "data": {
    "image": {
      "id": "img123",
      "filename": "image.jpg",
      "title": "Beautiful Image",
      "caption": "Optional caption",
      "type": "image",
      "urls": { },
      "dimensions": { },
      "collection": {
        "id": "abc123",
        "slug": "couples",
        "name": "Couples"
      }
    }
  }
}
```

**Test:**
```bash
curl http://localhost:4000/api/content/images/7cc8641a4dfe28879c63c13c2999aacaa44ca1513c45e74ddf28091faf050a63
```

---

## Media API

### GET /api/media/:slug/:path*
Serve actual image/video files with optional thumbnail sizes.

**Path Parameters:**
- `slug` (required): Collection slug
- `path` (required): File path (supports nested subdirectories)

**Query Parameters:**
- `size` (optional): thumbnail | small | medium | large | xlarge | 4k | original (default)

**Size Mappings:**
- `thumbnail` → 640w
- `small` → 828w
- `medium` → 1200w
- `large` → 1920w
- `xlarge` → 2048w
- `4k` → 3840w
- `original` → Full resolution

**Response:** Binary file with appropriate Content-Type and caching headers

**Examples:**
```bash
# Single-level subdirectory
curl -I "http://localhost:4000/api/media/cafe/Coffee/image.jpg?size=medium"

# Nested subdirectory with spaces
curl -I "http://localhost:4000/api/media/couples/gallery/Dancing%20Gynoids/image.jpg?size=large"

# GIF file
curl -I "http://localhost:4000/api/media/branding/GreyWolfDark.gif?size=thumbnail"

# Original size (no query param)
curl -I "http://localhost:4000/api/media/cafe/Hero-image.jpg"
```

---

### GET /api/media/icons/:type
Serve generic SVG icons for file types without thumbnails.

**Path Parameters:**
- `type` (required): Icon type (currently: `video`)

**Response:** SVG image with caching headers

**Test:**
```bash
curl http://localhost:4000/api/media/icons/video
```

---

## Quick Testing Guide

### Test All Endpoints
```bash
# Health check
curl http://localhost:4000/api/health

# Get all collections (with subcollections tree)
curl http://localhost:4000/api/content/collections

# Get specific collection with pagination
curl "http://localhost:4000/api/content/collections/couples?page=1&limit=5"

# Get image details
curl http://localhost:4000/api/content/images/[image-id]

# Serve media file (thumbnail)
curl -I "http://localhost:4000/api/media/cafe/Coffee/image.jpg?size=thumbnail"

# Serve media file (original)
curl -I "http://localhost:4000/api/media/cafe/Hero-image.jpg"

# Video icon
curl -I "http://localhost:4000/api/media/icons/video"

# Trigger content scan
curl -X POST http://localhost:4000/api/admin/scan -H "Content-Type: application/json"

# Shutdown server (use carefully!)
curl -X POST http://localhost:4000/api/admin/shutdown
```




---

## CORS Configuration

Allowed origins:
- `http://localhost:3000` (Frontend dev)
- `http://localhost:3001`
- `http://localhost:3002`
- `http://localhost:3003`

All endpoints support credentials and proper CORS headers.

---

## Caching Headers

**Media files** (`/api/media/*`):
- `Cache-Control: public, max-age=31536000, immutable`
- `ETag` support for conditional requests

**API responses**:
- No caching (dynamic data)

---

## Notes

### Image Counts
- **Fixed**: The `imageCount` field now returns accurate counts after database optimization
- **Posted collection**: 2,407 images indexed (as of 2025-10-11)

### Scanner Performance
- **Two-Phase Architecture**:
  - **Phase 1 (Metadata)**: Fast indexing (~15 images/sec) - makes counts accurate immediately
  - **Phase 2 (Thumbnails)**: Parallel generation with 5 workers - run separately after Phase 1
- **Scan Modes**:
  - `full` - Purges and rebuilds (use for major changes)
  - `incremental` - Smart add/update/cleanup (default, recommended)
  - `lightweight` - Minimal metadata (fastest)

### Windows Development Limitations
- **Long Filename Issue**: Windows MAX_PATH limit (260 characters) prevents access to files with extremely long names
- **Impact**: ~33 files in Posted collection cannot be indexed on Windows (e.g., filenames with 200+ character descriptions)
- **Production Note**: ⚠️ **Verify on Linux deployment** - Linux has much higher path limits (4096 chars) and should handle these files correctly
- **Affected files**: Look for "Input file is missing" errors in logs for files that physically exist but have path length issues

### Video Support
- Videos return generic icon URLs for thumbnails until frame extraction is implemented

### Subdirectories
- Fully supports arbitrary nesting depth (e.g., `couples/gallery/Dancing Gynoids/image.jpg`)

### URL Encoding
- Spaces in paths must be URL-encoded (`%20`)

### Format Support
- Images: JPG, JPEG, JFIF, PNG, GIF, WEBP, AVIF, TIFF, BMP
- Videos: MP4, WEBM

### Metadata Collected
Scanner collects the following metadata for each image:
- **Identity**: filename, path, hash (MD5 of path+size+mtime for fast change detection)
- **Dimensions**: width, height, aspectRatio (requires Sharp to read image headers)
- **File Info**: fileSize, format
- **Timestamps**: birthtime (created), mtime (modified), created_at, updated_at
- **Display**: title (auto-generated from filename), altText
- **Status**: published/draft/archived

---

## Development

**Server Status:**
```bash
# Check if server is running
curl http://localhost:4000/api/health

# View server logs
tail -f D:/Lupo/Source/Portfolio/worktrees/backend-api/src/backend/logs/*.log
```
# Rate Limit Reset Endpoint Added:

  Endpoint: POST /api/admin/reset-rate-limit

  Usage:
## Reset rate limit for your current IP (automatic)
  curl -X POST "http://localhost:4000/api/admin/reset-rate-limit"

  # Reset rate limit for a specific IP
  curl -X POST "http://localhost:4000/api/admin/reset-rate-limit?ip=192.168.1.100"

  Response:
  {
    "success": true,
    "message": "Rate limit reset for IP: ::1",
    "data": {
      "resetAt": "2025-10-11T10:02:23.658Z",
      "ip": "::1"
    }
  }

  Perfect for your use case:
  - Reset when you hit the limit during stress testing
  - Rate limiting stays enabled so you can test UI behavior
  - Can reset specific IPs or your own automatically
# Restart Server:**
```bash
# Always use shutdown endpoint first
curl -X POST http://localhost:4000/api/admin/shutdown

# Then restart
cd D:/Lupo/Source/Portfolio/worktrees/backend-api/src/backend
npm run dev
```
# Requesting all the images in a gallery for large galleries:
Pagination is already implemented. Here's how the frontend should request all 2400+ images from Posted:

  Current Implementation

  Endpoint: GET /api/content/collections/:slug

  Query Parameters:
  - page - Page number (starts at 1)
  - limit - Images per page (default: 20, max: 50)

  Response includes:
  {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 2398,
      "totalPages": 48,
      "hasNext": true,
      "hasPrev": false
    }
  }
# admin endpoints
All admin endpoints now support both POST (proper RESTful) and GET (dev convenience):

  Rate Limiting:
  - GET http://localhost:4000/api/admin/reset-rate-limit ✓

  Database:
  - GET http://localhost:4000/api/admin/reinit-db ✓

  Content Scanning:
  - GET http://localhost:4000/api/admin/scan - Scan all directories
  - GET http://localhost:4000/api/admin/scan/scientists?mode=incremental ✓
  - GET http://localhost:4000/api/admin/scan/:slug?mode=full - Full rescan
  - GET http://localhost:4000/api/admin/scan/:slug?mode=lightweight - Lightweight scan

  Server Control:
  - GET http://localhost:4000/api/admin/shutdown - Shutdown server (dev only)

  You can now simply paste these URLs into your browser for easy testing during development! No    
   need for curl commands or Postman.

  The POST versions still exist and work exactly the same way for proper RESTful API usage. 
# Frontend Strategies

  Option 1: Infinite Scroll (Recommended)

  let page = 1;
  const limit = 50;

  async function loadMoreImages() {
    const response = await fetch(`/api/content/collections/posted?page=${page}&limit=${limit}`);
    const data = await response.json();

    // Append images to gallery
    appendImages(data.data.collection.gallery);

    // Check if more pages exist
    if (data.data.collection.pagination.hasNext) {
      page++;
    }
  }

  // Trigger on scroll or "Load More" button

  Option 2: Load All (Multiple Requests)

  async function loadAllImages(slug) {
    const firstPage = await fetch(`/api/content/collections/${slug}?page=1&limit=50`);
    const firstData = await firstPage.json();

    const totalPages = firstData.data.collection.pagination.totalPages;
    let allImages = [...firstData.data.collection.gallery];

    // Fetch remaining pages in parallel
    const promises = [];
    for (let page = 2; page <= totalPages; page++) {
      promises.push(
        fetch(`/api/content/collections/${slug}?page=${page}&limit=50`)
          .then(r => r.json())
          .then(d => d.data.collection.gallery)
      );
    }

    const results = await Promise.all(promises);
    allImages = allImages.concat(...results);

    return allImages; // All 2400+ images
  }
**viktor**
  If the frontend really needs more images per request, I can increase the max limit from 50 to something higher        
  (e.g., 100 or 200). However, 50 is reasonable for performance:

  - 2398 images ÷ 50 = ~48 requests
  - Or with limit=100: ~24 requests

  My recommendation: Use Option 1 (Infinite Scroll) for better UX and performance. Load images as the user scrolls,     
  rather than loading all 2400 upfront.

# fetching the config.json
the config.json for a collection is part of the collection response. it is the "config" parameter 
http://localhost:4000/api/content/collections/gynoids-bugs-best
returns:
"config":{"title":"Best","description":"Best of Bugs subcollection","featured":false,"tags":
etc. etc.

# starting the server from scratch:
link or copy deployments site-config.json 
from site-config.development or site-config.production
cd down into src/backend
npm run build
npm start

