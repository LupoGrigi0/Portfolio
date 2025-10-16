# Frontend Logger Migration Guide

## Quick Start

**Before (console.log spam):**
```typescript
console.log('[Carousel] Image loaded', imageId);
console.log('[Carousel] Transition complete');
console.error('[Carousel] Failed to load image', error);
```

**After (controlled logging):**
```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('Carousel');

logger.info('Image loaded', { imageId });
logger.debug('Transition complete');
logger.error('Failed to load image', error);
```

---

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Log level: DEBUG | INFO | WARN | ERROR | NONE
NEXT_PUBLIC_LOG_LEVEL=INFO

# Module whitelist (comma-separated) or * for all
NEXT_PUBLIC_LOG_MODULES=*

# Module blacklist (comma-separated)
NEXT_PUBLIC_LOG_EXCLUDE=MidgroundProjection,useCarouselState
```

### Runtime Configuration

```typescript
import { configureLogger, LogLevel } from '@/lib/logger';

// Disable all logs
configureLogger({ level: LogLevel.NONE });

// Enable debug for specific modules
configureLogger({
  level: LogLevel.DEBUG,
  enabledModules: new Set(['Carousel', 'PageRenderer'])
});

// Disable specific noisy modules
configureLogger({
  disabledModules: new Set(['MidgroundProjection'])
});
```

### Convenience Functions

```typescript
import { disableAllLogs, enableDebugFor, disableModules } from '@/lib/logger';

// Quick disable everything
disableAllLogs();

// Debug only carousel and navigation
enableDebugFor('Carousel', 'Navigation');

// Mute noisy modules
disableModules('MidgroundProjection', 'useImagePreloader');
```

---

## Migration Examples

### Example 1: Carousel Component

**Before:**
```typescript
export default function Carousel({ images }: CarouselProps) {
  useEffect(() => {
    console.log('[Carousel] Mounted with', images.length, 'images');
    return () => console.log('[Carousel] Unmounting');
  }, []);

  const handleNext = () => {
    console.log('[Carousel] Next image', currentIndex + 1);
    setCurrentIndex(prev => prev + 1);
  };
}
```

**After:**
```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('Carousel');

export default function Carousel({ images }: CarouselProps) {
  useEffect(() => {
    logger.info('Mounted', { imageCount: images.length });
    return () => logger.debug('Unmounting');
  }, []);

  const handleNext = () => {
    logger.debug('Next image', { nextIndex: currentIndex + 1 });
    setCurrentIndex(prev => prev + 1);
  };
}
```

### Example 2: MidgroundProjection (Noisy Module)

**Before:**
```typescript
useEffect(() => {
  const updateProjection = () => {
    console.log('[MidgroundProjection] Updating', carouselId);
    // ... 67 updates per second at idle ...
  };

  const interval = setInterval(updateProjection, 300);
  return () => clearInterval(interval);
}, []);
```

**After:**
```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('MidgroundProjection');

useEffect(() => {
  const updateProjection = () => {
    logger.debug('Updating projection', { carouselId }); // Only logs if DEBUG enabled for this module
    // ...
  };

  const interval = setInterval(updateProjection, 300);
  return () => clearInterval(interval);
}, []);
```

**Then disable it:**
```typescript
// In app initialization or dev tools
import { disableModules } from '@/lib/logger';
disableModules('MidgroundProjection'); // Silence this module
```

### Example 3: Error Handling

**Before:**
```typescript
try {
  const data = await fetchData();
} catch (error) {
  console.error('[PageRenderer] Failed to fetch', error);
  setError(error.message);
}
```

**After:**
```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('PageRenderer');

try {
  const data = await fetchData();
} catch (error) {
  logger.error('Failed to fetch collection', {
    slug,
    error: error instanceof Error ? error.message : error
  });
  setError(error.message);
}
```

---

## Log Levels Guide

| Level | Use For | Example |
|-------|---------|---------|
| **DEBUG** | Detailed flow, state changes, frequent events | `logger.debug('State updated', { newState })` |
| **INFO** | Important lifecycle events, user actions | `logger.info('Image loaded', { imageId })` |
| **WARN** | Recoverable issues, deprecated usage | `logger.warn('Using fallback', { reason })` |
| **ERROR** | Failures, exceptions, critical issues | `logger.error('API call failed', error)` |

---

## Common Loggers

Pre-configured loggers for common modules:

```typescript
import { commonLoggers } from '@/lib/logger';

commonLoggers.carousel.info('Using pre-configured logger');
commonLoggers.projection.debug('Projection update');
commonLoggers.pageRenderer.error('Failed to render');
commonLoggers.navigation.warn('Deprecated prop used');
commonLoggers.layout.info('Layout changed');
commonLoggers.lightboard.debug('Settings updated');
```

---

## Dev Tools Integration

Add to browser console for runtime control:

```javascript
// Access logger config
window.__logger = require('@/lib/logger');

// Quick commands
window.__logger.disableAllLogs();
window.__logger.enableDebugFor('Carousel');
window.__logger.disableModules('MidgroundProjection');
window.__logger.getLoggerConfig(); // See current config
```

---

## Migration Checklist

### High-Priority Modules (Migrate First)
- [ ] **Carousel** (`components/Carousel/Carousel.tsx`)
- [ ] **MidgroundProjection** (`components/Layout/MidgroundProjection.tsx`)
- [ ] **useCarouselState** (`components/Carousel/hooks/useCarouselState.ts`)
- [ ] **PageRenderer** (`components/PageRenderer/PageRenderer.tsx`)
- [ ] **Navigation** (`components/Navigation/Navigation.tsx`)

### Medium-Priority
- [ ] **useImagePreloader** (frequent logs during load)
- [ ] **DynamicLayout** (carousel mounting logs)
- [ ] **CarouselImageRenderer** (per-image render logs)

### Low-Priority (Migrate as needed)
- [ ] Other components with occasional logging

---

## Performance Benefits

### Before Logger
- Console crashes after 60 seconds (thousands of messages)
- Cannot disable noisy modules
- Difficult to debug specific issues
- Production logs pollute user console

### After Logger
- Console stays clean
- Module-level control
- Debug mode when needed
- Production-ready (NONE level)

---

## Production Configuration

**For production builds:**

```bash
# .env.production
NEXT_PUBLIC_LOG_LEVEL=ERROR  # Only errors in production
NEXT_PUBLIC_LOG_MODULES=*    # All modules (but only ERROR level)
```

Or disable completely:

```bash
NEXT_PUBLIC_LOG_LEVEL=NONE   # No logs in production
```

---

## Future Enhancements

**Backend Logging (Optional):**
```typescript
configureLogger({
  sendToBackend: true,
  backendUrl: 'http://localhost:4000'
});
```

This would require Viktor to add `/api/logs` endpoint for log persistence.

**LogLightboard Integration:**
Add live log viewer in Lightboard for real-time filtering/viewing.

---

**Created by:** Kat (Performance Tactical Controller)
**Date:** October 16, 2025
**Status:** Ready for migration
