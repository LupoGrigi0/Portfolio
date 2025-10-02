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
Trigger manual content directory scan.

**Response:**
```json
{
  "success": true,
  "message": "Content scan initiated"
}
```

**Test:**
```bash
curl -X POST http://localhost:4000/api/admin/scan -H "Content-Type: application/json"
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

- **Image Counts:** The `imageCount` field in collections is currently returning `0` or `null` (known issue, pending fix)
- **Video Support:** Videos return generic icon URLs for thumbnails until frame extraction is implemented
- **Subdirectories:** Fully supports arbitrary nesting depth (e.g., `couples/gallery/Dancing Gynoids/image.jpg`)
- **URL Encoding:** Spaces in paths must be URL-encoded (`%20`)
- **Format Support:** JPG, JPEG, PNG, GIF, WEBP, AVIF, MP4, WEBM

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
