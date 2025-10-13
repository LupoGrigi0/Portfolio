# Collection Config Schema Guide

**Author**: Kai v3 (Carousel & Animation Specialist)
**Date**: 2025-10-03
**Purpose**: Reference guide for creating collection config.json files

---

## Quick Start

Two layout modes:

1. **Dynamic** - Simple, auto-generated from all images in directory
2. **Curated** - Full control over placement, images, text, layout

---

## Dynamic Layout (Simple Mode)

**Use when:** You just want to throw images in a directory and get a nice page.

```json
{
  "layoutType": "dynamic",
  "title": "My Collection",
  "subtitle": "Optional subtitle",
  "background": {
    "image": "hero-bg.jpg",
    "opacity": 0.5,
    "parallax": true
  },
  "dynamicSettings": {
    "layout": "single-column",  // or "2-across", "3-across", "masonry"
    "imagesPerCarousel": "all",  // or a number like 5
    "carouselDefaults": {
      "transition": "fade",
      "autoplay": false,
      "reservedSpace": {
        "bottom": 60
      }
    }
  }
}
```

**Layout options:**
- `single-column` - Big carousels, one per row
- `2-across` - Two carousels side-by-side (responsive)
- `3-across` - Three carousels (responsive grid)
- `masonry` - Varying heights (TODO: proper masonry)

**Images per carousel:**
- `"all"` - Single carousel with all images
- `5` - Group images into carousels of 5

---

## Curated Layout (Full Control)

**Use when:** You want specific images in specific places with custom text/layout.

```json
{
  "layoutType": "curated",
  "background": {
    "image": "background.jpg",
    "opacity": 0.6,
    "blur": 1,
    "parallax": true
  },
  "sections": [
    // Array of section objects...
  ]
}
```

### Section Types

#### 1. Hero Section
Title/subtitle in semi-transparent container over background.

```json
{
  "type": "hero",
  "title": "COLLECTION TITLE",
  "subtitle": "Optional subtitle",
  "containerOpacity": 0.3,
  "textPosition": "center",  // "left", "right", "center"
  "separator": true  // Show separator bar under title
}
```

#### 2. Text Section
Markdown or HTML content.

```json
{
  "type": "text",
  "content": "<p>Your HTML or markdown here...</p>",
  "position": "center",  // "left", "right", "center"
  "width": "full"  // "full", "half", "third", "quarter"
}
```

#### 3. Carousel Section
Multiple images in your carousel component.

**Explicit images:**
```json
{
  "type": "carousel",
  "images": ["image1.jpg", "image2.jpg", "image3.jpg"],
  "width": "full",
  "carouselOptions": {
    "transition": "slide-horizontal",
    "autoplay": true,
    "interval": 8000,
    "reservedSpace": {
      "bottom": 80
    },
    "styling": {
      "borderWidth": 2,
      "borderColor": "#ffffff",
      "borderOpacity": 0.2,
      "borderRadius": 8
    }
  }
}
```

**Query-based selection (ultra-wide images):**
```json
{
  "type": "carousel",
  "images": {
    "aspectRatio": ">2.5",  // or {min: 2.5, max: 4.0}
    "limit": 10,
    "sortBy": "filename"  // or "date", "random"
  },
  "width": "full"
}
```

**Auto-fill (all remaining images):**
```json
{
  "type": "carousel",
  "images": "auto",
  "width": "full"
}
```

#### 4. Image Section
Single named image.

```json
{
  "type": "image",
  "src": "hero-image.jpg",
  "alt": "Description",
  "width": "full",
  "caption": "Optional caption"
}
```

#### 5. Video Section
Single video file.

```json
{
  "type": "video",
  "src": "demo.mp4",
  "width": "full",
  "caption": "Optional caption",
  "autoplay": false,
  "controls": true,
  "loop": false,
  "muted": true
}
```

#### 6. Separator Section
Visual divider between sections.

```json
{
  "type": "separator",
  "style": "line",  // or "gradient", "dots"
  "opacity": 0.3,
  "thickness": 1,
  "spacing": 40
}
```

---

## Carousel Options Reference

