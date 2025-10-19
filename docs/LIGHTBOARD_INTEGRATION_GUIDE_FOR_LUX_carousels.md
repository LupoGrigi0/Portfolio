# Lightboard Integration Guide for Lux

**Welcome Lux!** This guide will help you wire up the Lightboard to control live carousels and projections. Written by Glide after successful carousel performance optimization.

---

## 🎯 Quick Answer to Your Questions

### "Is there a CarouselProvider?"

**NO** - that's outdated documentation. The current architecture uses:
- **Direct prop passing** from Lightboard → LivePreview → Carousel
- **LightboardContext** (minimal) - only tracks `selectedCarouselId`
- **Local state management** in `Lightboard.tsx`

### "Where do carousel settings live?"

**`Lightboard.tsx` lines 132-165** - All settings are local `useState` hooks:

```typescript
// Carousel Settings State (lines 154-161)
const [transition, setTransition] = useState('fade');
const [autoplay, setAutoplay] = useState(true);
const [interval, setInterval] = useState(5000);
const [speed, setSpeed] = useState(500);
const [reservedSpaceTop, setReservedSpaceTop] = useState(0);
const [reservedSpaceBottom, setReservedSpaceBottom] = useState(0);
const [reservedSpaceLeft, setReservedSpaceLeft] = useState(0);
const [reservedSpaceRight, setReservedSpaceRight] = useState(0);
```

---

## 📁 Architecture Overview

```
Lightboard.tsx (State Management)
    ↓ (passes settings as props)
LivePreview.tsx (Preview Renderer)
    ↓ (creates carousel components)
SelectableCarousel / ReferenceCarousel
    ↓ (wraps)
Carousel.tsx (Your optimized carousel!)
```

---

## 🔧 How Settings Flow (Step-by-Step)

### 1. **User Changes Setting in Widget**

**File:** `CarouselSettingsWidget.tsx`

```typescript
// Widget receives setters as props
<CarouselSettingsWidget
  transition={transition}
  setTransition={setTransition}  // ← Changes state in Lightboard.tsx
  autoplay={autoplay}
  setAutoplay={setAutoplay}
  // ... etc
/>
```

### 2. **Lightboard Passes Settings to LivePreview**

**File:** `Lightboard.tsx` (around line 800+)

```typescript
<LivePreview
  collection={activeCollection}
  carouselSettings={{
    transition,
    autoplay,
    interval,
    speed,
    reservedSpace: {
      top: reservedSpaceTop,
      bottom: reservedSpaceBottom,
      left: reservedSpaceLeft,
      right: reservedSpaceRight,
    }
  }}
  projectionSettings={{
    fadeDistance,
    maxBlur,
    projectionScaleX,
    projectionScaleY,
    blendMode,
    vignetteWidth,
    vignetteStrength,
    checkerboardEnabled,
    checkerboardTileSize,
    checkerboardScatterSpeed,
    checkerboardBlur,
  }}
  onSettingsApplied={() => {
    // Optional callback when settings apply
  }}
/>
```

### 3. **LivePreview Renders Carousels with Settings**

**File:** `LivePreview.tsx` (lines 90-120)

```typescript
<SelectableCarousel
  key={`carousel-${index}`}
  images={validImages}
  // Apply carousel settings
  transitionType={carouselSettings?.transition || 'fade'}
  autoplaySpeed={carouselSettings?.interval || 5000}
  enableProjection={true}
  // Apply projection settings
  projectionSettings={projectionSettings}
  // Reserved space
  reserveTop={carouselSettings?.reservedSpace?.top || 0}
  reserveBottom={carouselSettings?.reservedSpace?.bottom || 0}
  reserveLeft={carouselSettings?.reservedSpace?.left || 0}
  reserveRight={carouselSettings?.reservedSpace?.right || 0}
/>
```

### 4. **Carousel Component Receives Props**

**File:** `Carousel.tsx` (your code!)

The carousel is already set up to accept these props - you don't need to change anything there!

---

## 🎨 Controlling Projections

### Projection Settings Structure

**Type Definition:** `LivePreview.tsx` lines 33-45

```typescript
projectionSettings?: {
  fadeDistance?: number;        // 0-1, how far to fade
  maxBlur?: number;             // 0-20, blur amount
  projectionScaleX?: number;    // 1.0-2.0, horizontal scale
  projectionScaleY?: number;    // 1.0-2.0, vertical scale
  blendMode?: string;           // 'normal', 'multiply', 'screen', etc.
  vignetteWidth?: number;       // 0-1, vignette size
  vignetteStrength?: number;    // 0-1, vignette darkness
  checkerboardEnabled?: boolean;
  checkerboardTileSize?: number;
  checkerboardScatterSpeed?: number;
  checkerboardBlur?: number;
}
```

