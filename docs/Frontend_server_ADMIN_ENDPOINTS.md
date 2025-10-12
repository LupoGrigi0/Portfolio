# Admin API Endpoints

This document describes the administrative API endpoints available on both frontend and backend servers.

## Frontend Admin Endpoints

**Base URL**: `http://localhost:3000/api/admin` (development)

### Health Check

**Endpoint**: `GET /api/admin/health`

**Description**: Returns the current health status of the frontend server.

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-02T01:52:33.972Z",
  "uptime": 123.45
}
```

**Example**:
```bash
curl http://localhost:3000/api/admin/health
```

---

### Shutdown Server

**Endpoint**: `POST /api/admin/shutdown`

**Description**: Gracefully shuts down the frontend server after a 1-second delay.

**Security**:
- ✅ Available in **development only**
- ❌ Returns `403 Forbidden` in production

**Response** (Development):
```json
{
  "success": true,
  "message": "Server shutting down in 1 second",
  "timestamp": "2025-10-02T01:52:33.972Z"
}
```

**Response** (Production):
```json
{
  "success": false,
  "error": "Shutdown endpoint is only available in development mode",
  "status": 403
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/admin/shutdown
```

---

### Restart Server

**Endpoint**: `POST /api/admin/restart`

**Description**: Triggers a server restart (works with Next.js dev mode file watcher).

**Security**:
- ✅ Available in **development only**
- ❌ Returns `403 Forbidden` in production

**Response** (Development):
```json
{
  "success": true,
  "message": "Server restarting in 1 second",
  "timestamp": "2025-10-02T01:52:33.972Z",
  "note": "The server will restart automatically if running with a file watcher (e.g., npm run dev)"
}
```

**Response** (Production):
```json
{
  "success": false,
  "error": "Restart endpoint is only available in development mode",
  "status": 403
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/dmin/restart
```

---


---

## Backend Content Endpoints

**Base URL**: `http://localhost:4000/api/content` (development)

### Get All Top-Level Collections

**Endpoint**: `GET /api/content/collections`

**Description**: Returns all top-level collections (directories with no parent). Subcollections are returned as slug strings only.

**Response**:
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "id": "c288891eb6b5df21",
        "name": "Gynoids",
        "slug": "gynoids",
        "heroImage": "/path/to/hero.jpg",
        "hasConfig": true,
        "imageCount": 5,
        "videoCount": 0,
        "subcollections": ["gynoids-bugs", "gynoids-horses"],
        "description": "Collection description",
        "featured": false,
        "tags": [],
        "config": { /* full config.json */ }
      }
    ],
    "total": 8
  }
}
```

**Key Points**:
- Only returns collections where `parent_category IS NULL`
- `subcollections` array contains **slugs only** (not full metadata)
- To get subcollection details, fetch each by slug

**Example**:
```bash
curl http://localhost:4000/api/content/collections
```

---

### Get Collection by Slug

**Endpoint**: `GET /api/content/collections/:slug`

**Description**: Returns detailed information about a specific collection, including its direct subcollections (slugs only).

**Parameters**:
- `:slug` - Collection slug (e.g., "gynoids", "gynoids-bugs", "gynoids-bugs-best")

**Query Parameters**:
- `page` (optional) - Page number for images (default: 1)
- `limit` (optional) - Images per page (default: 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "c288891eb6b5df21",
      "name": "Gynoids",
      "slug": "gynoids",
      "heroImage": "/path/to/hero.jpg",
      "description": "Collection description",
      "imageCount": 155,
      "videoCount": 0,
      "config": { /* full config.json */ },
      "featured": false,
      "tags": ["tag1", "tag2"],
      "gallery": [
        {
          "id": "abc123...",
          "filename": "image.jpg",
          "title": "Image Title",
          "type": "image",
          "urls": {
            "thumbnail": "/path/to/thumb.jpg",
            "original": "/path/to/original.jpg"
          },
          "dimensions": {
            "width": 1920,
            "height": 1080,
            "aspectRatio": 1.777
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 155,
        "totalPages": 8,
        "hasNext": true,
        "hasPrev": false
      },
      "subcollections": ["gynoids-bugs", "gynoids-horses"]
    }
  }
}
```

