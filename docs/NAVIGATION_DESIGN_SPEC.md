# Navigation System Design Specification

**Status**: Design Approved - Ready for Implementation
**Created**: 2025-10-06
**Author**: Kai v3 (with Lupo)
**Philosophy**: Progressive Disclosure + Spatial Consistency

---

## Core Concept

**A smart, persistent drawer navigation that progressively reveals hierarchy as users explore deeper into the content structure.**

The navigation adapts to user context - simple on homepage, expanded when exploring subcollections, providing a consistent spatial "map" of where they are in the content hierarchy.

---

## Visual Design

### Home/Top-Level State
- **Hamburger icon** in upper left (next to logo)
- Logo: "Lupo Grigio" (existing branding)
- **Subtle pulse animation** on hamburger (0.8s gentle fade, entices click)
- Clean, minimal, doesn't compete with hero image

### Drawer Open (Top-Level Collections Only)
- Slides in from left
- Shows top-level collections in list:
  - Love
  - Dark Fantasy
  - The Cafe
  - Surreal
  - Limited Sets
  - Expressions of spring
  - Fall parade
  - 2023 Art Portfolio
  - The Menagerie
  - (etc.)
- Typography: Clean, readable
- Hover state: Subtle highlight
- Background: Semi-transparent with backdrop blur (glassmorphic)

### Drawer Expanded (With Subcollections)
- **Width grows dynamically** based on depth:
  - Depth 0 (top-level): 240px
  - Depth 1 (one level of subs): 280px
  - Depth 2 (two levels of subs): 320px
  - Depth 3 (three levels of subs): 360px
  - Max depth: 3 (4 total levels including root)

- **Visual hierarchy:**
  - **Top-level collection**: Bold, larger (e.g., "Love")
  - **Subcollections**: Indented 16px, slightly smaller font, lighter color
  - **Active page**: Soft-cornered box highlight around text
  - **Example:**
    ```
    Home
    Love ◄ (if on Love parent page)
      ├─ Cuddling ◄ (soft box if active)
      ├─ Mixed Media
      ├─ Immersive
      ├─ Surreal Love
      ├─ Watercolor
      ├─ Snow Walk
      ├─ Snow Cuddles
      └─ Windowbox Doves
    Dark Fantasy
    The Cafe
    ```

---

## Behavior Specification

### Desktop Behavior

#### Scenario 1: Home → Collection with Subcollections
1. User on homepage, drawer closed
2. User clicks hamburger → drawer opens (top-level collections visible)
3. User clicks "Love" (has subcollections)
4. **Page transitions to Love collection**
5. **After page loads** → drawer **expands** to show Love's subcollections
6. Expansion animation: Smooth, 300ms ease
7. Drawer **remains open**, user can now click subcollections