### How Projection Applies

1. **Per-Page Level:** Projection settings in `Lightboard.tsx` apply to ALL carousels on that page
2. **Live Preview:** Changes update immediately in `LivePreview.tsx`
3. **Production:** Settings saved to collection's `config.json` via backend API

### Enabling/Disabling Projection

**In Carousel Component:**
```typescript
enableProjection={true}  // ← Toggle this
projectionSettings={projectionSettings}  // ← Pass settings object
```

**Why Scientists page had no projection:**
- Collection's `config.json` didn't have `enableProjection: true`
- It's **opt-in per collection**, not global

---

## 📝 How to Save Settings

### Site Settings (Site + Navigation)

**File:** `Lightboard.tsx` lines ~400-450

```typescript
const handleSaveSiteSettings = async () => {
  setIsSavingSite(true);

  const siteConfig = {
    siteName: siteTitle,
    tagline: siteTagline,
    branding: {
      logo: logoUrl,
      favicon: faviconUrl,
    },
    // ... navigation settings
  };

  const response = await fetch('/api/site/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(siteConfig),
  });

  setIsSavingSite(false);
};
```

**Endpoint:** `PUT /api/site/config`

### Page Settings (Carousel + Projection)

**File:** `Lightboard.tsx` lines ~500-550

```typescript
const handleSavePageSettings = async () => {
  if (!activeCollection) return;

  setIsSavingPage(true);

  const pageConfig = {
    // Parse existing config and merge new settings
    ...JSON.parse(configJson),
    carouselDefaults: {
      transition,
      autoplay,
      interval,
      speed,
      reservedSpace: {
        top: reservedSpaceTop,
        bottom: reservedSpaceBottom,
        left: reservedSpaceLeft,
        right: reservedSpaceRight,
      }
    },
    projectionDefaults: {
      fadeDistance,
      maxBlur,
      projectionScaleX,
      projectionScaleY,
      blendMode,
      vignetteWidth,
      vignetteStrength,
      checkerboardEnabled,
      checkerboardTileSize,
      checkerboardScatterSpeed,
      checkerboardBlur,
    }
  };

  const response = await fetch(`/api/admin/config/${activeCollection.slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pageConfig),
  });

  setIsSavingPage(false);
};
```

**Endpoint:** `PUT /api/admin/config/:slug`

**Backend API Reference:** See `D:\Lupo\Source\Portfolio\docs\backend_server_API_ENDPOINTS.md` lines 135-246

---

## 🏗️ Creating & Placing Carousels

**IMPORTANT:** Carousel creation/placement is handled by **DynamicLayout** and **PageRenderer**, NOT Lightboard.

### How Carousels Are Created

**Automatic from Backend:**

1. **Backend scans collection** (e.g., "scientists")
2. **Returns images via API** (`GET /api/content/collections/scientists`)
3. **DynamicLayout.tsx** automatically creates carousels:
   - Groups images (20 per carousel by default)
   - Applies config from collection's `config.json`
   - Renders using virtualization (loads 4, increments 4, max 10 in DOM)

**You don't manually "create" carousels** - they're auto-generated from image data!

### How to Configure Carousel Layout

**File:** Collection's `config.json` (managed by backend)

```json
{
  "title": "Scientists",
  "description": "My science art collection",
  "carouselDefaults": {
    "transition": "fade",
    "autoplay": true,
    "interval": 5000,
    "enableProjection": true
  },
  "projectionDefaults": {
    "fadeDistance": 0.5,
    "maxBlur": 4,
    "projectionScaleX": 1.2,
    "projectionScaleY": 1.2
  }
}
```

**Lightboard's job:** Edit this config and save via API

---

## 🔍 Key Files Reference

| File | Purpose | Your Work |
|------|---------|-----------|
| `Lightboard.tsx` | Main state management | Wire up save/load logic |
| `LivePreview.tsx` | Preview renderer | Already works, may need tweaks |
| `CarouselSettingsWidget.tsx` | UI for carousel settings | Connect to state |
| `ProjectionSettingsWidget.tsx` | UI for projection settings | Connect to state |
| `LightboardContext.tsx` | Minimal context (selected carousel) | Already complete |
| `DynamicLayout.tsx` | Production carousel renderer | Don't touch (Phoenix's domain) |
| `Carousel.tsx` | Core carousel component | Don't touch (Glide's work!) |

---

## ✅ Your TODO List

### Phase 1: Wire Up Settings Persistence

1. **Read current config** from backend when collection loads
2. **Populate Lightboard state** with existing config
3. **Save changes** when "Apply" or "Save" clicked

**Code Location:** `Lightboard.tsx` lines 220-280 (useEffect for loading config)

### Phase 2: Live Preview Integration

1. **Verify LivePreview** receives updated settings
2. **Test projection toggle** (enable/disable)
3. **Test all carousel settings** (transition, speed, etc.)

**Code Location:** `LivePreview.tsx` lines 90-140

### Phase 3: Per-Carousel Settings (Advanced)

Currently, settings apply to **all carousels** on a page. If you want **per-carousel settings**:

1. Add `selectedCarouselId` tracking (already in LightboardContext!)
2. Store settings per carousel ID in config
3. Apply specific settings in LivePreview based on selection

**Pattern:**
```typescript
const carouselSettings = selectedCarouselId
  ? config.carousels[selectedCarouselId]
  : config.carouselDefaults;
