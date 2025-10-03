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

## Backend Admin Endpoints

**Base URL**: `http://localhost:4000/api/admin` (development)

### Health Check

**Endpoint**: `GET /api/admin/health`

**Description**: Returns the current health status of the backend server.

**Example**:
```bash
curl http://localhost:4000/api/admin/health
```

### Shutdown Server

**Endpoint**: `POST /api/admin/shutdown`

**Description**: Gracefully shuts down the backend server (development only).

**Example**:
```bash
curl -X POST http://localhost:4000/api/admin/shutdown
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

Kai's carousel demo: (http://localhost:3002/carousel-demo)
