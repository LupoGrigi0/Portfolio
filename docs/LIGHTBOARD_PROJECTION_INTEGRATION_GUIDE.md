# Lightboard Projection Integration Guide

**For:** Lux (Lightboard Integration Specialist)
**Date:** 2025-10-18
**Author:** Prism (Performance Specialist)
**Status:** Active Development - Lightboard Wiring

---

## Quick Answer to Your Question

> **"Kai mentions connecting to MidgroundProjectionProvider. Where does this live?"**

**Short Answer:** That's outdated! We now use **`ProjectionManagerProvider`** (not MidgroundProjectionProvider).

**Location:** `src/frontend/src/components/Layout/ProjectionManager.tsx`

**Current Status:** Already providing all the state the ProjectionSettingsWidget needs! ✅

---

## Architecture Overview

### The Projection System (How It Works)

```
┌─────────────────────────────────────────────────────────────┐
│                    ProjectionManagerProvider                 │
│  (src/components/Layout/ProjectionManager.tsx)              │
│                                                              │
│  • Manages all projections globally                         │
│  • Provides context API for settings control                │
│  • Handles carousel registration/unregistration             │
│  • Zero-idle-CPU scroll-driven updates                      │
└─────────────────────────────────────────────────────────────┘
                          ↓ provides context
┌─────────────────────────────────────────────────────────────┐
│              useProjectionManager() hook                     │
│                                                              │
│  Used by:                                                    │
│  • PageRenderer (applies collection-level settings)         │
│  • Carousel (via useCarouselProjection hook)                │
│  • Lightboard (YOU! For live preview control)               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Individual Carousels                        │
│                                                              │
│  Each carousel calls:                                        │
│    useCarouselProjection(id, imageUrl, enabled, settings)   │
│                                                              │
│  This registers the carousel with ProjectionManager         │
└─────────────────────────────────────────────────────────────┘
```

---

## How to Wire Up Lightboard for Projection Control

### Step 1: Import the Hook

```typescript
// In your Lightboard component or ProjectionSettingsWidget
import { useProjectionManager } from '@/components/Layout/ProjectionManager';
```

### Step 2: Get the Context

```typescript
function ProjectionSettingsWidget() {
  const projection = useProjectionManager();

  // Now you have access to ALL projection controls!
  // See "Available Controls" section below
}
```

### Step 3: Access Settings and Controls

The `projection` object gives you:

```typescript
interface ProjectionManagerContextType {
  // Active projections (read-only - for display)
  projections: Map<string, CarouselProjection>;

  // Global settings controls (all useCallback - stable references)
  setFadeDistance: (distance: number) => void;
  setMaxBlur: (blur: number) => void;
  setProjectionScaleX: (scale: number) => void;
  setProjectionScaleY: (scale: number) => void;
  setBlendMode: (mode: string) => void;

  // Vignette controls
  setVignetteWidth: (width: number) => void;
  setVignetteStrength: (strength: number) => void;

  // Checkerboard controls
  setCheckerboardEnabled: (enabled: boolean) => void;
  setCheckerboardTileSize: (size: number) => void;
  setCheckerboardScatterSpeed: (speed: number) => void;
  setCheckerboardBlur: (blur: number) => void;

  // Position-aware offset controls (Phase 1)
  setOffsetX: (x: number) => void;
  setOffsetY: (y: number) => void;
  setOffsetAutoPosition: (enabled: boolean) => void;
  setOffsetIntensity: (intensity: number) => void;

  // Swimming motion controls (Phase 2)
  setSwimmingEnabled: (enabled: boolean) => void;
  setSwimmingIntensity: (intensity: number) => void;
  setSwimmingSpeedX: (speed: number) => void;
  setSwimmingSpeedY: (speed: number) => void;
  setSwimmingDampenTime: (time: number) => void;
}
```

---

## How Projections "Attach" to Carousels

### The Metaphor

> **"Is 'attach' the right metaphor?"**

**Answer:** YES! Think of it like this:

- **Carousel** = The source (physical object in DOM)
- **Projection** = The shadow/ghost that follows it
- **Registration** = The "attachment" process