```

---

## 🐛 Common Pitfalls

### 1. **Infinite Render Loop**

**FIXED** in `LivePreview.tsx` line 64:
```typescript
// ❌ BAD: Causes infinite loop
}, [carouselSettings, projectionSettings, onSettingsApplied]);

// ✅ GOOD: Excluded onSettingsApplied
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [carouselSettings, projectionSettings]);
```

### 2. **Settings Not Applying**

Make sure:
- Settings are **wrapped in objects** correctly
- `useMemo` used if passing to multiple children
- No stale closures in callbacks

### 3. **Projection Not Showing**

Check:
- `enableProjection={true}` on carousel
- Collection config has `projectionDefaults`
- ProjectionManager is rendering (check React DevTools)

---

## 🎨 Example: Full Integration

**Lightboard.tsx** (simplified):

```typescript
export default function Lightboard({ collection }: LightboardProps) {
  // 1. State management
  const [transition, setTransition] = useState('fade');
  const [fadeDistance, setFadeDistance] = useState(0.5);
  // ... all other settings

  // 2. Load config from backend
  useEffect(() => {
    if (!collection) return;

    fetch(`/api/content/collections/${collection.slug}`)
      .then(res => res.json())
      .then(data => {
        const config = data.data.collection.config || {};
        setTransition(config.carouselDefaults?.transition || 'fade');
        setFadeDistance(config.projectionDefaults?.fadeDistance || 0.5);
        // ... load all settings
      });
  }, [collection]);

  // 3. Save config to backend
  const handleSave = async () => {
    const config = {
      carouselDefaults: { transition, /* ... */ },
      projectionDefaults: { fadeDistance, /* ... */ }
    };

    await fetch(`/api/admin/config/${collection.slug}`, {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  };

  // 4. Render widgets with state
  return (
    <div>
      <CarouselSettingsWidget
        transition={transition}
        setTransition={setTransition}
        onApplySettings={handleSave}
      />

      <LivePreview
        collection={collection}
        carouselSettings={{ transition }}
        projectionSettings={{ fadeDistance }}
      />
    </div>
  );
}
```

---

## 📚 Additional Resources

- **Backend API Endpoints:** `docs/backend_server_API_ENDPOINTS.md`
- **Carousel Props Reference:** `components/Carousel/types.ts`
- **Projection System:** Ask Prism or Kat for projection internals
- **Dynamic Layout:** Ask Phoenix about carousel placement logic

---

## 🤝 Who to Ask

- **Carousel rendering:** Glide (me!)
- **Projection system:** Prism or Kat
- **Page layout:** Phoenix
- **Backend API:** Viktor
- **General architecture:** Lupo

---

## 🎉 Final Notes

The carousel system is now **highly optimized**:
- ✅ Image virtualization (3 images in DOM, not 20)
- ✅ Browser caching works (`unoptimized={true}`)
- ✅ No global event listeners (keyboard, hover)
- ✅ Smooth 60fps performance

**Don't break these optimizations!** If you need to modify Carousel.tsx, ask me first.

Good luck Lux! You've got this! 🚀

---

**Author:** Glide (Carousel Performance Specialist)
**Date:** 2025-10-17
**Version:** 1.0
