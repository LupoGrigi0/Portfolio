# Keyboard Manager Integration Guide

## Problem Solved

**Before:** Every carousel adds its own `window.addEventListener('keydown')` listener.
- 20 carousels = 20 duplicate handlers
- All fire for every key press
- Performance penalty + unnecessary processing

**After:** Single keyboard manager delegates to active carousel.
- 1 handler total
- Smart focusing (clicked carousel or centered carousel)
- Fullscreen mode handled automatically

---

## Step 1: Add to Root Layout

**File:** `src/frontend/src/app/layout.tsx`

```tsx
import { KeyboardManager } from '@/components/KeyboardManager';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <KeyboardManager>
          {/* All your existing providers */}
          <MidgroundProjectionProvider>
            <LightboardProvider>
              {children}
            </LightboardProvider>
          </MidgroundProjectionProvider>
        </KeyboardManager>
      </body>
    </html>
  );
}
```

**✅ Done:** Keyboard manager is now active site-wide.

---

## Step 2: Update Carousel Component

### Remove Old Keyboard Listener

**File:** `src/frontend/src/components/Carousel/hooks/useCarouselState.ts`

**Delete lines 324-356:**
```typescript
// DELETE THIS ENTIRE BLOCK:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        // ...
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [next, previous, toggleFullscreen, toggleAutoplay, state.isFullscreen, fullscreenMode]);
```

### Add Keyboard Registration

**File:** `src/frontend/src/components/Carousel/Carousel.tsx`

**Import:**
```tsx
import { useKeyboardRegistration } from '@/components/KeyboardManager';
```

**Register handlers:**
```tsx
export default function Carousel({
  images,
  // ... other props
}: CarouselProps) {
  const [state, controls] = useCarouselState({...});

  // OLD: const carouselRef = useCarouselProjection(...);

  // NEW: Register with keyboard manager
  const carouselRef = useKeyboardRegistration(
    projectionId || `carousel-${images[0]?.id || 'default'}`,
    {
      onPrevious: controls.previous,
      onNext: controls.next,
      onToggleAutoplay: autoplaySpeed > 0 ? controls.toggleAutoplay : undefined,
      onToggleFullscreen: enableFullscreen ? controls.toggleFullscreen : undefined,
      isFullscreen: state.isFullscreen
    }
  );

  // Rest of component...
  return (
    <div ref={carouselRef} ...>
      {/* Carousel content */}
    </div>
  );
}
```

**Note:** If you're also using `useCarouselProjection`, you'll need both refs. See "Combining with Projection" below.

---

## Step 3: Combining with Projection (If Enabled)

If projection is enabled, you need both refs:

```tsx
// Projection ref
const projectionRef = useCarouselProjection(
  projectionId || `carousel-${images[0]?.id || 'default'}`,
  enableProjection && images[0] ? images[0].src : null,
  enableProjection
);

// Keyboard ref
const keyboardRef = useKeyboardRegistration(
  projectionId || `carousel-${images[0]?.id || 'default'}`,
  {
    onPrevious: controls.previous,
    onNext: controls.next,
    onToggleAutoplay: autoplaySpeed > 0 ? controls.toggleAutoplay : undefined,
    onToggleFullscreen: enableFullscreen ? controls.toggleFullscreen : undefined,
    isFullscreen: state.isFullscreen
  }
);

// Combine refs (React ref callback)
const combinedRef = useCallback((element: HTMLDivElement | null) => {
  // Set both refs
  if (projectionRef && 'current' in projectionRef) {
    projectionRef.current = element;
  }
  if (keyboardRef && 'current' in keyboardRef) {
    keyboardRef.current = element;
  }
}, [projectionRef, keyboardRef]);

return (
  <div ref={combinedRef} ...>
    {/* Carousel content */}
  </div>
);
```

**Or use a ref utility:**
```tsx
import { mergeRefs } from '@/lib/ref-utils'; // If you have one

<div ref={mergeRefs(projectionRef, keyboardRef)} ...>
```

---

## How It Works

### Focus Priority

The keyboard manager determines the active carousel using this priority:

1. **Focused carousel** (user clicked/hovered)
2. **Fullscreen carousel** (any carousel in fullscreen)
3. **Centered carousel** (closest to viewport center)

### Auto-Focus

Carousels automatically become focused when:
- User clicks on the carousel
- User hovers over the carousel (optional, enabled by default)

### Keyboard Shortcuts

| Key | Action | Condition |
|-----|--------|-----------|
| `←` | Previous image | Always |
| `→` | Next image | Always |
| `Space` | Toggle autoplay | If autoplay enabled |
| `Esc` | Exit fullscreen | If in fullscreen |

---

## Testing

### Before Integration
```bash
# In browser console
window.addEventListener('keydown', () => console.log('Key pressed'));
# Press arrow → See 20+ "Key pressed" logs (one per carousel)
```

### After Integration
```bash
# In browser console
window.addEventListener('keydown', () => console.log('Key pressed'));
# Press arrow → See 2 logs: 1 from your test, 1 from keyboard manager
```

**Verify:**
1. Open page with multiple carousels
2. Click a carousel → Arrow keys control THAT carousel
3. Scroll page → Arrow keys control carousel nearest center
4. Enter fullscreen → Arrow keys control fullscreen carousel

---

## Debugging

Enable keyboard manager logs:

```typescript
import { enableDebugFor } from '@/lib/logger';

// Enable debug logging for keyboard manager
enableDebugFor('KeyboardManager');
```

You'll see:
```
DEBUG [KeyboardManager] Registering carousel carousel-abc123
DEBUG [KeyboardManager] Focus changed { from: null, to: 'carousel-abc123' }
DEBUG [KeyboardManager] Arrow Right → Next { carouselId: 'carousel-abc123' }
```

---

## Migration Checklist

### For Kat-Carousel (when you wake up):

- [ ] **Add KeyboardManager to layout.tsx** (Step 1)
- [ ] **Remove old keyboard listener from useCarouselState.ts** (lines 324-356)
- [ ] **Add useKeyboardRegistration to Carousel.tsx**
- [ ] **Handle ref combining** (if using projection)
- [ ] **Test with multiple carousels** (20+ on page)
- [ ] **Test fullscreen mode**
- [ ] **Test click-to-focus behavior**
- [ ] **Test scroll-to-center behavior**
- [ ] **Verify only 1 keyboard listener exists** (check DevTools)

### Verification Commands

```bash
# Check for old listeners (should find NONE after migration)
grep -r "addEventListener.*keydown" src/frontend/src/components/Carousel/

# Verify keyboard manager is imported in layout
grep "KeyboardManager" src/frontend/src/app/layout.tsx
```

---

## Performance Impact

### Before
- **20 carousels** = 20 event listeners
- **Every key press** = 20 function calls
- **Memory** = 20 listener registrations

### After
- **20 carousels** = 1 event listener
- **Every key press** = 1 function call + quick map lookup
- **Memory** = 1 listener + Map of carousel refs

**Estimated savings:** ~95% reduction in keyboard event processing.

---

## Future Enhancements

### Custom Key Bindings
```tsx
useKeyboardRegistration(carouselId, {
  onPrevious: controls.previous,
  onNext: controls.next,
  customBindings: {
    'j': controls.previous,
    'k': controls.next,
    'f': controls.toggleFullscreen
  }
});
```

### Configurable Focus Behavior
```tsx
<KeyboardManager focusMode="click-only" | "hover" | "viewport-center">
```

---

**Created by:** Kat (Performance Tactical Controller)
**Date:** October 16, 2025
**For:** Kat-Carousel integration
**Status:** Ready for use
