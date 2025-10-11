# Midground Projection System - Integration Guide

**Author:** Kai v3 (Carousel & Animation Specialist)
**Created:** October 5, 2025
**For:** Zara and future developers

---

## What Is This?

The Midground Projection System turns carousels into "projectors" that cast their first image onto a shared background layer. As carousels scroll into view, their projections fade in and blend together, creating a dynamic, animated background that responds to page scroll.

**Visual Metaphor:** Each carousel is a spotlight projector, and the midground layer is the projection screen behind all content.

---

## Quick Start

### 1. Wrap Your Page in the Provider

```typescript
import { MidgroundProjectionProvider } from '@/components/Layout';

export default function MyPage() {
  return (
    <MidgroundProjectionProvider>
      <YourPageContent />
    </MidgroundProjectionProvider>
  );
}
```

### 2. Enable Projection on Any Carousel

```typescript
import ReferenceCarousel from '@/components/ReferenceCarousel/ReferenceCarousel';

<ReferenceCarousel
  images={yourImages}
  enableProjection={true}
  projectionId="unique-carousel-id"
/>
```

That's it! The carousel will now project its first image onto the midground layer.

---

## How It Works

### Architecture

1. **MidgroundProjectionProvider** - Global context managing all projections
2. **MidgroundLayer** - Fixed-position layer that renders all projections (z-index: 0, sits between background and content)
3. **useCarouselProjection** hook - Tracks carousel position and updates projection in real-time
4. **ReferenceCarousel** - Built-in projection support via `enableProjection` prop

### Projection Lifecycle

1. Carousel mounts → registers projection with provider
2. Scroll/resize events → updates projection position, opacity, blur
3. Distance from viewport center determines:
   - **Opacity:** 1.0 at center, fades to 0 at edge of fade zone
   - **Blur:** 0px at center, increases to maxBlur at edge
   - **Z-order:** Carousel closest to center renders on top
4. Carousel unmounts → unregisters projection

### Key Behaviors

- **Fade Distance:** How far from viewport center the fade starts (0-1, fraction of viewport height)
- **Independent Scale:** Adjust width (scaleX) and height (scaleY) separately for aspect ratio control
- **Blend Modes:** Multiple projections blend using CSS mix-blend-mode (normal, multiply, screen, overlay, etc.)
- **Vignette:** Radial fade from center to edges eliminates harsh lines on high-contrast images
- **Performance:** Uses requestAnimationFrame, passive scroll listeners, and 300ms update interval

---

## Configuration Options

### Global Settings (via Context)

Access these from `useMidgroundProjection()`:

```typescript
const {
  fadeDistance,           // 0-1: Distance from center where fade starts (default: 0.5)
  maxBlur,               // 0-10: Max blur in pixels (default: 4)
  projectionScaleX,      // 0.5-2: Horizontal scale multiplier (default: 1.2)
  projectionScaleY,      // 0.5-2: Vertical scale multiplier (default: 1.2)
  blendMode,             // CSS mix-blend-mode (default: 'normal')
  vignetteWidth,         // 0-50: Edge fade width percentage (default: 20)
  vignetteStrength,      // 0-1: Fade opacity (default: 0.8)

  // Setters
  setFadeDistance,
  setMaxBlur,
  setProjectionScaleX,
  setProjectionScaleY,
  setBlendMode,
  setVignetteWidth,
  setVignetteStrength,
} = useMidgroundProjection();
```

### Per-Carousel Settings

```typescript
<ReferenceCarousel
  images={images}
  enableProjection={true}      // Enable/disable projection
  projectionId="unique-id"     // Unique ID for this projection
/>
```

---

## Integration Patterns

### Pattern 1: Simple Page Background

Use projection to create animated page backgrounds:

```typescript
export default function AboutPage() {
  return (
    <MidgroundProjectionProvider>
      <div className="relative">
        {/* Static fallback background */}
        <div className="fixed inset-0 -z-20 bg-gradient-to-br from-purple-900 via-black to-blue-900" />

        {/* Content with projecting carousels */}
        <ResponsiveContainer>
          <ContentBlock>
            <ReferenceCarousel
              images={heroImages}
              enableProjection={true}
              projectionId="hero-carousel"
            />
          </ContentBlock>

          <ContentBlock>
            <h1>Your Content Here</h1>
            <p>The carousel above projects onto the background</p>
          </ContentBlock>
        </ResponsiveContainer>
      </div>
    </MidgroundProjectionProvider>
  );
}
```

### Pattern 2: Vertical Scroll Story

Stack carousels vertically for a scrolling narrative:

```typescript
{collections.map((collection) => (
  <div key={collection.id} className="min-h-[60vh] py-12">
    <ContentBlock>
      <h2>{collection.title}</h2>
      <ReferenceCarousel
        images={collection.images}
        enableProjection={true}
        projectionId={`carousel-${collection.id}`}
      />
    </ContentBlock>
  </div>
))}
```

### Pattern 3: Side-by-Side Blend Test

Multiple carousels projecting simultaneously:

