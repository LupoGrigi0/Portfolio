# Collection config.json Format

The `config.json` file in each collection directory controls how that collection appears and behaves on your portfolio site.

## Location

Place `config.json` in the root of each collection:
```
E:/mnt/lupoportfolio/content/
├── couples/
│   ├── config.json          ← Collection configuration
│   ├── Hero-image.jpg
│   └── gallery/
├── cafe/
│   └── config.json
└── ...
```

---

## Complete Example

```json
{
  "title": "Couples in Love",
  "subtitle": "Capturing moments of connection and intimacy",
  "description": "A celebration of love, partnership, and the beautiful moments that define relationships. Each image tells a unique story of connection, joy, and shared experiences.",

  "featured": true,
  "displayOrder": 1,
  "visibility": "public",

  "hero": {
    "image": "Hero-image.jpg",
    "parallaxSpeed": 0.5,
    "overlayOpacity": 0.3,
    "textPosition": "center"
  },

  "parallax": {
    "enabled": true,
    "layers": [
      {
        "type": "background",
        "speed": 0.3,
        "opacity": 0.6,
        "zIndex": 1
      },
      {
        "type": "midground",
        "speed": 0.6,
        "opacity": 0.8,
        "zIndex": 2
      },
      {
        "type": "foreground",
        "speed": 1.0,
        "opacity": 1.0,
        "zIndex": 3
      }
    ],
    "transitionDuration": 800
  },

  "layout": {
    "style": "masonry",
    "columns": 3,
    "spacing": "normal",
    "imageSize": "large"
  },

  "carousel": {
    "autoplay": false,
    "speed": 3000,
    "transition": "fade",
    "showCaptions": true,
    "enableFullscreen": true
  },

  "styling": {
    "accentColor": "#ff6b6b",
    "textColor": "#ffffff",
    "backgroundColor": "#000000",
    "fontFamily": "sans-serif"
  },

  "seo": {
    "keywords": ["couples", "love", "romance", "portraits"],
    "ogImage": "Hero-image.jpg",
    "canonicalUrl": "/collections/couples"
  },

  "metadata": {
    "created": "2025-01-15",
    "updated": "2025-10-02",
    "tags": ["featured", "couples", "romance"],
    "category": "portraits"
  }
}
```

---

## Field Reference

### Basic Information

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Display title (overrides folder name) |
| `subtitle` | string | ❌ | Tagline shown under title |
| `description` | string | ❌ | Long-form description for collection page |
| `featured` | boolean | ❌ | Show on homepage? (default: false) |
| `displayOrder` | number | ❌ | Order on homepage (1 = first) |
| `visibility` | string | ❌ | `public`, `private`, `unlisted` (default: public) |

### Hero Configuration

| Field | Type | Description |
|-------|------|-------------|
| `hero.image` | string | Hero image filename (from collection root) |
| `hero.parallaxSpeed` | number | Scroll speed (0.0 = static, 1.0 = normal, 0.5 = half speed) |
| `hero.overlayOpacity` | number | Dark overlay opacity (0.0 - 1.0) |
| `hero.textPosition` | string | `top`, `center`, `bottom` |

### Parallax Configuration

The **multi-layer scrolling effect** you're excited about! ✨

| Field | Type | Description |
|-------|------|-------------|
| `parallax.enabled` | boolean | Enable parallax scrolling? |
| `parallax.layers[]` | array | Array of parallax layers |
| `parallax.layers[].type` | string | `background`, `midground`, `foreground` |
| `parallax.layers[].speed` | number | Scroll speed multiplier (0.0 - 2.0) |
| `parallax.layers[].opacity` | number | Layer opacity (0.0 - 1.0) |
| `parallax.layers[].zIndex` | number | Stacking order |
| `parallax.transitionDuration` | number | Layer transition time (ms) |

**Example Effect**:
- Background layer moves at 30% speed (0.3) - appears far away
- Midground moves at 60% speed (0.6) - middle distance
- Foreground moves at 100% speed (1.0) - closest to viewer
- Creates 3D depth illusion as you scroll!

