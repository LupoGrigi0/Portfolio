# Projection System Diagnostic - 2025-10-17

## Current Configuration Analysis

### Scientists Collection (`/scientists`)
- **Layout:** DynamicLayout (no `layoutType` specified, uses default)
- **Images:** 271 total
- **Projection Config:** **NONE** (no projection settings in config.json)
- **Expected Behavior:** Projections DISABLED by default
  - `projectionEnabled = config.projection?.enabled ?? false` → `false`
  - No projections should render on this page

### Home Collection (`/home`)
- **Layout:** CuratedLayout (`layoutType: "curated"`)
- **Images:** 1,134 total
- **Projection Config:**
  ```json
  "projection": {
    "enabled": true,
    "pattern": "all",
    "fadeDistance": 0.5,
    "maxBlur": 4,
    "scaleX": 1.85,
    "scaleY": 1.65
  }
  ```
- **Expected Behavior:** Projections enabled on ALL carousels
  - Hero section + 2 row carousels (skip 0-40)
  - Dynamic-fill section: ~55 carousels (1094 images / 20 per carousel)
  - **Total: ~57 carousels**, all with projections enabled

## How CuratedLayout's Dynamic-Fill Works

**Key Discovery:** CuratedLayout's `dynamic-fill` section does NOT use virtualization!

- Lines 395-475 in `CuratedLayout.tsx`
- Renders ALL carousels at once using `carouselGroups.map()`
- No progressive loading, no visible range tracking
- All 55+ carousels mount immediately when page loads

## Projection System Limits (By Design)

From `ProjectionManager.tsx` lines 316-323:

```typescript
// Apply viewport + buffer strategy (max 7 active projections)
const sortedProjections = Array.from(newProjections.values())
  .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter)
  .slice(0, 7);
```

**By Design:** Only 7 projections render at once (closest to viewport center).

This is intentional for performance - rendering 55+ projections simultaneously would be expensive.

## What Should Happen on Home Page

1. **Page Load:** All 57 carousels mount and register via `useCarouselProjection`
2. **Registration:** Each carousel adds itself to `carouselsRef.current` (no re-render)
3. **Scroll Event:** `updateProjections()` fires via RAF
4. **Calculation:** System calculates projections for all 57 registered carousels
5. **Filtering:** Keeps only 7 closest to viewport center
6. **Rendering:** ProjectionLayer renders those 7 projections
7. **Scroll Again:** As user scrolls, different 7 carousels get projections

## Potential Issues

### Issue 1: Registration Timing
**Symptom:** If 57 carousels all try to register simultaneously on mount, there might be a race condition or the initial `updateProjections` call might not fire correctly.

**Diagnosis:** Check if `carouselsRef.current.size` shows 57 registered carousels after page load.

### Issue 2: IntersectionObserver Overhead
**Symptom:** 57 IntersectionObserver instances (one per carousel) might cause performance issues.

**Current Code:** Lines 182-184 in ProjectionManager.tsx:
```typescript
if (observerRef.current && element) {
  observerRef.current.observe(element);
}
```

**Note:** The IntersectionObserver is actually passive (lines 365-375) - it doesn't trigger updates. But 57 observed elements might still have overhead.

### Issue 3: Initial updateProjections Call
**Symptom:** Initial `updateProjections()` call (line 350) fires before all carousels have registered.

**Timeline:**
1. ProjectionManager mounts → `updateProjections()` fires (0 carousels registered)
2. CuratedLayout renders → 57 Carousel components mount
3. Each Carousel calls `useCarouselProjection` → registers
4. But no scroll event yet → projections not updated until user scrolls

**Potential Fix:** Call `updateProjections()` after registration completes?

## Debug Steps

To diagnose what's actually happening:

1. **Enable Debug Logging:**
   ```javascript
   // In browser console
   window.__PRISM_DEBUG = true
   ```

2. **Refresh Home Page**

3. **Check Console Output:**
   - Look for `[ProjectionManager] updateProjections:` logs
   - Check `registeredCarousels` count (should be ~57)
   - Check `carouselIds` array

4. **Scroll the Page**
   - Verify projections update as you scroll
   - Check if different carousel IDs appear in logs

## Questions for Lupo

1. **Scientists Page:** You mentioned "projections are not running" on scientists page. Did you expect projections there? (Config has no projection settings, so they're disabled by default.)

2. **Home Page:** What specifically is "not running consistently"?
   - Do projections show at all?
   - Do they update when scrolling?
   - Are some carousels never getting projections?

3. **Observable Behavior:** Can you describe what you see vs. what you expect?

---

**Next Steps After Clarification:**

- If registrations aren't happening: Fix registration timing
- If projections aren't updating on scroll: Fix scroll handler
- If initial projections don't show: Add post-registration update trigger
- If it's actually working but max-7 feels wrong: Increase limit or make it configurable

**- Prism**
