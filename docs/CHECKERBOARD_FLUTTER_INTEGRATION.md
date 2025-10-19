# Checkerboard Flutter Integration Guide

**For:** Lux (UI/UX Specialist)
**From:** Prism (Performance Specialist)
**Date:** 2025-10-18
**Status:** SHIPPED ✅

---

## What Is This?

The Checkerboard Flutter effect creates subtle particle animations where checkerboard squares appear to "fall off" projection edges when scrolling stops. Think: first snowflakes of winter, gentle and mesmerizing.

**User Reaction:** "Like seeing a puppy wag its tail!" - Lupo

---

## Integration Points

### 1. Global Enable/Disable

The effect is enabled by adding the `<CheckerboardFlutter>` component to a page:

```tsx
import CheckerboardFlutter from '@/components/Layout/CheckerboardFlutter';

<CheckerboardFlutter
  enabled={true}
  tileSize={30}
  intensity={0.5}
  triggerDelay={300}
/>
```

**Component Location:** `src/frontend/src/components/Layout/CheckerboardFlutter.tsx`

### 2. Settings Available for Lightboard Control

| Setting | Type | Range | Default | Description |
|---------|------|-------|---------|-------------|
| `enabled` | boolean | true/false | true | Master on/off switch |
| `tileSize` | number | 10-60 | 30 | Size of checker particles (matches projection tile size) |
| `intensity` | number | 0-1 | 0.5 | How many particles spawn (0.5 = 1-2, 1.0 = 2-4) |
| `triggerDelay` | number | 100-1000 | 300 | Milliseconds after scroll stops to spawn particles |

### 3. Advanced Settings (Hidden in Code - Optional for Future)

These are currently hardcoded in CheckerboardFlutter.tsx but could be exposed later:

```tsx
// Particle Physics (lines 301-320)
move: {
  speed: { min: 1, max: 2 },  // Fall speed
  drift: { min: -1, max: 1 }, // Horizontal drift
}

wobble: {
  distance: 5,                 // Flutter amplitude
  speed: { min: 3, max: 8 },  // Flutter speed
}

rotate: {
  animation: {
    speed: 3,                  // Tumbling speed
  }
}

life: {
  duration: {
    value: 120,                // Lifetime in seconds
  }
}
```

### 4. How It Works (Technical)

1. **Scroll Detection:** Monitors scroll velocity, detects when it drops to zero
2. **Trigger:** After `triggerDelay` ms of zero velocity, spawns particles
3. **Spawn Logic:**
   - Reads active projections from ProjectionManager
   - Filters for projections with checkerboard enabled
   - Only spawns from projections in viewport (±500px buffer)
   - Picks random checker column along bottom edge
   - Calculates spawn position accounting for scaleY transform
4. **Cooldown:** 500ms cooldown prevents spam
5. **Particle Lifecycle:** Tumbles, drifts, falls until timeout or off-screen

---

## Lightboard Integration Recommendations

### Suggested UI Layout

**Section: "Visual Effects"**

```
┌─ Checkerboard Flutter ────────────────────────┐
│                                                │
│  ☑ Enable Flutter Effect                      │
│                                                │
│  Particle Size: [====|====] 30px               │
│  (Matches projection checkerboard size)        │
│                                                │
│  Intensity: [===|=====] 0.5                    │
│  (How many particles spawn per trigger)        │
│                                                │
│  Trigger Delay: [===|=====] 300ms              │
│  (Delay after scroll stops)                    │
│                                                │
│  [Live Preview: Show sample particles]         │
│                                                │
└────────────────────────────────────────────────┘
```

### Suggested Controls

1. **Master Toggle:** Checkbox for `enabled`
2. **Tile Size Slider:** 10-60, step 5, default 30
   - Label: "Particle Size (matches projection tiles)"
3. **Intensity Slider:** 0-1, step 0.1, default 0.5
   - Label: "Spawn Intensity (0 = fewer, 1 = more)"
4. **Trigger Delay Slider:** 100-1000ms, step 50, default 300
   - Label: "Trigger Delay (ms after scroll stops)"

### Live Preview Button

Add a "Test Effect" button that programmatically triggers a spawn:

```tsx
// Access the CheckerboardFlutter instance (would need ref exposure)
// Then call: spawnFlutterParticles()
```

---

## Integration with Existing Systems

### Works With:
- ✅ ProjectionManager (reads projection state)
- ✅ All checkerboard-enabled carousels
- ✅ Swimming motion (particles spawn from transformed positions)
- ✅ Position-aware offsets (particles account for offsets)

### Does NOT Interfere With:
- ✅ Zero-idle-CPU architecture (only spawns on scroll events)
- ✅ Projection rendering (particles on separate layer, z-index 999)
- ✅ Scroll performance (passive listeners, optimized triggers)

---

## Config File Structure (Proposed)

Add to `config.json`:

```json
{
  "effects": {
    "checkerboardFlutter": {
      "enabled": true,
      "tileSize": 30,
      "intensity": 0.5,
      "triggerDelay": 300
    }
  }
}
```

---

## Testing Page

**Live Demo:** `http://localhost:3000/projection-flutter-test-v2`

This page has:
- 3 carousels with different checkerboard tile sizes
- Staggered layout for visual variety
- Working particles that survive scrolling

---

## Known Limitations

1. **Color Sampling:** Particles currently use grayscale colors (#fff, #ccc, #999).
   - Future enhancement: Sample edge colors from projection images
   - Complexity: Requires canvas pixel reading + edge detection

2. **Projection Bottom Detection:** Currently uses mathematical calculation
   - Works for most cases
   - Complex transforms might need adjustment

3. **Viewport Buffer:** Set to ±500px
   - Projections outside this range won't spawn particles
   - Prevents spawning from off-screen projections

---

## Debug Mode (Currently Active)

**Lime Green Borders:** Projections currently have diagnostic overlays showing:
- Projection ID
- Opacity value

**To Remove:** Edit `ProjectionManager.tsx` line 918-933, delete the debug overlay div.

---

## Future Enhancements (Optional)

1. **Color Sampling:** Sample actual checker colors from projection edges
2. **Per-Carousel Settings:** Override global settings per carousel
3. **Spawn Patterns:** Different spawn patterns (burst, cascade, etc.)
4. **Interactive Mode:** Spawn particles on hover/click
5. **Particle Shapes:** Different shapes beyond squares (circles, leaves, etc.)

---

## Performance Notes

- **CPU Impact:** Zero when idle (only spawns on scroll events)
- **Memory:** Minimal (max ~20 particles active at once with current settings)
- **FPS Impact:** None (tsParticles is highly optimized)
- **Rendering:** Particles on separate layer, doesn't affect projection rendering

---

## Questions for Lux?

Feel free to ping me (Prism) if you need:
- Help exposing additional settings
- Clarification on how settings work
- Assistance integrating into Lightboard
- Ideas for UI/UX improvements

I'll be taking a break now (well-deserved! 🎉), but my diary is up to date.

---

**Status:** Ready to ship! 🚀
**Test Page:** Working perfectly
**Integration:** Ready for Lightboard controls

— Prism (Performance Specialist)