### How It Works

**1. Carousel registers itself:**

```typescript
// Inside a Carousel component
const projectionRef = useCarouselProjection(
  carouselId,          // Unique ID
  imageUrl,            // Image to project
  enableProjection,    // Enable/disable flag
  projectionSettings   // Optional custom settings
);

// The returned ref MUST be attached to the carousel's root div
<div ref={projectionRef} className="carousel-container">
  {/* carousel content */}
</div>
```

**2. ProjectionManager tracks it:**

- When `useCarouselProjection` runs, it calls `registerCarousel()`
- ProjectionManager stores: element ref, image URL, merged settings
- On scroll, ProjectionManager calculates projection position/opacity/blur
- ProjectionLayer renders the projection (separate layer, z-index 0)

**3. The projection follows the carousel:**

- Every scroll event → `updateProjections()` recalculates positions
- Uses `getBoundingClientRect()` to track carousel position
- Projection appears behind carousel, scaled/blurred based on distance from viewport center

---

## Settings Hierarchy (4 Tiers)

Settings merge in this order (later overrides earlier):

```
1. DEFAULT_SETTINGS (hardcoded in ProjectionManager.tsx)
   ↓
2. Global Settings (set via Lightboard or collection config)
   ↓
3. Page/Collection Settings (from config.json projection block)
   ↓
4. Per-Carousel Settings (passed via projectionSettings prop)
```

### Example:

```typescript
// Tier 1: Defaults
const DEFAULT_SETTINGS = {
  fadeDistance: 0.5,
  maxBlur: 4,
  scaleX: 1.2,
  scaleY: 1.2,
  // ... etc
};

// Tier 2: Global (via Lightboard)
projection.setFadeDistance(0.7);  // Overrides default

// Tier 3: Page-level (PageRenderer applies from config.json)
{
  "projection": {
    "fadeDistance": 0.6,  // Overrides global
    "maxBlur": 6
  }
}

// Tier 4: Per-carousel (highest priority)
<Carousel
  images={images}
  enableProjection={true}
  projectionSettings={{
    fadeDistance: 0.8,  // Overrides everything above
    scaleX: 1.5
  }}
/>
```

---

## How to Create Projection Controls in Lightboard

### Example: Slider for Fade Distance

```typescript
function ProjectionSettingsWidget() {
  const projection = useProjectionManager();

  return (
    <div className="lightboard-section">
      <h3>Projection Settings</h3>

      {/* Fade Distance Slider */}
      <label>
        Fade Distance: {/* value display */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          defaultValue="0.5"
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            projection.setFadeDistance(value);
            // Projection updates IMMEDIATELY (live preview!)
          }}
        />
      </label>

      {/* Swimming Motion Toggle */}
      <label>
        <input
          type="checkbox"
          onChange={(e) => {
            projection.setSwimmingEnabled(e.target.checked);
          }}
        />
        Enable Swimming Motion
      </label>

      {/* Swimming Intensity Slider */}
      <label>
        Swimming Intensity:
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          defaultValue="0.5"
          onChange={(e) => {
            projection.setSwimmingIntensity(parseFloat(e.target.value));
          }}
        />
      </label>
    </div>
  );
}
```

### Live Preview

**The magic:** Changes apply IMMEDIATELY! No save button needed (for live preview).

When user moves a slider:
1. `projection.setFadeDistance(0.7)` is called
2. ProjectionManager updates `globalSettings` state
3. Context re-memos (only the settings changed, not projection positions)
4. On next scroll event, projections recalculate with new settings
5. User sees changes in real-time!

---

## Saving Settings to Config

When user is happy with preview and clicks "Save":

### For Collection-Level Settings

Update the collection's `config.json`:

