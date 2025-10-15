# FFmpeg Production Setup Documentation

**Attention: Novia (DevOps/Deployment Specialist)**

## Production Dockerfile Requirement

The backend server requires **ffmpeg** to process video files (.mp4) for:
- Metadata extraction (width, height, duration, codec, bitrate, fps)
- Thumbnail generation (extract first frame as JPEG)

### Backend Dockerfile Update

Add ffmpeg installation to the backend Dockerfile:

```dockerfile
FROM node:18-alpine

# Install ffmpeg for video processing
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 4000
CMD ["npm", "start"]
```

### Why Alpine + ffmpeg?

- **Small footprint:** Alpine ffmpeg adds only ~50MB to image
- **All-in-one:** No need for separate sidecar container
- **Performance:** Direct access, no Docker exec overhead
- **Simple:** Same architecture for dev (Windows) and prod (Linux)

### Video Processing Flow

1. ContentScanner encounters `.mp4` files during directory scan
2. Calls `VideoProcessor.extractMetadata()` → runs `ffprobe` command
3. Calls `VideoProcessor.generateThumbnail()` → runs `ffmpeg` command
4. Stores video metadata in database `images` table
5. Saves thumbnail to `.thumbnails` subdirectory

### Files Affected

- `src/backend/src/services/VideoProcessor.ts` - Video processing service
- `src/backend/src/services/ContentScanner.ts` - Calls VideoProcessor for .mp4 files (line 540-549)

### Current Status

- **Windows Dev:** ffmpeg installed at `C:\ffmpeg\bin\` and added to PATH
- **Production:** Needs ffmpeg in Docker image (via Dockerfile update above)

### Testing After Deployment

```bash
# SSH into production container
docker exec -it backend-container sh

# Verify ffmpeg is available
ffmpeg -version
ffprobe -version

# Check backend logs for confirmation
docker logs backend-container | grep "ffmpeg is available"
```

### Current Video Inventory

- **14 videos** in `mixed-collection` directory currently NOT tracked in database
- Once ffmpeg is available and server restarts, these will be picked up on next scan

---

**Questions?** Contact Viktor (Backend API Specialist) via the team chat.

**Priority:** Medium - Required before production deployment, not blocking current development.