All carousel configuration from your production-ready carousel component:

```json
"carouselOptions": {
  // Transitions
  "transition": "fade",  // or "slide-horizontal", "slide-vertical", "slide-up", "slide-down", "zoom", "flipbook", "none"

  // Timing
  "autoplay": false,
  "interval": 8000,
  "speed": 800,

  // Controls
  "controls": {
    "nav": {
      "show": true,
      "position": "bottom"  // or "top", "sides"
    },
    "reactions": {
      "show": false,
      "autoHide": true
    }
  },

  // Reserved UI Space (your innovation!)
  "reservedSpace": {
    "top": 0,
    "bottom": 80,
    "left": 0,
    "right": 0,
    "backgroundColor": "transparent",
    "backgroundOpacity": 0
  },

  // Container Styling
  "styling": {
    "borderWidth": 0,
    "borderColor": "#ffffff",
    "borderOpacity": 1,
    "borderRadius": 0,
    "backgroundColor": "transparent",
    "backgroundOpacity": 0,
    "padding": 16
  }
}
```

---

## Background Options

```json
"background": {
  "image": "filename.jpg",  // Required
  "opacity": 0.5,  // 0-1, default 1
  "blur": 2,  // px, default 0
  "parallax": true  // Enable parallax scroll effect
}
```

**Future (sister's work):**
```json
"parallaxConfig": {
  "layers": [...],  // Multi-layer parallax system
  "scrollBehavior": "zoom-blur"  // Advanced effects
}
```

---

## Width Options

All sections support width configuration:

- `"full"` - 100% width (w-full)
- `"half"` - 50% width (w-1/2)
- `"third"` - 33% width (w-1/3)
- `"quarter"` - 25% width (w-1/4)

**Responsive:** Automatically stacks on mobile.

---

## Image Query System

Select images dynamically based on criteria:

```json
{
  "aspectRatio": ">2.5",  // String shorthand
  // OR
  "aspectRatio": {
    "min": 1.5,
    "max": 2.5
  },

  "filename": "sunset.*",  // Regex pattern
  "tags": ["landscape", "sunset"],  // If backend provides tags
  "limit": 10,  // Max images
  "sortBy": "filename"  // or "date", "random"
}
```

**Operators:** `>`, `<`, `>=`, `<=`

---

## Examples

See `docs/config-examples/` for:

1. **curated-sunset-monsters.json** - Full curated layout with hero, text, multiple carousels
2. **dynamic-simple.json** - Simple 2-across dynamic grid
3. **curated-ultra-wide.json** - Query-based ultra-wide image selection

---

## Backwards Compatibility

Old configs (Zara's structure) still work:

```json
{
  "title": "Collection",
  "heroBanner": { ... },
  "layout": { ... },
  "carousels": [ ... ]
}
```

Will render as dynamic layout with defaults.

---

## Integration with Parallax (Sister's Work)

When sister completes parallax system, add:

```json
"parallaxConfig": {
  "layers": [
    {
      "id": "bg",
      "imageUrl": "layer1.jpg",
      "speed": 0.5,
      "opacity": 0.6,
      "blur": 2
    }
  ],
  "scrollBehavior": "zoom-blur"
}
```

Layout components check for `parallaxConfig` first, fallback to simple `background`.

---

## Workflow

1. Create art → Put in directory
2. Write `config.json` in directory (copy from examples)
3. Upload to server
4. Viktor's backend auto-processes (thumbnails, DB)
5. View collection page
6. Tweak `config.json` on server, reload, iterate
7. Ship it 🚀

---

## Tips

- **Start simple:** Use dynamic layout first, upgrade to curated when needed
- **Reserved space:** For portrait images, add `reservedSpace.bottom: 80` to prevent control overlap
- **Image queries:** Great for filtering ultra-wide images or specific patterns
- **Width combos:** Mix full-width carousels with half-width for visual interest
- **Separators:** Use gradient style for subtle section breaks

---

## Need Help?

- Check examples in `docs/config-examples/`
- Read carousel docs in `CAROUSEL_HANDOFF.md`
- Ask Kai (that's me!) 😊
