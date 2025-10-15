# Video Support - Deployment Requirements

**Date:** 2025-10-11
**Feature:** Video processing with metadata extraction and thumbnail generation

## Overview

The backend now supports MP4 video files with automatic metadata extraction and thumbnail generation. This feature requires **ffmpeg** and **ffprobe** to be installed in the deployment environment.

## System Requirements

### Required Software

1. **ffmpeg** - For video thumbnail generation
   - Used to extract frames from videos
   - Graceful degradation: If not available, videos are processed with default dimensions and no thumbnails

2. **ffprobe** - For video metadata extraction
   - Used to extract width, height, duration, codec, bitrate, fps
   - Graceful degradation: If not available, videos use fallback metadata (1920x1080, 16:9)

### Installation

#### Docker (Recommended)

Add to your Dockerfile:

```dockerfile
# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*
```

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

#### Alpine Linux

```bash
apk add --no-cache ffmpeg
```

#### macOS

```bash
brew install ffmpeg
```

#### Windows

Download from: https://ffmpeg.org/download.html
Add to PATH

### Verification

Test that ffmpeg and ffprobe are available:

```bash
ffmpeg -version
ffprobe -version
```

## Features

### Video Metadata Extraction

**Supported formats:** MP4 (configurable for future expansion)

**Extracted metadata:**
- Width and height
- Duration (seconds)
- Aspect ratio
- Codec information
- Bitrate
- Frame rate (FPS)

### Thumbnail Generation

**Default behavior:**
- Extracts first frame (timestamp 0s)
- Saves as JPEG in `.thumbnails/` directory
- Filename pattern: `{videoname}_thumb.jpg`

**Future configuration** (via config.json):
```json
{
  "video": {
    "thumbnailTimestamp": 1.5
  }
}
```

### Graceful Degradation

If ffmpeg/ffprobe are not available:

1. **Metadata extraction**: Uses fallback values
   - Width: 1920
   - Height: 1080
   - Aspect ratio: 16:9
   - Duration: 0
   - Codec: "unknown"

2. **Thumbnail generation**: Skipped
   - No error thrown
   - Logged as warning
   - Video still processed and added to database

3. **System continues to function normally**
   - Images process as usual
   - No crashes or failures

## API Response

Videos appear in the same endpoint as images:

**GET /api/content/collections/:slug**

```json
{
  "gallery": [
    {
      "id": "abc123...",
      "filename": "my-video.mp4",
      "title": "My Video",
      "type": "image",  // Still uses "image" type for now
      "urls": {
        "thumbnail": "/path/to/thumbnail.jpg",
        "original": "/path/to/video.mp4"
      },
      "dimensions": {
        "width": 1920,
        "height": 1080,
        "aspectRatio": 1.777...
      },
      "metadata": {
        "duration": 45.5,
        "codec": "h264",
        "fps": 30
      }
    }
  ]
}
```

## Database Storage

Videos are stored in the `images` table (will rename to `media` in future):

- `format`: "mp4"
- `width`, `height`, `aspectRatio`: From ffprobe
- `exif_data`: Contains video-specific metadata (duration, codec, bitrate, fps)
- `thumbnailUrl`: Path to generated thumbnail (or null)

## Logging

**Successful processing:**
```
[INFO] Video processed { path, width, height, duration, thumbnail: 'generated' }
```

**ffmpeg not available:**
```
[WARN] ffmpeg is not available - video thumbnail generation will be skipped
[DEBUG] Skipping video thumbnail generation - ffmpeg not available
```

**ffprobe not available:**
```
[WARN] ffprobe is not available - video metadata extraction will be limited
[DEBUG] Using fallback metadata for video
```

## Testing

### Manual Test

1. Add an MP4 file to a collection directory
2. Trigger scan: `POST /api/admin/scan/{collection} {"mode":"full"}`
3. Check logs for video processing
4. Verify in database: `SELECT * FROM images WHERE format = 'mp4'`
5. Check API response: `GET /api/content/collections/{collection}`

### Check for ffmpeg

On development machine:
```bash
ffmpeg -version
ffprobe -version
```

Expected: Not found (graceful degradation active)

In Docker container (after deployment):
```bash
docker exec -it portfolio-backend ffmpeg -version
docker exec -it portfolio-backend ffprobe -version
```

Expected: Version information displayed

## Future Enhancements

1. **Configurable thumbnail timestamp** - Extract frame at custom time
2. **Multiple video formats** - Add .mov, .webm, .avi support
3. **Video count tracking** - Separate video_count field
4. **Streaming support** - HLS/DASH conversion
5. **Video optimization** - Automatic transcoding to web-friendly formats

## Support

For issues with video processing:

1. Check logs: `src/backend/logs/backend-content.log`
2. Verify ffmpeg: `ffmpeg -version`
3. Test manually: `ffprobe -v error -show_entries stream=width,height "video.mp4"`
4. Check permissions on video files and `.thumbnails/` directories

## Code Files

- **VideoProcessor.ts** - Video processing service
- **ContentScanner.ts** - Integrated video scanning
- Line 752-831: `processVideo()` method
