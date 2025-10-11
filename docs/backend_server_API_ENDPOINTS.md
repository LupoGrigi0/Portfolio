# Backend API Endpoints Reference

**Author:** Viktor (Backend API & Database Specialist)
**Last Updated:** 2025-10-01
**Base URL:** `http://localhost:4000`

---

## Table of Contents

1. [Health & Admin](#health--admin)
2. [Content API](#content-api)
3. [Media API](#media-api)
4. [Quick Testing Guide](#quick-testing-guide)

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

## Content API

### GET /api/content/collections
Get all collections (directories).

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
        "tags": ["tag1", "tag2"]
      }
    ],
    "total": 4
  }
}
```

**Test:**
```bash
curl http://localhost:4000/api/content/collections
```

---

### GET /api/content/collections/:slug
Get detailed collection with paginated gallery.

**Path Parameters:**
- `slug` (required): Collection slug (e.g., "couples", "cafe")

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
      ]
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 150,
      "itemsPerPage": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Test:**
```bash
# First page
curl "http://localhost:4000/api/content/collections/couples"
mixed collections.. USE THE SLUG NAME from collections
http://localhost:4000/api/content/collections/mixed-collection

# Page 2 with 25 items
curl "http://localhost:4000/api/content/collections/couples?page=2&limit=25"
```

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

# Get all collections
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

### Test Nested Subdirectories
```bash
# Test nested path support (Phase 4 feature)
curl -I "http://localhost:4000/api/media/couples/gallery/Dancing%20Gynoids/image.jpg?size=large"
```

### Test Different File Types
```bash
# JPG
curl -I "http://localhost:4000/api/media/cafe/Coffee/image.jpg?size=medium"

# GIF
curl -I "http://localhost:4000/api/media/branding/GreyWolfDark.gif?size=thumbnail"

# Video (returns video icon for thumbnails)
curl "http://localhost:4000/api/content/collections/mixed-collection" | jq '.data.collection.gallery[0].urls'
```

---

## Response Format

All API responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
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

**Restart Server:**
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

  Frontend Strategies

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

  Want me to increase the max limit, or is the pagination approach good?

**Lupo** I think for the front end we will do a bit of both, probably do a small load and test what kind of bandwidth we have  
  and then adjust the batch size and how we load images accordingly. For now we are just stress testing the front       
  end, and trying to come up with good designs for the larger galleries. So if you could up the batch size from 50 to   
  100 that would work.  