**Example**:
```bash
# Top-level collection
curl http://localhost:4000/api/content/collections/gynoids

# Subcollection (hierarchical slug)
curl http://localhost:4000/api/content/collections/gynoids-bugs

# Nested subcollection
curl http://localhost:4000/api/content/collections/gynoids-bugs-best
```

---

### Walking the Collection Tree

**Pattern**: To navigate the collection hierarchy, follow this workflow:

1. **Get top-level collections**:
   ```bash
   GET /api/content/collections
   # Returns: ["gynoids", "cafe", "couples", ...]
   ```

2. **Get a collection and its subcollections**:
   ```bash
   GET /api/content/collections/gynoids
   # Returns: { subcollections: ["gynoids-bugs", "gynoids-horses", ...] }
   ```

3. **Get a subcollection and its children**:
   ```bash
   GET /api/content/collections/gynoids-bugs
   # Returns: { subcollections: ["gynoids-bugs-best"] }
   ```

4. **Get a nested subcollection**:
   ```bash
   GET /api/content/collections/gynoids-bugs-best
   # Returns: { subcollections: [] }  // Leaf node
   ```

**Hierarchical Slug Pattern**:
- Top-level: `gynoids`
- Subcollection: `gynoids-bugs` (parent-child)
- Nested: `gynoids-bugs-best` (parent-child-grandchild)

This ensures unique slugs even when multiple collections have subdirectories with the same name (e.g., multiple "Best" folders).

**Example Tree Walking Code**:
```javascript
async function walkCollectionTree(slug, depth = 0) {
  const response = await fetch(`/api/content/collections/${slug}`);
  const { data } = await response.json();
  const { collection } = data;

  console.log('  '.repeat(depth) + collection.name);

  // Recursively walk subcollections
  for (const subSlug of collection.subcollections) {
    await walkCollectionTree(subSlug, depth + 1);
  }
}

// Start from top level
const topLevel = await fetch('/api/content/collections');
const { data } = await topLevel.json();

for (const collection of data.collections) {
  await walkCollectionTree(collection.slug);
}
```

---

## Quick Reference

| Endpoint | Method | Frontend | Backend | Description |
|----------|--------|----------|---------|-------------|
| `/api/admin/health` | GET | ✅ | ✅ | Health check |
| `/api/admin/shutdown` | POST | ✅ (dev only) | ✅ (dev only) | Shutdown server |
| `/api/admin/restart` | POST | ✅ (dev only) | ❓ | Restart server |

---

## Startup Scripts

### Frontend Startup

**Unix/Mac/Linux**:
```bash
D:\Lupo\Source\Portfolio\src\scripts\start-frontend.sh
```

**Windows**:
```bash
D:\Lupo\Source\Portfolio\src\scripts\start-frontend.bat
```

### Backend Startup

**Unix/Mac/Linux**:
```bash
D:\Lupo\Source\Portfolio\src\scripts\start-backend.sh
```

**Windows**:
```bash
D:\Lupo\Source\Portfolio\src\scripts\start-backend.bat
```

---

## Notes

- All admin endpoints are designed for **development/testing only**
- Shutdown and restart endpoints are protected in production environments
- Frontend runs on port **3000** (or next available)
- Backend runs on port **4000**
---

*Documentation created: 2025-10-02*
*Frontend Admin Endpoints by Zara (UI/UX & React Components Specialist)*

Kai's carousel demo: http://localhost:3002/carousel-demo
Kai v3's collections lab: http://localhost:3002/collection-lab
Kai v3's navigation lab: http://localhost:3002/navigation-lab
Kai v3's younger sister's projection demo: http://localhost:3001/projection-demo
Zara's parallax demo: http://localhost:3001/parallax-demo
make sure the backend is running: http://localhost:4000/api/content/collections
o
# fixed backend server endipoints
c
**Restart Server:**
```bash
# Always use shutdown endpoint first
curl -X POST http://localhost:4000/api/admin/shutdown

# Then restart
cd D:/Lupo/Source/Portfolio/worktrees/backend-api/src/backend
npm run dev
```
netstat -ano | findstr :3002
taskkill //F //PID 25768