```typescript
async function saveProjectionSettings() {
  const config = {
    // ... existing collection config
    projection: {
      enabled: true,
      fadeDistance: 0.7,
      maxBlur: 6,
      scaleX: 1.5,
      scaleY: 1.5,
      blendMode: 'normal',
      vignette: {
        width: 20,
        strength: 0.8,
      },
      checkerboard: {
        enabled: false,
        tileSize: 30,
      },
      offset: {
        autoPosition: true,
        intensity: 0.3,
      },
      swimming: {
        enabled: true,
        intensity: 0.5,
        speedX: 0.002,
        speedY: 0.003,
        dampenTime: 1000,
      },
    },
  };

  // POST to backend API to update config.json
  await fetch('/api/collections/update-config', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}
```

### For Per-Carousel Settings

If user wants different settings for a specific carousel:

```typescript
// Store in carousel metadata (database or carousel config)
const carouselSettings = {
  carouselId: 'group-2-carousel-3',
  projectionSettings: {
    scaleX: 2.0,
    scaleY: 2.0,
    swimming: {
      enabled: true,
      intensity: 0.8,
    },
  },
};

// Then in Carousel component, pass these settings:
<Carousel
  images={images}
  enableProjection={true}
  projectionSettings={carouselSettings.projectionSettings}
/>
```

---

## What Can Have Projections?

> **"I assume images and other things could have projections attached?"**

**Current Implementation:**

Only **Carousels** have projections right now. The carousel is the "thing" that gets a projection.

**Why carousels?**
- They have a clear DOM element to track
- They have images (the projection source)
- They're dynamic (scroll into/out of view)

**Could other things have projections?**

YES! Absolutely! The system is flexible. You could add projections to:

- **Individual images** (not in a carousel)
- **Video players**
- **Text blocks** (using a background pattern instead of image)
- **Hero sections**
- **Navigation elements**

**How to add projections to other elements:**

Just use the same pattern:

```typescript
// In any component
import { useCarouselProjection } from '@/components/Layout/ProjectionManager';

function MyImageComponent({ imageUrl }: { imageUrl: string }) {
  const projectionRef = useCarouselProjection(
    'my-image-unique-id',  // Unique ID
    imageUrl,              // Image to project
    true,                  // Enabled
    {                      // Custom settings (optional)
      scaleX: 1.5,
      swimming: { enabled: true },
    }
  );

  return (
    <div ref={projectionRef} className="my-image-container">
      <img src={imageUrl} alt="My image" />
    </div>
  );
}
```

**Note:** The hook is called `useCarouselProjection` for historical reasons, but it works for ANY element!

---

## Testing Your Lightboard Integration

### Step 1: Create a Test Control

Add a simple slider to Lightboard:

```typescript
<input
  type="range"
  min="0"
  max="1"
  step="0.1"
  onChange={(e) => projection.setFadeDistance(parseFloat(e.target.value))}
/>
```

### Step 2: Open Lightboard + Collection

1. Navigate to a collection with projections enabled (e.g., `/home`)
2. Open Lightboard
3. Move the slider
4. Watch projections update in real-time!

### Step 3: Verify Settings Apply

- Move slider → Projections should fade at different distances
- Toggle swimming → Projections should start swaying
- Change scale → Projections should grow/shrink

---

## Common Integration Patterns

### Pattern 1: Toggle + Dependent Controls

```typescript
const [swimmingEnabled, setSwimmingEnabled] = useState(false);

return (
  <>
    <input
      type="checkbox"
      checked={swimmingEnabled}
      onChange={(e) => {
        setSwimmingEnabled(e.target.checked);
        projection.setSwimmingEnabled(e.target.checked);
      }}
    />

    {/* Only show intensity slider if swimming is enabled */}
    {swimmingEnabled && (
      <input
        type="range"
        onChange={(e) => projection.setSwimmingIntensity(parseFloat(e.target.value))}
      />
    )}
  </>
);
```

### Pattern 2: Reset to Defaults

```typescript
function resetToDefaults() {
  projection.setFadeDistance(0.5);
  projection.setMaxBlur(4);
  projection.setProjectionScaleX(1.2);
  projection.setProjectionScaleY(1.2);
  projection.setSwimmingEnabled(false);
  // ... etc
}
```

### Pattern 3: Preset Buttons