#### Scenario 2: Navigating Between Subcollections
1. User on "Love > Cuddling" (drawer open, showing Love's subs)
2. User clicks "Mixed Media" in drawer
3. Page transitions to "Love > Mixed Media"
4. Drawer stays open, highlight moves to "Mixed Media"
5. Smooth, efficient navigation

#### Scenario 3: Collection WITHOUT Subcollections
1. User clicks "Dark Fantasy" (no subcollections)
2. Page transitions to Dark Fantasy
3. Drawer **closes automatically** (300ms delay, smooth collapse)
4. Clean page, images take center stage

#### Scenario 4: Back to Home/Top-Level
1. User clicks Home or another top-level collection
2. Drawer **collapses** back to top-level only (no subcollections showing)
3. Width animates back to base size
4. New collection expands if it has subcollections

### Mobile Behavior (≤768px)

#### Key Difference: Delayed Auto-Collapse with Visual Storytelling

1. User clicks hamburger → drawer slides in (full overlay, slightly narrower)
2. User clicks "Love" (has subcollections)
3. Page transitions to Love collection
4. **After page loads** → drawer expands to show subcollections
5. **Subcollections pulse gently** (soft color cycle, subtle scale - "Hey! Look at me! There's more!")
6. **After 2.5 seconds** → drawer begins to collapse:
   - Subcollections **fade and ghost out** (opacity 1.0 → 0.3, position shifts slightly)
   - Drawer slides back (600ms smooth animation)
   - User sees the hint: "there were subcollections there!"
7. User can re-open drawer anytime to explore subcollections

**Purpose**: Give mobile users time to **discover** subcollections exist, without permanently stealing screen space.

---

## Breadcrumb Navigation

### Desktop (Web)
- **Position**: To the right of logo in top nav bar
- **Format**: `Home > Love > Cuddling`
- **Styling**:
  - Light text, subtle opacity (0.7)
  - Clickable links (each level is a link)
  - Separator: `>` or `/` or custom icon
  - Current page: slightly bolder/full opacity
- **Always visible** (not part of drawer)

### Mobile
- **Really tiny breadcrumbs** below logo? Or skip entirely?
- **Alternative**: Show current path in drawer header when open
  - Example: Drawer header shows "Love → Cuddling" at top
- **TBD**: Test both approaches, see what feels better

---

## Animation Details

### Drawer Slide-In/Out
- **Duration**: 300ms
- **Easing**: `cubic-bezier(0.4, 0.0, 0.2, 1)` (smooth deceleration)
- **Origin**: Left edge

### Subcollection Expansion
- **Duration**: 300ms
- **Easing**: `ease-out`
- **Width change**: Animated simultaneously with list reveal
- **Stagger**: Subcollections fade in with 30ms stagger (first to last)

### Mobile Auto-Collapse (with Subcollection Hint)
- **Pulse animation on subcollections:**
  - Duration: 2 seconds total (repeats 2-3 times before collapse)
  - Soft color cycle: white → pale blue → white
  - Subtle scale: 1.0 → 1.02 → 1.0
  - Opacity: 1.0 (fully visible)

- **Ghost-out animation:**
  - Starts at 2.5s after drawer expansion
  - Duration: 600ms
  - Opacity: 1.0 → 0.3
  - Transform: translateX(0) → translateX(-8px)
  - Drawer slides out simultaneously

### Active Page Highlight
- **Soft-cornered box** around active item
- Border-radius: 6px
- Background: `rgba(255, 255, 255, 0.1)`
- Border: `1px solid rgba(255, 255, 255, 0.2)`
- Transition: 200ms ease (when switching pages)

---

## Technical Considerations

### State Management
- **Current location**: Track collection + subcollection hierarchy
- **Drawer state**: Open/closed/expanded
- **Active item**: Highlight currently viewed page
- **Window width**: Detect mobile vs desktop

### URL Structure
- Top-level: `/collections/love`
- Subcollection: `/collections/love/cuddling`
- Breadcrumb derives from URL path

### Dynamic Width
- CSS variable: `--drawer-width`
- JavaScript calculates based on hierarchy depth
- Smooth transition when depth changes

### Mobile Detection
- Breakpoint: 768px
- Touch event handling (swipe to close drawer)
- Viewport height considerations (mobile browser chrome)

---

## User Experience Goals

1. **Progressive Disclosure**: Don't overwhelm on first visit
2. **Spatial Consistency**: Drawer becomes user's mental "map"
3. **Efficient Navigation**: Minimize clicks to explore subcollections
4. **Visual Delight**: Subtle animations guide and entice
5. **Mobile-Friendly**: Respect limited screen space, but still reveal structure

---

## Implementation Priority

1. ✅ **Core drawer component** (open/close, top-level collections)
2. ✅ **Subcollection expansion** (desktop behavior)
3. ✅ **Active page highlighting**
4. ✅ **Dynamic width system**
5. ✅ **Breadcrumb navigation** (desktop)
6. ⏳ **Mobile delayed auto-collapse** (with pulse/ghost animations)
7. ⏳ **Mobile breadcrumbs** (test minimal version)
8. ⏳ **Touch gestures** (swipe to close)

---

## Design Notes

- **No infinite depth**: Max 3 levels of subcollections (4 total including root)
- **Glassmorphic style**: Semi-transparent with backdrop blur
- **Accessibility**: ARIA labels, keyboard navigation support
- **Performance**: Smooth 60fps animations, debounced resize handlers

---

## Visual Reference

```
┌─────────────────────────────────────┐
│ [☰] Lupo Grigio    Home > Love      │  ← Top nav bar
└─────────────────────────────────────┘
    │
    │ (drawer slides from left)
    ▼
┌──────────────┐
│ Home         │
│ Love ◄────   │  ← Active collection (bold)
│   Cuddling ■ │  ← Active page (highlighted)
│   Mixed Med  │
│   Immersive  │
│   Surreal Lo │
│ Dark Fantasy │
│ The Cafe     │
│ Surreal      │
└──────────────┘
```

---

**Status**: Ready for prototype implementation in navigation-lab! 🚀

---

*"Progressive disclosure is not about hiding information - it's about revealing it at the right moment."*
— Kai v3