```typescript
<div className="grid grid-cols-2 gap-8">
  <ReferenceCarousel
    images={images1}
    enableProjection={true}
    projectionId="left-carousel"
  />
  <ReferenceCarousel
    images={images2}
    enableProjection={true}
    projectionId="right-carousel"
  />
</div>
```

### Pattern 4: Custom Projection Control

For advanced use cases, use the hook directly:

```typescript
import { useCarouselProjection } from '@/components/Layout';

function CustomCarousel({ id, imageUrl, enabled }) {
  const elementRef = useCarouselProjection(id, imageUrl, enabled);

  return (
    <div ref={elementRef}>
      {/* Your custom carousel implementation */}
    </div>
  );
}
```

---

## Styling Recommendations

### Z-Index Layers

The projection system uses this z-index stack:

- `-z-20`: Static background (visible when no projections active)
- `z-0`: Midground layer (projections render here)
- `z-1+`: Content (carousels, text, interactive elements)

Always use `-z-20` for static backgrounds and `z-1` or higher for content.

### Responsive Design

The system is fully responsive. Projections automatically adapt to:
- Viewport size changes (resize events)
- Carousel position changes (scroll events)
- Mobile/tablet/desktop layouts

### Performance Tips

1. **Limit concurrent projections:** 4-5 carousels is optimal for smooth performance
2. **Use simple images:** Complex images with many colors blend better than high-contrast graphics
3. **Test blend modes:** Some modes (multiply, screen) perform better than others (hard-light, color-burn)
4. **Lazy load carousels:** Only load galleries when scrolled into view

---

## Blend Mode Reference

Choose blend modes based on your visual goals:

- **normal** - No blending, simple overlap (default)
- **multiply** - Darkens overlap zones (good for dark/moody)
- **screen** - Lightens overlap zones (good for bright/airy)
- **overlay** - Increases contrast (vivid, punchy)
- **soft-light** - Subtle contrast (gentle, refined)
- **hard-light** - Vivid contrast (dramatic, bold)
- **color-dodge** - Brightens colors (vibrant, glowing)
- **color-burn** - Intensifies colors (rich, saturated)
- **lighten** - Shows lighter pixels only
- **darken** - Shows darker pixels only

---

## Troubleshooting

### Projection not appearing?

1. Check that `enableProjection={true}` is set on ReferenceCarousel
2. Verify page is wrapped in `<MidgroundProjectionProvider>`
3. Ensure carousel has valid images with accessible URLs
4. Check console for CORS errors (images must be served with proper headers)

### Images loading slowly?

1. Projections use plain `<img>` tags (not Next.js Image) to avoid retry loops
2. Images load lazily by default
3. Consider optimizing image sizes (projections are blurred, so medium resolution is sufficient)

### Projections not updating on scroll?

1. Check that carousel is mounted with `ref={elementRef}` from useCarouselProjection
2. Verify scroll listeners are not blocked by parent elements
3. Ensure no CSS `pointer-events: none` on carousel container

### Hydration mismatch errors?

The MidgroundLayer only renders on client (after mount) to prevent SSR hydration issues. This is expected and safe.

---

## Advanced: Custom Projection Hook

For complete control, use `useCarouselProjection` directly:

```typescript
import { useCarouselProjection } from '@/components/Layout';

function MyCustomProjector() {
  const [imageUrl, setImageUrl] = useState('https://example.com/image.jpg');
  const elementRef = useCarouselProjection('my-projector-id', imageUrl, true);

  return (
    <div ref={elementRef}>
      {/* Element position is tracked for projection */}
    </div>
  );
}
```

The hook returns a ref that must be attached to the element you want to track. The projection will follow this element's position in the viewport.

---

## Example: Complete Integration

```typescript
'use client';

import { MidgroundProjectionProvider, useMidgroundProjection } from '@/components/Layout';
import ReferenceCarousel from '@/components/ReferenceCarousel/ReferenceCarousel';

function MyPageContent() {
  const { setBlendMode, setVignetteWidth } = useMidgroundProjection();

  // Optional: Customize projection settings
  useEffect(() => {
    setBlendMode('soft-light');
    setVignetteWidth(25);
  }, []);

  return (
    <>
      {/* Static fallback background */}
      <div className="fixed inset-0 -z-20 bg-black" />

      {/* Projecting carousel */}
      <div className="min-h-screen flex items-center justify-center">
        <ReferenceCarousel
          images={myImages}
          enableProjection={true}
          projectionId="hero"
        />
      </div>
    </>
  );
}

export default function MyPage() {
  return (
    <MidgroundProjectionProvider>
      <MyPageContent />
    </MidgroundProjectionProvider>
  );
}
```

---

## Future Possibilities

The modular architecture enables:
- **Orbital motion:** Carousels moving in figure-8 or circular paths
- **Racing carousels:** Horizontal scrolling with motion blur
- **Water ballet formations:** Synchronized carousel choreography
- **Depth through scale:** Projections that grow/shrink based on scroll depth
- **Animated vignettes:** Checkerboard or particle effects at projection edges

These are natural extensions of the current system and can be implemented without breaking existing functionality.

---

## Questions?

Reach out to Kai v3 (that's me!) or refer to the working demo at `/projection-demo` for live examples of all features.

Happy projecting! 🎬✨
