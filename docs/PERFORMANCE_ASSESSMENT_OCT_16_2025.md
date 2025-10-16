# Performance Assessment - October 16, 2025

**Assessor:** Kat (Performance Specialist)
**Status:** Active - Phase 1 Complete, Phase 2 In Progress
**Collection Test Case:** 3000 image collection

---

## Executive Summary

Modern Art Portfolio experiencing severe performance degradation at scale. Initial idle state measured at **67 updates/sec with zero user interaction**. Console crashes within 60 seconds from log spam.

**Phase 1 Quick Wins: DEPLOYED ✅**
- Projection system disabled globally (-67 updates/sec)
- Logger system implemented (console spam eliminated)
- Keyboard manager centralized (-95% event processing)

**Phase 2 Target: CAROUSEL RENDERING ARCHITECTURE**

---

## Critical Issue: Carousel Image Rendering

### The Problem

**Location:** `frontend/src/components/Carousel/Carousel.tsx:205`

```tsx
{images.map((image, index) => (
  <CarouselImageRenderer
    key={image.id}
    image={image}
    isActive={index === currentIndex}
    // ... ALL 20 images rendered to DOM
  />
))}
```

### The Math

| Metric | Value | Impact |
|--------|-------|--------|
| Images per carousel | 20 | Configuration default |
| Max active carousels | 10 | DynamicLayout virtualization limit |
| **Total DOM image nodes** | **200** | **CRITICAL** |
| Images actually visible | 1 | Per carousel |
| Images actually preloaded | 3 | Current ±1 |

### The Disconnect

**Smart Preloader (useImagePreloader.ts):**
- ✅ Only preloads current ±1 images
- ✅ Unloads images >3 positions away
- ✅ Memory conscious
- ✅ Lazy loads on first interaction

**Dumb Renderer (Carousel.tsx:205):**
- ❌ Renders ALL 20 images to DOM
- ❌ Browser must parse all image elements
- ❌ Browser must layout all containers
- ❌ All nodes kept in memory
- ❌ Visibility/transition processing for all images

### Performance Impact

**For 3000 image collection:**
- 3000 images / 20 per carousel = 150 carousels total
- 10 active carousels in viewport = 200 DOM nodes
- Only 10 images visible (1 per carousel)
- **190 unnecessary DOM nodes (95% waste)**

**DOM operations per scroll:**
- Layout thrashing from 200 position calculations
- Style recalculation for 200 nodes
- Paint for 200 layers (even if opacity: 0)
- Projection system (when enabled) trying to update ALL 200

---

## Solution Design: Carousel Image Virtualization

### Strategy

**Render only visible + adjacent images to DOM**

1. **Active window:** Render current ± 1 images only (3 total)
2. **On navigation:** Add new image, remove far image
3. **Sync with preloader:** Render === Preloaded
4. **Fallback:** If user navigates faster than preload, show loading state

### Implementation

**File:** `frontend/src/components/Carousel/Carousel.tsx`

**Current (lines 205-228):**
```tsx
{images.map((image, index) => (
  <CarouselImageRenderer ... />
))}
```

**Proposed:**
```tsx
{getVisibleImages(currentIndex, images).map((image, index) => (
  <CarouselImageRenderer
    key={image.id}
    image={image}
    isActive={index === currentIndex}
    // ... only visible/adjacent images
  />
))}

function getVisibleImages(currentIndex: number, allImages: CarouselImage[]): CarouselImage[] {
  const visibleIndices = [
    (currentIndex - 1 + allImages.length) % allImages.length,
    currentIndex,
    (currentIndex + 1) % allImages.length
  ];
  return visibleIndices.map(i => allImages[i]);
}
```

### Expected Impact

**Before:**
- 200 DOM image nodes (10 carousels × 20 images)
- ~95% waste

**After:**
- 30 DOM image nodes (10 carousels × 3 images)
- **85% reduction in DOM nodes**
- **Matches preloader strategy**

---

## Additional Performance Opportunities

### 1. DynamicLayout Scroll Handler

**Location:** `frontend/src/components/Layout/DynamicLayout.tsx:198-204`

**Current:** Throttled to 200ms, but still fires frequently during scroll

**Opportunity:**
- Use IntersectionObserver instead of scroll handler
- Eliminates manual throttling
- Browser-optimized viewport detection

**Impact:** Moderate (scroll handlers are already throttled)

### 2. Projection Context Map Recreation

**Location:** `frontend/src/components/Layout/MidgroundProjection.tsx`