```typescript
function applySubtlePreset() {
  projection.setFadeDistance(0.6);
  projection.setMaxBlur(3);
  projection.setSwimmingEnabled(true);
  projection.setSwimmingIntensity(0.3);
}

function applyDramaticPreset() {
  projection.setFadeDistance(0.4);
  projection.setMaxBlur(8);
  projection.setSwimmingEnabled(true);
  projection.setSwimmingIntensity(0.8);
}
```

---

## Debugging Tips

### Check if ProjectionManager is Loaded

```typescript
const projection = useProjectionManager();
console.log('Projection context:', projection);
console.log('Active projections:', projection.projections.size);
```

### Enable Debug Logging

In browser console:

```javascript
window.__PRISM_DEBUG = true;
```

Then scroll - you'll see logs like:

```
[ProjectionManager] updateProjections: {
  registeredCarousels: 57,
  carouselIds: ['group-1-0', 'group-1-1', ...],
  scrollVelocity: 2.34
}
```

### Common Issues

**Issue:** "useProjectionManager must be used within ProjectionManagerProvider"

**Fix:** Make sure your component is rendered inside `<ProjectionManagerProvider>` (should be in `layout.tsx`)

**Issue:** Settings change but projections don't update

**Fix:** Projections only update on scroll events. Try scrolling after changing settings.

**Issue:** Can't find ProjectionManagerProvider

**Fix:** It's in `src/frontend/src/components/Layout/ProjectionManager.tsx` - already imported in `layout.tsx`

---

## Reference: Complete Settings Structure

```typescript
interface ProjectionSettings {
  enabled: boolean;

  // Core projection
  fadeDistance: number;      // 0-1: Viewport fraction where fade starts
  maxBlur: number;           // 0-10: Maximum blur in pixels
  scaleX: number;            // 0.5-2.0: Horizontal scale
  scaleY: number;            // 0.5-2.0: Vertical scale
  blendMode: string;         // CSS mix-blend-mode

  // Vignette/mask
  vignette: {
    width: number;           // 0-50: Fade width percentage from edge
    strength: number;        // 0-1: Opacity of fade
  };

  // Checkerboard pattern
  checkerboard: {
    enabled: boolean;
    tileSize: number;        // 10-100: Checker square size in pixels
    scatterSpeed: number;    // 0-1: Animation speed
    blur: number;            // 0-10: Blur for checker edges
  };

  // Position-aware offsets (Phase 1)
  offset: {
    x: number;               // -100 to +100: Manual horizontal offset
    y: number;               // -100 to +100: Manual vertical offset
    autoPosition: boolean;   // Enable position-aware auto-offset
    intensity: number;       // 0-1: Multiplier for auto-offset
  };

  // Swimming motion (Phase 2)
  swimming: {
    enabled: boolean;        // Enable swimming motion
    intensity: number;       // 0-1: Overall amplitude multiplier
    speedX: number;          // 0-1: Horizontal sine wave frequency
    speedY: number;          // 0-1: Vertical sine wave frequency
    dampenTime: number;      // Milliseconds to dampen after scroll stops
  };
}
```

---

## Next Steps for Lux

1. ✅ **Understand the architecture** (you're here!)
2. **Import `useProjectionManager()`** in your Lightboard component
3. **Create sliders/toggles** for each setting you want to expose
4. **Test live preview** - change settings, scroll, watch projections update
5. **Wire up save functionality** - POST updated settings to backend API
6. **Add preset buttons** (optional) - "Subtle", "Dramatic", "Swimming", etc.

---

## Questions? Ask Prism!

I'm here to help! If you run into issues or need clarification:

- Check the source: `src/frontend/src/components/Layout/ProjectionManager.tsx`
- Read the feature docs:
  - `docs/SWIMMING_MOTION_FEATURE.md`
  - `docs/POSITION_AWARE_OFFSETS_FEATURE.md`
  - `docs/Projection_Enhancement_Ideas.md`
- Enable debug mode: `window.__PRISM_DEBUG = true`

**Good luck, Lux!** You've got this! The system is already providing everything you need - just wire up the controls and watch the magic happen! ✨

---

**- Prism (Performance Specialist)**
*"Zero idle CPU, infinite creative possibilities"* 🚀