### Layout Configuration

| Field | Type | Description |
|-------|------|-------------|
| `layout.style` | string | `masonry`, `grid`, `single`, `stacked` |
| `layout.columns` | number | Grid columns (1-4) |
| `layout.spacing` | string | `tight`, `normal`, `loose` |
| `layout.imageSize` | string | `thumbnail`, `medium`, `large`, `full` |

### Carousel Settings

| Field | Type | Description |
|-------|------|-------------|
| `carousel.autoplay` | boolean | Auto-advance slides? |
| `carousel.speed` | number | Autoplay interval (ms) |
| `carousel.transition` | string | `fade`, `slide`, `zoom` (when Kai implements) |
| `carousel.showCaptions` | boolean | Display image captions? |
| `carousel.enableFullscreen` | boolean | Allow fullscreen mode? |

### Styling Customization

Make each collection visually unique!

| Field | Type | Description |
|-------|------|-------------|
| `styling.accentColor` | string | CSS color for highlights/links |
| `styling.textColor` | string | Text color (hex or CSS color) |
| `styling.backgroundColor` | string | Page background color |
| `styling.fontFamily` | string | `sans-serif`, `serif`, `monospace` |

### SEO & Metadata

| Field | Type | Description |
|-------|------|-------------|
| `seo.keywords` | array | Search keywords |
| `seo.ogImage` | string | Social media preview image |
| `seo.canonicalUrl` | string | Canonical URL path |
| `metadata.created` | string | Creation date (YYYY-MM-DD) |
| `metadata.updated` | string | Last updated date |
| `metadata.tags` | array | Organizational tags |
| `metadata.category` | string | Collection category |

---

## Minimal Example

Don't want to configure everything? Here's the minimum:

```json
{
  "title": "My Collection",
  "description": "A beautiful collection of images"
}
```

**All other settings use sensible defaults!**

---

## Default Values

If config.json is missing or empty, these defaults apply:

```json
{
  "title": "[Folder Name]",
  "subtitle": null,
  "description": "[Folder Name] collection",
  "featured": false,
  "displayOrder": 999,
  "visibility": "public",
  "hero": {
    "image": "Hero-image.jpg",
    "parallaxSpeed": 0.5,
    "overlayOpacity": 0.4,
    "textPosition": "center"
  },
  "parallax": {
    "enabled": true,
    "transitionDuration": 600
  },
  "layout": {
    "style": "masonry",
    "columns": 3,
    "spacing": "normal",
    "imageSize": "large"
  },
  "carousel": {
    "autoplay": false,
    "speed": 3000,
    "transition": "fade",
    "showCaptions": true,
    "enableFullscreen": true
  }
}
```

---

## Hot Reload

Config changes are **hot-reloaded** in development! Just edit and save - the page updates automatically.

---

## Examples for Your Collections

### Couples Collection
```json
{
  "title": "Couples in Love",
  "subtitle": "Moments of connection and intimacy",
  "featured": true,
  "displayOrder": 1,
  "hero": {
    "parallaxSpeed": 0.6,
    "textPosition": "bottom"
  },
  "styling": {
    "accentColor": "#ff6b6b"
  }
}
```

### Cafe Collection
```json
{
  "title": "Coffee & Contemplation",
  "subtitle": "Urban scenes and quiet moments",
  "featured": true,
  "displayOrder": 2,
  "parallax": {
    "enabled": true,
    "layers": [
      {"type": "background", "speed": 0.2, "opacity": 0.5},
      {"type": "foreground", "speed": 1.2, "opacity": 1.0}
    ]
  },
  "styling": {
    "accentColor": "#8b4513"
  }
}
```

---

## Testing Your Config

Visit `http://localhost:3000/collections/[slug]` to see changes immediately!

---

*Documentation by Zara (UI/UX & React Components Specialist)*
*Last updated: 2025-10-02*
