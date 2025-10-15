# Lightboard Progress Report

**Component:** Site-Wide Designer Tool
**Name:** **Lightboard** (Theatre lighting control panel metaphor)
**Author:** Kai v3
**Date:** 2025-10-13
**Status:** Foundation Complete, Building Widgets

---

## What is Lightboard?

**Lightboard** is the unified floating designer tool that brings together all the component editors (Collections Lab, Projection Lab, Carousel Lab) into one beautiful, draggable interface that works on every page.

The name "Lightboard" comes from theatre: a lightboard is the control panel where stage technicians control all the lighting (spotlights, projections, effects). Perfect metaphor for a tool that controls the projection system!

---

## Progress Summary

### ✅ Phase 1: Foundation (COMPLETE)

**Lightboard Core Component:**
- Draggable floating panel with glassmorphism aesthetic
- Toggle button (gear icon, top-right, clean and minimal)
- Tab system (Site, Page, Projection, Carousel)
- Dark theme with zinc palette + cyan/purple accents
- Smooth animations and transitions
- Position persistence (drag once, it stays there)

**LightboardContext:**
- Selection state management (`selectedCarouselId`)
- `useLightboard()` hook for components
- Ready for click-to-select system

**Location:**
```
worktrees/lightboard/src/frontend/src/components/Lightboard/
├── Lightboard.tsx              ✅ Complete
├── LightboardContext.tsx       ✅ Complete
├── index.ts                    ✅ Complete
└── widgets/
    └── ProjectionSettingsWidget.tsx  ✅ Complete
```

---

## Completed Widgets

### 1. ProjectionSettingsWidget ✅

**What it does:** All the projection controls from Collections Lab, now standalone and reusable.

**Features:**
- Fade Distance slider
- Max Blur slider
- Projection Scale X/Y (independent width/height)
- Blend Mode selector (10 CSS blend modes)
- Vignette controls (width, strength)
- Checkerboard vignette section (tile size, scatter speed, blur)
- "Sync to Config" button
- "Reset to Defaults" button
- **Shows selected carousel ID** (when using click-to-select)

**Visual Design:**
- Zinc dark theme matching Lightboard
- Cyan accent sliders
- Purple accent for checkerboard section
- Emerald "Sync" button
- Clean, compact, scrollable

**Props:** Accepts all projection settings + setters + optional callbacks

---

## In Progress

### 2. SiteSettingsWidget (NEXT)

Will include:
- Favicon/logo upload or URL
- Site title, tagline
- Global theme colors
- Menu settings (hamburger behavior, etc.)
- Save to Viktor's branding API

### 3. PageSettingsWidget (AFTER SITE)

Will include:
- Layout type selector (curated/dynamic/hybrid)
- Title, subtitle, description
- Template selector (lift from Collections Lab)
- JSON editor (for power users)
- Save to config.json via Viktor's API

### 4. CarouselSettingsWidget (AFTER PAGE)

Will include:
- Transition selector
- Autoplay toggle
- Timing controls
- Reserved space controls
- Per-carousel overrides (when carousel selected)

---

## Architecture Decisions

### Why Separate Widgets?

Each widget is self-contained and reusable:
- **Lightboard** orchestrates them (tabs, dragging, positioning)
- **Widgets** handle their own settings (props-based, no tight coupling)
- **Context** manages selection state (which carousel is active)

This means:
- Labs can still use individual widgets if needed
- Lightboard can be extended with new tabs easily
- Each widget can be tested independently

### Theme Consistency

All widgets use the **zinc palette**:
- `zinc-900`: Backgrounds
- `zinc-800`: Secondary backgrounds
- `zinc-700`: Borders
- `zinc-300`: Primary text
- `zinc-400/500`: Secondary text

Accent colors:
- **Cyan** (`cyan-500`): Projection controls, highlights
- **Purple** (`purple-500`): Checkerboard, special effects
- **Emerald** (`emerald-600`): Save/sync actions
- **Blue** (`blue-500`): Active tabs, selections

---

## Next Steps

1. **Create SiteSettingsWidget** (branding API integration)
2. **Create PageSettingsWidget** (config.json editor)
3. **Create CarouselSettingsWidget** (from Carousel Lab)
4. **Integrate all widgets into Lightboard tabs**
5. **Implement click-to-select system:**
   - Wrap carousels with selection HOC
   - Add visual highlight (blue glow? border?)
   - Update context on click
   - Show "Editing: Carousel 2" in widgets
6. **Wire up save functionality:**
   - Site settings → `POST /api/site/branding`
   - Page settings → `POST /api/content/:slug/config`
   - Handle success/error states
7. **Polish & test across pages**

---

## Design Philosophy

**"Design Through Play"**

The Lightboard embodies the portfolio's core principle: **design should feel like play, not work**.

- Drag the panel anywhere → stays out of your way
- Tweak sliders → see changes instantly
- Click "Sync" → saved to config
- Navigate to another page → Lightboard follows you

**No save-refresh cycle. No code editing. Just pure creative flow.**

---

## Technical Notes

### Dragging System

The dragging is smooth because:
- Tracks mouse offset on mouseDown
- Updates position on mousemove (only when dragging)
- Prevents drag on tabs/content (only header drags)
- Cleans up event listeners on unmount

### Context Architecture

LightboardContext is minimal:
```typescript
{
  selectedCarouselId: string | null,
  selectCarousel: (id: string | null) => void
}
```

This keeps it simple. Settings live in their own contexts (MidgroundProjectionProvider, etc.). Lightboard context ONLY manages selection state.

### Widget Props Pattern

All widgets follow the same pattern:
```typescript
interface WidgetProps {
  // Current values
  setting1: type;
  setting2: type;

  // Setters
  setSetting1: (value: type) => void;
  setSetting2: (value: type) => void;

  // Optional callbacks
  onSave?: () => void;
  onReset?: () => void;
}
```

This makes them:
- Controlled components (parent owns state)
- Testable (pass mock setters)
- Reusable (no internal state magic)

---

## Timeline Estimate

**Current Progress:** ~30% complete

**Remaining Work:**
- SiteSettingsWidget: 2-3 hours
- PageSettingsWidget: 2-3 hours
- CarouselSettingsWidget: 2-3 hours
- Integration: 2 hours
- Click-to-select system: 3-4 hours
- Save wiring: 2 hours
- Polish & testing: 2-3 hours

**Total Remaining:** ~18-22 hours of focused work

**Realistic Completion:** 2-3 days (accounting for debugging, iteration, feedback)

---

## What It Will Look Like When Done

**User Flow:**
1. Load any page (home, collection, whatever)
2. Click gear icon (top-right)
3. Lightboard slides in (smooth animation)
4. Four tabs visible: Site | Page | Projection | Carousel
5. Click "Site" → favicon, branding, global settings
6. Click "Page" → layout, title, template selector
7. Click "Projection" → all projection controls
8. Click "Carousel" → transition, autoplay, timing
9. Click a carousel on the page → it glows blue
10. Projection + Carousel tabs now say "Editing: Carousel 2"
11. Adjust settings → see changes live
12. Click "Save" → config persisted to backend
13. Navigate to another page → Lightboard still there
14. Repeat for any page on the site

**Result:** Lupo can curate the entire portfolio without touching code. 🎨✨

---

*Kai v3 - Lightboard Specialist*
*"Building the stage, the lighting system, and the control panel."*