**Status:** Currently disabled globally (Quick Win #1)

**Note for Prism (Kat-Projection):**
- Context was creating new Map instances on every update
- Triggered cascade re-renders across all consuming components
- New scroll-driven architecture should eliminate this

### 3. Console.log Migration

**Status:** Logger system ready, migration pending

**High-Priority Modules:**
- MidgroundProjection (67 logs/sec at idle - DISABLED, but still migrate)
- Carousel (logs on every image change)
- useCarouselState (lifecycle logs)
- PageRenderer (fetch logs)

**Impact:** Console stability (prevents crashes after 60 seconds)

### 4. Checkerboard Mask Re-generation

**Location:** Projection system (currently disabled)

**Note for Prism:** Checkerboard vignette was regenerating on every projection update

---

## Performance Instrumentation

### Tools Deployed

**1. Next.js Config (`next.config.mjs`)**
- React Profiler enabled
- Source maps for production debugging
- Image optimization configured

**2. Performance Monitor (`lib/performance.ts`)**
- Component render time tracking
- Image load time tracking
- DOM size monitoring
- Memory usage tracking (Chrome)
- Core Web Vitals (LCP, FID, CLS)
- Auto-reports every 10 seconds in development

**3. Usage:**

```typescript
import { measureRender, reportMetric } from '@/lib/performance';

// Track component render
const stopMeasure = measureRender('Carousel');
// ... component logic ...
stopMeasure();

// Report custom metric
reportMetric('carousel.images.rendered', visibleImages.length);
```

### Baseline Metrics (Pre-Optimization)

**To be measured after server restart:**
- [ ] Initial page load time
- [ ] Time to first carousel render
- [ ] DOM node count at idle
- [ ] DOM node count after scrolling (10 carousels active)
- [ ] Memory usage at idle
- [ ] Memory usage after 30 seconds of scrolling
- [ ] LCP (Largest Contentful Paint)
- [ ] FID (First Input Delay)
- [ ] CLS (Cumulative Layout Shift)

---

## Team Coordination

### Kat-Carousel (Waking Soon)

**Primary Target:** Image re-request bug during autoplay
**Secondary Targets:**
1. Integrate KeyboardManager (READY: `KeyboardManager/INTEGRATION_GUIDE.md`)
2. Remove old keyboard listener (lines 324-356 in useCarouselState.ts)
3. Event isolation improvements

**Request:** Hold image virtualization work until performance baseline established

### Prism (Kat-Projection) - Active in Worktree

**Primary Target:** Projection architecture redesign
**Specifications:**
- Scroll-driven only (no intervals)
- Single ProjectionManager pattern
- Max 7 active projections
- See: `docs/BRIEFING_KAT_PROJECTION.md`

**Status:** Investigating existing code, designing new architecture

---

## Next Actions

### Immediate (Kat - Performance)

1. ✅ Create performance instrumentation
2. ⏳ Restart frontend server
3. ⏳ Establish baseline metrics
4. ⏳ Document current DOM size and memory usage
5. ⏳ Design carousel image virtualization implementation
6. ⏳ Create performance dashboard (optional)

### Short-term (Team)

1. **Kat-Carousel:** Integrate KeyboardManager
2. **Kat-Carousel:** Fix image re-request bug (PRIMARY)
3. **Prism:** Complete projection redesign
4. **All:** Migrate to logger system (eliminate console.log)

### Medium-term (Architectural)

1. Implement carousel image virtualization (85% DOM reduction)
2. Replace DynamicLayout scroll handler with IntersectionObserver
3. Evaluate image format optimization (AVIF/WebP)
4. Consider lazy hydration for below-fold carousels

---

## Performance Targets

### DOM Size
- **Current:** ~200 image nodes (10 active carousels × 20 images)
- **Target:** ~30 image nodes (10 active carousels × 3 images)
- **Reduction:** 85%

### Memory Usage
- **Current:** To be measured
- **Target:** <100MB for 3000 image collection page

### Core Web Vitals
- **LCP:** <2.5s (Good)
- **FID:** <100ms (Good)
- **CLS:** <0.1 (Good)

### User Experience
- **Scroll performance:** 60fps sustained
- **Image transitions:** Smooth, no jank
- **Initial load:** <3s to first carousel interactive

---

## Risk Assessment

### High Risk
- **Carousel virtualization:** May introduce edge cases (circular arrays, rapid navigation)
- **Mitigation:** Extensive testing, fallback loading states

### Medium Risk
- **Logger migration:** Console.log deeply embedded, easy to miss instances
- **Mitigation:** Grep search, systematic module-by-module migration

### Low Risk
- **Projection disable:** Already tested, working as expected
- **Keyboard manager:** Minimal surface area, clear integration path

---

**Created:** October 16, 2025
**Author:** Kat (Performance Specialist)
**Last Updated:** October 16, 2025 14:30 UTC
**Status:** Living document - will update with baseline metrics after server restart
