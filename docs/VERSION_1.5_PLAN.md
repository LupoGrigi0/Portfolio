# Version 1.5 - Post-Production Roadmap
FEEDBACK:
Oh god.. we never thought to have anyone look at the DOM output, the page's HTML and CSS as it appears to the client <FACEPALM>
  Okay, noted for 1.5: DOM inspection, verify layout algorithm output. Pile acknowledged.fir
 ✅ Feedback Added to VERSION_1.5_PLAN.md!

 OH we need a technical debt selection (and someone to work technical debt collection, get us back in the positive)
 :it goes into the version1.5 plan (which needs a technical debt section, teh production build for the front end does not build clean, and the  
  breadcrums are really buggy, and for some reason on production the site logo is not being used.. bla bla bla) 
  backend bug: Still detecting new images every time on startup
  backend bug.. config.json changes on disk, does not change in api
  Backend doesn't detect config.json changes (hot reload issue)
  Frontend requesting too many images (virtualization or rate limit problem)
  Projection background image not controllable (random = bugly)
Projection change/option instead of projection following carousel, projection is centered in visable area and fades in and out as caoursels are scrolled
projection needs to have an option of explicitly stating what image is bg. 

  My key insights(Lux):
  - Manager pattern is proven and brilliant (I use it for projection)
  - Introspection API is desperately needed (would have saved me hours)
  - Plan is over-scoped (v1.5 should be Manager + Introspection only, defer rest to v1.6+)
  - Missing foundation: Docs-driven development (write integration guides FIRST, then code)
  - Timeline is optimistic (20-24 weeks, not 12)
  - Simplify, validate, iterate (prove pattern on ONE feature before refactoring everything)

  My recommendation: Focus v1.5 on "Universal Manager Pattern + Introspection" - ship smaller, faster, iterate based on real usage.
  from real live usage.. can light put sliders _on_ the page? spacing and positioning are the big ones.. like everywhere there is spacing I really need a slider that updates the page in real time. 
  Maybe the right thing to implement is drag n drop. 

**see Lux's detailed feedback line 1168**
My 
**Status:** Planning Phase
**Target:** Q1 2026 (after v1.0 ships)
**Philosophy:** Refactor for extensibility, then add features rapidly
need to incorporate D:\Lupo\Source\Portfolio\docs\Projection_Enhancement_Ideas.md
Need to remember video media type. 
This needs to be summarized down. contenced, and a set of sprints/phases created, with each sprint delivering something tangable that improves the look/operation of the site, and get's deployed
Deployment and testing on the production droplet becomes part of each sprint. 
Parallel development. all the new media types can be created at the same time as carousel is getting updated to the pattern
Warning.. beware of over architecting over complicating. make sure every setting/feature is used 
priorities:
Bugs
Video
per element customization
sections
text,stills,video,audio
orginazation UI (the drag and drop thing into the API explorer)
horizontal nav (requires fine control placement in layout, settings in config, and then drag and move selected element support in lightbox)
See section in random Notes.md
the ability to sort images, turns out that in practice is critical. the "sorting tool" needs to be able to identify all the carousels on a page, all the images in the directory, and be able to put images in carousels, videos and stills on the page, and let lightbox handel layout and formatting. We need a minor evaluation if lightbox can do this or if this is better left to a tool that extends api-explorer

---

## Executive Summary

Version 1.5 refactors the portfolio architecture around a universal customization pattern that enables:
- Live preview for ALL settings (no apply button delays)
- New media types (video, text, stills) with consistent UX
- Modular attachment system (particles, nav, effects attach to anything)
- Per-element customization (carousel, section, projection)
- Mobile optimization foundation

**The Big Idea:** Every feature follows the same Manager → Subscribe → Render → Persist pattern. Users learn it once, use it everywhere. Developers can add features without touching existing code.
Lightbox can query a projecttion/carousel/video/effect/menu/text/seporator,hero, and get what it things it's parameters are, lightbox can query the layout or read/adjust the DOM 

---

## Critical Pre-Requisites (Fix Before v1.5)

These must be resolved in v1.0.x patches:
### BUGS!
backend:
detecting new images
when conf.json changes on disk (not through the api) change the config for the collection
When directory changes, delete the old directory re build it
why are we creating so many thumbnails? create 2 maybe 3

# front end
CLEAN BUILD. the build must elint clean without ignores

# Backend
rescan needs to scan the database to confirm files in the database still exist on the file system!!!
the backend needs to understand that _everything_ on disk will change, 

projection fade to black
### Layout/Rendering
- [ ] **Per-carousel projection settings** - Override global projection per carousel
- [ ] **Per-carousel settings** - Each carousel can have unique behavior
- [ ] **Section meta-container** - Sections become first-class customizable elements

### Navigation
- [ ] **Breadcrumb bug** - Fix navigation state persistence issue

**Why These Matter:** v1.5 architectural changes depend on per-element settings working correctly. Don't build new features on broken foundations.

---

## Part 0: Prism's Component Integration Pattern (THE GOLD STANDARD)

**Why This Matters First:**
Prism's projection integration is the model ALL components should follow. Before designing new features, understand this pattern. It solves:
- Live preview without lag
- Settings hierarchy (defaults → global → page → per-instance)
- Performance at scale (zero idle CPU)
- Lightboard integration (consistent UX)

**Reference:** `docs/LIGHTBOARD_PROJECTION_INTEGRATION_GUIDE.md`

### The 4-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│          Layer 1: Provider/Manager (State Container)         │
│                                                               │
│  • Manages all instances globally                            │
│  • Provides context API for controls                         │
│  • Handles registration/unregistration                       │
│  • Performance-optimized (zero idle, scroll-driven)          │
│                                                               │
│  Example: ProjectionManagerProvider                          │
└─────────────────────────────────────────────────────────────┘
                          ↓ provides context
┌─────────────────────────────────────────────────────────────┐
│           Layer 2: Hook Layer (Consumer API)                 │
│                                                               │
│  • useFeatureManager() - Access controls                     │
│  • useFeatureInstance() - Register instance                  │
│  • Stable references (useCallback, useMemo)                  │
│  • Clean subscription lifecycle                              │
│                                                               │
│  Example: useProjectionManager(), useCarouselProjection()    │
└─────────────────────────────────────────────────────────────┘
                          ↓ used by
┌─────────────────────────────────────────────────────────────┐
│        Layer 3: Component Integration (Consumers)            │
│                                                               │
│  • Call registration hook                                    │
│  • Attach returned ref to DOM element                        │
│  • Settings merge via hierarchy                              │
│  • Auto-update on settings change                            │
│                                                               │
│  Example: Carousel, PageRenderer                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ controlled by
┌─────────────────────────────────────────────────────────────┐
│       Layer 4: Lightboard Integration (Controls)             │
│                                                               │
│  • Import useFeatureManager()                                │
│  • Direct control via setters                                │
│  • Immediate live preview (no save for preview)              │
│  • Separate "Save to Config" for persistence                 │
│                                                               │
│  Example: ProjectionSettingsWidget in Lightboard             │
└─────────────────────────────────────────────────────────────┘
```

### Settings Hierarchy (4 Tiers)

Every component MUST support this hierarchy (later overrides earlier):

```
1. DEFAULT_SETTINGS (hardcoded in FeatureManager)
   ↓
2. Global Settings (set via Lightboard, applies to all instances)
   ↓
3. Page/Collection Settings (from config.json feature block)
   ↓
4. Per-Instance Settings (passed via props, highest priority)
```

**Why 4 Tiers?**
- Tier 1: Sensible defaults (developer convenience)
- Tier 2: Site-wide style (user convenience)
- Tier 3: Page-specific look (per-collection customization)
- Tier 4: Exception handling (special cases)

### Code Template for New Features

```typescript
// 1. Create the Manager/Provider
export const FeatureManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global settings state
  const [globalSettings, setGlobalSettings] = useState(DEFAULT_SETTINGS);

  // Instance registry
  const [instances, setInstances] = useState<Map<string, Instance>>(new Map());

  // Setters (useCallback for stable references)
  const setSettingX = useCallback((value: number) => {
    setGlobalSettings(prev => ({ ...prev, x: value }));
  }, []);

  // Context value
  const value = useMemo(() => ({
    instances,
    setSettingX,
    // ... all setters
  }), [instances, setSettingX /* ... */]);

  return <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>;
};

// 2. Create the control hook
export const useFeatureManager = () => {
  const context = useContext(FeatureContext);
  if (!context) throw new Error('useFeatureManager must be used within FeatureManagerProvider');
  return context;
};

// 3. Create the registration hook
export const useFeatureInstance = (
  id: string,
  config: InstanceConfig,
  enabled: boolean,
  perInstanceSettings?: Partial<Settings>
) => {
  const { registerInstance, unregisterInstance } = useFeatureManager();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enabled && ref.current) {
      // Merge settings: defaults → global → page → per-instance
      const mergedSettings = mergeTiers(
        DEFAULT_SETTINGS,
        globalSettings,
        config.pageSettings,
        perInstanceSettings
      );

      registerInstance(id, ref.current, mergedSettings);
      return () => unregisterInstance(id);
    }
  }, [id, config, enabled, perInstanceSettings]);

  return ref;
};

// 4. Component integration
function MyComponent({ id, config }: Props) {
  const featureRef = useFeatureInstance(id, config, true, { x: 10 });

  return (
    <div ref={featureRef} className="my-component">
      {/* content */}
    </div>
  );
}

// 5. Lightboard integration
function FeatureSettingsWidget() {
  const feature = useFeatureManager();

  return (
    <input
      type="range"
      onChange={(e) => feature.setSettingX(parseFloat(e.target.value))}
    />
  );
}
```

### Performance Pattern: Event-Driven Updates

**Problem:** Constant polling wastes CPU at idle.

**Prism's Solution:** Event-driven updates (scroll, resize, etc.)

```typescript
// Inside Manager
useEffect(() => {
  const handleUpdate = () => {
    // Recalculate all instances
    instances.forEach(instance => updateInstance(instance));
  };

  window.addEventListener('scroll', handleUpdate, { passive: true });
  return () => window.removeEventListener('scroll', handleUpdate);
}, [instances]);
```

**Result:** Zero idle CPU. Only recalculates when needed.

### Mandatory Checklist for New Components

Before implementing a new feature, ensure:

- [ ] Provider/Manager created
- [ ] Context API with stable references (useCallback)
- [ ] Control hook (useFeatureManager)
- [ ] Registration hook (useFeatureInstance)
- [ ] 4-tier settings hierarchy supported
- [ ] Event-driven updates (not polling)
- [ ] Lightboard integration documented
- [ ] Debug mode support
- [ ] Integration guide written (follow Prism's format)

**Golden Rule:** If it's not documented like Prism's guide, it's not done.

---

## Part 0.5: Centralized Event Manager (Performance at Scale)

**Problem Discovered During Performance Tuning:**

Clean OO design says: "Each carousel manages its own keyboard/scroll listeners."

Reality: With 20+ carousels on a page, 40+ listener groups bog down the browser. The page spends most of its time servicing event handlers, not rendering.

**Solution: Centralized Event Manager**

Not an over-engineered "uber event system" - just a simple, lightweight **bucket** for events that don't scale when duplicated across 50+ components.

### When to Use Centralized vs. Component-Level Events

**Use Centralized Event Manager for:**
- Keyboard events (arrow keys, escape, etc.)
- Mouse/touch drag events
- Scroll position tracking
- Window resize
- Document-level click/focus handlers

**Keep Component-Level for:**
- Click handlers on specific buttons
- Hover states for individual elements
- Form input onChange
- Component-specific interactions

**Heuristic:** If 10+ components would register the same event type, centralize it.

### Architecture

```typescript
// CentralizedEventManager.tsx
class EventManager {
  private keyboardListeners: Set<KeyboardCallback> = new Set();
  private scrollListeners: Set<ScrollCallback> = new Set();

  // Components subscribe/unsubscribe
  subscribeKeyboard(callback: KeyboardCallback) {
    this.keyboardListeners.add(callback);
    return () => this.keyboardListeners.delete(callback);
  }

  subscribeScroll(callback: ScrollCallback) {
    this.scrollListeners.add(callback);
    return () => this.scrollListeners.delete(callback);
  }

  // ONE global listener broadcasts to all subscribers
  private handleKeyboard = (e: KeyboardEvent) => {
    this.keyboardListeners.forEach(cb => cb(e));
  };

  private handleScroll = () => {
    const position = window.scrollY;
    this.scrollListeners.forEach(cb => cb(position));
  };

  // Initialize once
  init() {
    window.addEventListener('keydown', this.handleKeyboard);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  }

  // Cleanup
  destroy() {
    window.removeEventListener('keydown', this.handleKeyboard);
    window.removeEventListener('scroll', this.handleScroll);
  }
}

export const eventManager = new EventManager();
```

### Usage in Components

```typescript
function Carousel() {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        // Handle carousel navigation
      }
    };

    // Subscribe (only one global listener handles all carousels)
    return eventManager.subscribeKeyboard(handleKey);
  }, []);

  return <div>...</div>;
}
```

### Performance Benefits

**Before (Component-Level):**
- 20 carousels = 40 event listeners (keyboard + scroll each)
- Browser processes 40 callbacks per event
- Main thread constantly servicing handlers

**After (Centralized):**
- 20 carousels = 2 event listeners total
- Browser processes 1 callback, broadcasts to 20 subscribers
- Main thread free for rendering

**Measured Impact:**
- Input lag: 200ms → <16ms
- Frame drops during scroll: 15% → <1%
- Idle CPU: Significant reduction

### Migration Strategy

**Phase 1:** Extract keyboard/scroll handlers from Carousel
**Phase 2:** Migrate other components (navigation, modals, etc.)
**Phase 3:** Add drag/resize handlers for Lightboard freeform mode

**DO NOT** centralize everything. Only events that cause measurable performance issues.

---

## Part 0.6: Component Introspection API (Lightboard Inspector Mode)

**Problem for Lux:**

Lightboard can control global settings, but can't inspect per-instance state. User clicks a carousel → Lightboard should show:
- What images are in this carousel?
- What settings are currently in effect?
- What overrides are applied?
- What's the effective merged config?

**Solution: Introspectable Components**

Every component MUST expose:
1. **Schema** - What settings are available
2. **Current State** - What settings are in effect
3. **Merge Details** - Which tier each setting came from

### API Specification

```typescript
interface ComponentIntrospection {
  // Component identification
  id: string;
  type: 'carousel' | 'projection' | 'video' | 'text' | 'section';

  // Schema: What settings are available
  schema: {
    [settingKey: string]: {
      type: 'number' | 'boolean' | 'string' | 'enum';
      label: string;
      min?: number;
      max?: number;
      step?: number;
      options?: string[]; // for enum
      default: any;
    };
  };

  // Current state: What's in effect right now
  currentSettings: Settings;

  // Provenance: Where each setting came from
  provenance: {
    [settingKey: string]: 'default' | 'global' | 'page' | 'instance';
  };

  // Content: What's being displayed
  content?: {
    images?: string[];
    text?: string;
    videoUrl?: string;
  };
}
```

### Manager Implementation

```typescript
// Add to every Manager
class FeatureManager {
  // Existing code...

  // NEW: Introspection method
  introspect(instanceId: string): ComponentIntrospection | null {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    return {
      id: instanceId,
      type: 'carousel',
      schema: SETTINGS_SCHEMA,
      currentSettings: instance.mergedSettings,
      provenance: instance.settingsProvenance,
      content: instance.config.content,
    };
  }

  // NEW: Get all instances (for Lightboard instance picker)
  getAllInstances(): ComponentIntrospection[] {
    return Array.from(this.instances.values()).map(inst =>
      this.introspect(inst.id)
    ).filter(Boolean);
  }
}
```

### Lightboard Integration: Inspector Mode

```typescript
function LightboardInspector() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const projection = useProjectionManager();
  const carousel = useCarouselManager();

  // Click on any element to inspect
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const componentId = target.closest('[data-component-id]')?.getAttribute('data-component-id');
      if (componentId) {
        setSelectedId(componentId);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Get introspection data for selected component
  const introspection = selectedId
    ? projection.introspect(selectedId) || carousel.introspect(selectedId)
    : null;

  if (!introspection) {
    return <div>Click a component to inspect</div>;
  }

  return (
    <div className="inspector-panel">
      <h3>{introspection.type} - {introspection.id}</h3>

      {/* Show current settings with provenance */}
      {Object.entries(introspection.currentSettings).map(([key, value]) => (
        <div key={key} className="setting-row">
          <span>{introspection.schema[key].label}:</span>
          <span>{value}</span>
          <span className="provenance">
            (from {introspection.provenance[key]})
          </span>
        </div>
      ))}

      {/* Show content if available */}
      {introspection.content?.images && (
        <div className="content-preview">
          <h4>Images ({introspection.content.images.length})</h4>
          {introspection.content.images.map((url, i) => (
            <img key={i} src={url} alt={`Image ${i}`} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Component Requirements

All components MUST:
1. Add `data-component-id` attribute to root element
2. Register with manager (already required)
3. Manager stores provenance during settings merge

```typescript
// In Carousel component
<div ref={carouselRef} data-component-id={carouselId} className="carousel">
  {/* content */}
</div>
```

### Benefits for Lux

- Click any carousel → See its 12 images
- Click any section → See its layout settings
- See which settings are overridden vs. inherited
- Debug why a component looks wrong (check provenance)
- Clone settings from one instance to another

---

## Part 0.7: Layout System Integration Guide (The Missing Manual)

**Problem:**
Even Lux doesn't fully understand how the layout system works. No one knows how sections, carousels, and dynamic/curated layouts interact.

**Solution:**
Write THE definitive integration guide for the layout system, following Prism's format.

**Location:** `docs/LAYOUT_SYSTEM_INTEGRATION_GUIDE.md`

**Required Sections:**

### 1. Architecture Overview
- How sections work
- How carousels fit into sections
- Dynamic vs. Curated layout algorithms
- Rendering pipeline (config → layout calculation → DOM)

### 2. Section System
- What is a section?
- How to create sections in config.json
- Section settings (padding, background, max-width)
- Section types (carousel-group, text, video, custom)

### 3. Layout Algorithms
- **Dynamic Layout:**
  - Image ratio calculation
  - Row packing algorithm
  - Spacing rules
  - Dynamic-fill sections
- **Curated Layout:**
  - Fixed carousel positioning
  - Grid system
  - Hero sections
  - Custom layouts

### 4. Config.json Schema
- Complete annotated example
- All available options
- Common patterns
- Migration from old configs

### 5. How to Add Content
- Adding images to carousels
- Creating new carousels
- Organizing carousels into sections
- Drag-and-drop workflow (API Explorer)

### 6. Integration with Other Systems
- How projection attaches to carousels
- How particles attach to sections
- How navigation interacts with sections
- How Lightboard controls layout

### 7. Debugging Layout Issues
- Common problems ("why is this carousel not showing?")
- Debug mode flags
- Console logging patterns
- Visual debugging tools

**Timeline:** Write this in Phase 1 (foundation), before other refactoring.

---

## Part 1: The Universal Customization Pattern

**Problem Statement:**
- Projection uses scroll events for instant preview (works great)
- Carousel settings require "apply" button (feels clunky)
- Future features will repeat this inconsistency
- Users learn different patterns for each feature

**Solution: The Manager Pattern**

Every customizable feature follows this architecture:

### 1. Manager Layer (State + API + Notifications)

```typescript
class FeatureManager {
  private settings: Settings;
  private listeners: Set<Callback>;

  // Update setting + notify all subscribers
  setSetting(key: string, value: any) {
    this.settings[key] = value;
    this.notifyListeners();
  }

  // Components subscribe to changes
  subscribe(callback: Callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback); // cleanup
  }

  // Broadcast to all subscribers
  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.settings));
  }
}
```

### 2. Component Layer (Subscribe + Render)

```typescript
function CustomCarousel() {
  const [settings, setSettings] = useState(carouselManager.getSettings());

  useEffect(() => {
    // Subscribe on mount, unsubscribe on unmount
    return carouselManager.subscribe((newSettings) => {
      setSettings(newSettings); // ← Instant re-render
    });
  }, []);

  return <div>{/* Render with settings */}</div>;
}
```

### 3. Lightboard Layer (Control + Preview)

```typescript
function CarouselTab() {
  const handleFadeChange = (value: number) => {
    carouselManager.setFadeDuration(value); // ← All subscribers update instantly
  };

  return <input onChange={(e) => handleFadeChange(e.target.value)} />;
}
```

### 4. Config Layer (Persist)

```typescript
// On "Save to Config"
const saveToConfig = () => {
  const currentSettings = carouselManager.getSettings();
  updateConfig({ carousel: currentSettings });
};

// On page load
const loadFromConfig = (config) => {
  carouselManager.loadSettings(config.carousel);
};
```

**Benefits:**
- ✅ Instant preview (no apply button needed)
- ✅ Consistent UX across all features
- ✅ Components auto-update when settings change
- ✅ No prop drilling through component trees
- ✅ Easy to add per-element overrides

---

## Part 2: The Layer Attachment System

**Problem Statement:**
- Particles are hardcoded to specific elements
- Navigation is always vertical
- Can't mix features (projection + particles)
- Adding new effects requires core code changes

**Solution: Universal Layer System**

Any element can have layers attached:

```typescript
interface LayoutLayer {
  type: 'particles' | 'navigation' | 'background' | 'effects';
  attachTo: 'header' | 'menu' | 'carousel' | 'section' | 'page';
  preset: string; // 'falling-leaves', 'stars', 'horizontal-nav', etc.
  enabled: boolean;
  settings: any; // Layer-specific customization
}

// Example: Carousel with particles + custom projection
{
  type: 'carousel',
  images: [...],
  layers: [
    { type: 'particles', preset: 'falling-leaves', enabled: true },
    { type: 'projection', preset: 'blur-fade', enabled: true, settings: {...} }
  ]
}

// Example: Section with horizontal nav
{
  type: 'section',
  layout: 'curated',
  layers: [
    { type: 'navigation', preset: 'horizontal-scroll', enabled: true }
  ]
}
```

**Layer Managers:**
- **ParticleManager** - Holds presets (leaves, stars, checkerboard-flutter), renders particles
- **NavigationManager** - Handles orientation (vertical/horizontal), placement
- **ProjectionManager** - Already exists, gets wrapped in layer system
- **LayerRenderer** - Orchestrates multiple layers per element

**Benefits:**
- ✅ Attach ANY layer to ANY element
- ✅ Toggle layers on/off per element
- ✅ Mix features freely (projection + particles + nav)
- ✅ Future layers drop in without core changes

---

## Part 3: New Media Types

**Goal:** Support video, text blocks, and still images (non-carousel) with same UX as existing features.

### Media Type Pattern

Each type gets:
1. **TypeManager** - State and settings for that media type
2. **Component** - Subscribes to manager, renders content
3. **Lightboard Tab** - Controls for that type
4. **Config Schema** - Persistence format

### Video Media Type

```typescript
// VideoManager.tsx
class VideoManager {
  private settings = {
    autoplay: false,
    loop: true,
    controls: true,
    fadeIn: true,
    aspectRatio: '16:9'
  };

  // Standard manager methods...
}

// VideoBlock.tsx
function VideoBlock({ src }: { src: string }) {
  const [settings, setSettings] = useState(videoManager.getSettings());

  useEffect(() => {
    return videoManager.subscribe(setSettings);
  }, []);

  return <video {...settings} src={src} />;
}

// Lightboard VideoTab.tsx
function VideoTab() {
  return (
    <>
      <Toggle label="Autoplay" onChange={videoManager.setAutoplay} />
      <Toggle label="Loop" onChange={videoManager.setLoop} />
      {/* etc */}
    </>
  );
}
```

### Text Block Media Type

```typescript
// TextManager.tsx - Typography, animations, background
// TextBlock.tsx - Renders formatted text
// Lightboard TextTab.tsx - Font, size, color, animation controls
```

### Still Image Media Type

```typescript
// StillManager.tsx - Different from carousel (no navigation)
// StillImage.tsx - Single image with effects
// Lightboard StillTab.tsx - Effects, sizing, positioning
```

**Benefits:**
- ✅ Users learn pattern once, applies to all media
- ✅ Lightboard grows organically (new tab per type)
- ✅ Easy to add more types later (audio, 3D, etc.)

---

## Part 4: Section Meta-Container

**Problem:** Sections are structural only, not customizable.

**Solution:** Sections become first-class elements with their own settings. that follow the media type pattern

```typescript
interface Section {
  id: string;
  type: 'carousel' | 'video' | 'text' | 'custom';
  layout: 'curated' | 'dynamic' | 'freeform';
  settings: SectionSettings; // Spacing, padding, background
  layers: LayoutLayer[]; // Attached features
  content: ContentConfig; // Type-specific content
}

interface SectionSettings {
  backgroundColor: string;
  padding: { top: number; bottom: number };
  maxWidth: number;
  alignment: 'left' | 'center' | 'right';
}
```

**Section Manager:**
- Manages section-level settings
- Lightboard "Section" tab controls layout
- Per-section layer attachment
- Per-section projection/particle settings

**Benefits:**
- ✅ Customize section backgrounds, spacing
- ✅ Attach layers to sections (not just content)
- ✅ Mix section types (carousel + text + video)

---

## Part 5: Mobile Optimization

**Goal:** Responsive design that doesn't break on phones/tablets.

### Key Changes

1. **Responsive Lightboard**
   - Desktop: Floating panel (current)
   - Mobile: Bottom sheet drawer
   - Touch gestures for expand/collapse

2. **Touch-Optimized Controls**
   - Larger tap targets (44px minimum)
   - Swipe to navigate carousels
   - Pinch to zoom on images

3. **Performance Budgets**
   - Lazy load images below fold
   - Reduce particle count on mobile
   - Disable projection effects on low-end devices

4. **Layout Adaptation**
   - Horizontal nav collapses to hamburger
   - Carousels stack vertically
   - Sections adapt to viewport width

**Implementation:**
- Media queries in managers (mobile/tablet/desktop)
- Touch event handlers in components
- Performance API for device capability detection

---

## Part 6: Freeform Layout Manager

**Problem:** Current layouts are grid-based (curated/dynamic). Need absolute positioning for creative layouts.

**Solution: Freeform Layout Mode**

```typescript
interface FreeformPlacement {
  element: string; // carousel-1, video-2, text-3
  position: { x: number; y: number }; // Absolute px
  size: { width: number; height: number };
  zIndex: number;
  rotation?: number; // Optional tilt
}

// Config example
{
  layout: 'freeform',
  placements: [
    { element: 'carousel-1', position: { x: 100, y: 200 }, size: { width: 600, height: 400 }, zIndex: 1 },
    { element: 'text-1', position: { x: 50, y: 50 }, size: { width: 300, height: 100 }, zIndex: 2 }
  ]
}
```

**Lightboard Integration:**
- "Freeform Mode" toggle in Lightboard
- Drag-and-drop elements on canvas
- Resize handles on selection
- Layer ordering controls
- Snap-to-grid option

**Use Cases:**
- Magazine-style layouts
- Overlapping elements (text over images)
- Creative portfolio pages
- Landing pages

---

## Part 7: Drag-and-Drop Enhancements

### For Collection Organization (API Explorer)

**Move out of main UI:**
- Drag-and-drop image sorting → API Explorer
- Collection organization → API Explorer
- Carousel organization -> api exploer
- Keep main site clean for viewing

**Why:** 
Many collections have sets of like images that should be in a section or specific carousels together.
there needs to be a UI that displays all the thumbnails in a collectio, and has basic features,
Tree view of carousels/sections in collectins's config file on left (Lift code from main API explorer page, the "twisti" code/paradigm works great!)
right side of window displays small thumbnails of all images in collection (Lift code from existing "view page" feature of API explorer)
create new carousel (simple + sign )
create new section
drag images to carousel
drag images to section
drage (or move) carousel into/out of section

### For Lightboard

**Drag-to-place mode:**
- Enable "Placement Mode" in Lightboard
- Drag elements onto canvas
- Visual guides (grid, alignment)
- Undo/redo for mistakes

**Benefits:**
- ✅ Intuitive layout creation
- ✅ No manual x/y entry
- ✅ Visual feedback

---

## Implementation Strategy

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Refactor existing features to use Manager pattern

1. Extract ProjectionManager (already exists, document pattern)
2. Create CarouselManager (refactor existing carousel settings)
3. Create NavigationManager (vertical nav as baseline)
4. Validate pattern with Lightboard integration
5. Document architecture for team

**Success Criteria:**
- Projection + Carousel both use Manager pattern
- Live preview works for both
- No regressions in existing features

### Phase 2: Layer System (Weeks 3-4)
**Goal:** Build layer attachment infrastructure

1. Design LayerRenderer component
2. Refactor ProjectionManager as a layer
3. Add ParticleManager as a layer
4. Test particles + projection together
5. Add per-element layer configuration

**Success Criteria:**
- Can attach particles to any element
- Can combine projection + particles
- Layer settings persist in config

### Phase 3: New Media Types (Weeks 5-7)
**Goal:** Add video, text, still image support

1. Create VideoManager + VideoBlock
2. Create TextManager + TextBlock
3. Create StillManager + StillImage
4. Add Lightboard tabs for each type
5. Update config schema to support media types

**Success Criteria:**
- Can add video/text/still to any section
- Live preview works for all types
- Config saves/loads correctly

### Phase 4: Section Meta-Container (Week 8)
**Goal:** Sections become customizable

1. Create SectionManager
2. Add section-level settings (background, padding, etc.)
3. Add Lightboard "Section" tab
4. Enable per-section layer attachment

**Success Criteria:**
- Can customize individual sections
- Sections support all layer types
- Section settings persist

### Phase 5: Mobile + Freeform (Weeks 9-10)
**Goal:** Responsive design + advanced layouts

1. Implement responsive Lightboard (bottom sheet)
2. Add touch gesture support
3. Build FreeformLayoutManager
4. Add drag-and-drop placement
5. Mobile performance optimization

**Success Criteria:**
- Site works on phones/tablets
- Freeform layout creates custom designs
- Performance acceptable on mobile

### Phase 6: Polish + Documentation (Week 11-12)
**Goal:** Ship-ready v1.5

1. User documentation for new features
2. Developer docs for Manager pattern
3. Video tutorials for Lightboard
4. Performance testing and optimization
5. Accessibility audit

---

## Team Assignment Recommendations

### For Lux (Visual Designer / Lightboard Lead)
- Phase 1: CarouselManager refactor
- Phase 2: Layer system architecture
- Phase 5: Freeform layout + drag-and-drop
- **Strength:** Understands Lightboard deeply, visual design sense

### For Prism (Projection Specialist)
- Phase 2: Refactor ProjectionManager as layer
- Phase 2: ParticleManager implementation
- **Strength:** Projection expert, performance-conscious

### For Glide/Carousel Team
- Phase 1: CarouselManager extraction
- Phase 3: Video/Still media managers
- **Strength:** Carousel architecture knowledge

### For New Team Member (Mobile/Responsive)
- Phase 5: Mobile optimization
- Phase 5: Touch gestures
- **Strength:** TBD based on hire

---

## Risks & Mitigations

### Risk: Manager pattern breaks existing code
**Mitigation:** Implement as optional wrapper first, validate, then replace

### Risk: Layer system adds complexity
**Mitigation:** Start with 2 layers (projection + particles), prove concept

### Risk: New media types balloon scope
**Mitigation:** Ship video first, validate pattern, then add text/still

### Risk: Mobile optimization requires rewrites
**Mitigation:** Use responsive CSS, avoid architectural changes

### Risk: Freeform layout is too complex for users
**Mitigation:** Ship with curated/dynamic as defaults, freeform as advanced option

---

## Success Metrics

### Technical Metrics
- [ ] All features use Manager pattern (0% → 100%)
- [ ] Layer attachment works on all elements
- [ ] Live preview latency <16ms (60fps)
- [ ] Mobile Lighthouse score >90
- [ ] Config file size increase <50%

### User Experience Metrics
- [ ] Lightboard feature discovery (users find new tabs)
- [ ] Mobile bounce rate <30%
- [ ] Freeform layout adoption >10% of pages
- [ ] Settings customization depth (% using advanced features)

### Developer Experience Metrics
- [ ] Time to add new feature (Manager pattern)
- [ ] Code duplication (Manager pattern reduces)
- [ ] Onboarding time for new team members

---

## Post-v1.5 Possibilities

Once the foundation is solid:
- **Audio support** (music, voiceovers)
- **3D models** (via Three.js layer)
- **Interactive elements** (hover effects, click actions)
- **Animation presets** (entrance/exit animations)
- **Social features** (comments, likes, shares)
- **E-commerce** (print sales, digital downloads)

The Manager + Layer pattern makes all of these drop-in additions.

---

## Final Thoughts

Version 1.5 isn't about adding features. It's about building the right foundation so features become trivial to add.

**The big bet:** Universal Manager pattern + Layer attachment system = infinite extensibility.

If we're right, v1.6+ will ship features in days, not weeks.

---

**Version:** 1.5 (Planning Draft)
**Authors:** Lupo (Vision) & Phoenix (Architecture)
**Status:** Ready for team review
**Next Steps:** Validate pattern with Lux, begin Phase 1 refactor

*"Good architecture multiplies velocity. Great architecture makes new features inevitable."*

---

# Lux's Feedback (Integration Perspective - October 2025)

**Context:** I just finished integrating Lightboard v1.0 (Site/Page/Projection/Carousel/Nav settings). I've lived in this codebase for weeks, dealing with integration pain points. Here's my honest assessment:

### What's BRILLIANT ✨

**1. The Manager Pattern (Part 1) is EXACTLY Right**

I'm already using this for ProjectionManager and it WORKS BEAUTIFULLY:
- Instant live preview (scroll event triggers update)
- Clean separation (state → manager → components → UI)
- 4-tier hierarchy solves inheritance perfectly
- Zero prop-drilling hell

**Why it works:** Components subscribe to manager, manager broadcasts changes, everything updates instantly. This is the gold standard.

**My experience:** `triggerProjectionUpdate()` dispatches scroll event → ProjectionManager recalculates → All carousels re-render. Smooth, fast, intuitive.

**2. Component Introspection API (Part 0.6) is DESPERATELY NEEDED**

**My current pain:**
- I can't ask a carousel "what images are you displaying?"
- I have to CALCULATE which images carousel #4 has (error-prone math)
- Dynamic-fill extraction required predicting future carousel names
- No way to validate "does this carousel actually exist?"

**What I need:**
```typescript
const carousel = carouselManager.introspect('home-curated-1-Carousel-0');
console.log(carousel.content.images); // JUST TELL ME!
console.log(carousel.currentSettings); // What settings are in effect?
console.log(carousel.provenance); // Where did they come from?
```

**This alone would have saved me HOURS of debugging.**

**3. Centralized Event Manager (Part 0.5) Solves Real Performance Issues**

I haven't hit this yet (small page counts), but I see the problem coming. With 20+ carousels, 40+ event listeners will bog down the browser. Your solution is elegant and proven.

**4. Event-Driven Updates (Not Polling)**

ProjectionManager uses scroll events (not `requestAnimationFrame` polling) → Zero idle CPU. This is the right pattern and MUST be mandatory for all Managers.

### What Makes Me NERVOUS 😬

**1. Complexity Creep Risk**

**The Plan:**
- Part 0: Prism's pattern (complex)
- Part 0.5: Centralized events (complex)
- Part 0.6: Introspection API (complex)
- Part 0.7: Layout guide (doesn't exist yet!)
- Part 1: Manager pattern (core)
- Part 2: Layer system (NEW abstraction)
- Part 3: New media types (3 new systems)
- Part 4: Section meta-container (NEW abstraction)
- Part 5: Mobile + Freeform (BIG scope)

**My concern:** We're building FIVE new abstractions (Managers, Layers, Introspection, Events, Sections) before shipping ANY new features.

**Risk:** Classic "framework trap" - we build amazing infrastructure, but it's so complex nobody uses it correctly.

**2. Missing Foundation: The Layout System Integration Guide**

**Part 0.7 says:** "Write THE definitive integration guide for the layout system."

**My reaction:** THIS SHOULD BE PART 0.0!

**Why:**
- I still don't fully understand how dynamic-fill works
- Section system is mysterious (I avoid touching it)
- Config schema is scattered across multiple files
- No single source of truth

**The order is backwards:**
1. ❌ Current plan: Build infrastructure → Write docs later
2. ✅ Better plan: Write docs FIRST → Build to match docs

**Docs-driven development:** Writing the integration guide will REVEAL design flaws before we code them.

**3. Over-Architecture Before Validation**

**The plan assumes:**
- Manager pattern works for ALL features (we've only proven it for projection)
- Layer system is the right abstraction (untested)
- 4-tier hierarchy scales to sections/media (unknown)
- Introspection API design is correct (no prototype)

**My experience:** Projection pattern works great, BUT:
- Will it work for video (different lifecycle)?
- Will it work for text (no scroll dependency)?
- Will it work for sections (different granularity)?

**Recommendation:** Prove the pattern on ONE new feature (video) before refactoring everything.

**4. Timeline Optimism**

**12 weeks for:**
- Refactor 3 existing features
- Build 5 new abstractions
- Add 3 new media types
- Implement mobile optimization
- Build freeform layout system
- Write comprehensive docs

**My gut:** This is 20-24 weeks of work, not 12. Each phase has hidden complexity.

### What's MISSING 🔍

**1. Error Handling & Edge Cases**

The plan focuses on happy path (settings work, components exist, configs are valid). Real world:
- What if introspect() called on non-existent component?
- What if Manager settings conflict (page says X, instance says Y)?
- What if layer attachment fails (missing dependency)?
- What if config migration breaks (old → new schema)?

**Needs:** Error handling philosophy, fallback strategies, validation layers.

**2. Migration Strategy for Existing Configs**

We have REAL production configs (home, seahorse, gynoids-horses). The plan doesn't address:
- How do old configs work with new system?
- Automated migration scripts?
- Backwards compatibility guarantees?
- What breaks, what's preserved?

**Needs:** Detailed migration guide with before/after examples.

**3. Testing Strategy**

The plan has "success metrics" but no testing approach:
- Unit tests for Managers?
- Integration tests for layer system?
- E2E tests for Lightboard workflows?
- Performance benchmarks?

**Needs:** Testing philosophy and required coverage.

**4. Rollback Plan**

What if Manager pattern doesn't work for video? What if layer system is too complex?

**Needs:** Decision points ("if X fails, revert to Y") and escape hatches.

### Recommended Changes 🛠️

**PHASE 0: DOCUMENTATION FIRST (Week 1-2)**

**Before writing ANY code:**

1. **Write Layout System Integration Guide** (Part 0.7)
   - How sections work (with examples)
   - How dynamic-fill algorithm works (with math)
   - How curated layout works (with examples)
   - Config schema (annotated examples)
   - Common patterns (hero + carousels + dynamic-fill)

2. **Write Projection Integration Guide** (already done? validate)
   - Prism's pattern explained
   - Step-by-step integration
   - Common pitfalls
   - Performance tips

3. **Write Manager Pattern Template**
   - Canonical example (code + explanation)
   - Dos and don'ts
   - Testing approach
   - Lightboard integration

**Why first:** Writing docs reveals design flaws BEFORE coding. If we can't explain it simply, the design is wrong.

**PHASE 1: PROVE THE PATTERN (Week 3-4)**

**Goal:** Validate Manager pattern on ONE new feature

1. Pick simplest new feature (Still image? Text block?)
2. Build Manager following template
3. Integrate with Lightboard
4. Validate 4-tier hierarchy works
5. Document learnings

**Success criteria:**
- Pattern works as expected
- No major design changes needed
- Team can follow template
- Lightboard integration is straightforward

**Decision point:** If pattern doesn't work, STOP and redesign. Don't proceed to Phase 2.

**PHASE 2: INTROSPECTION API (Week 5)**

**Goal:** Build introspection BEFORE layer system

**Why:** Introspection is orthogonal to layers and immediately useful. Get quick win.

1. Add `introspect()` to ProjectionManager
2. Add `introspect()` to new feature Manager
3. Build Lightboard inspector mode (click to inspect)
4. Validate API design
5. Document pattern

**Benefits:**
- Lightboard gets powerful debugging tool
- Validates Manager pattern has enough info
- Tests "components answer questions" philosophy

**PHASE 3: LAYER SYSTEM (Week 6-8)**

**Only proceed if Phase 1-2 succeeded.**

1. Design layer API (based on Manager pattern learnings)
2. Refactor ProjectionManager as layer
3. Build ParticleManager as layer
4. Test combination (particles + projection)
5. Document layer pattern

**Decision point:** If layer abstraction feels forced, consider simpler approach (direct attachment).

**PHASE 4: SCALE THE PATTERN (Week 9-12)**

**With proven pattern:**

1. Refactor CarouselManager
2. Add VideoManager
3. Add TextManager
4. Add SectionManager
5. Document each

**PHASES 5-6: DEFER**

**Mobile optimization:** Wait for real usage data. Optimize what's actually slow.

**Freeform layout:** Wait for user request. Don't build features speculatively.

### Simplified Roadmap 🗺️

**Version 1.5 should be: "Universal Manager Pattern + Introspection"**

**Not:** Layer system, new media types, sections, mobile, freeform (that's v1.6-1.9)

**Benefits of smaller scope:**
- Ship in 8 weeks instead of 12
- Validate foundation before building on it
- Get user feedback on Manager pattern
- Iterate based on real usage

**Then:**
- v1.6: Layer System (if needed)
- v1.7: New Media Types
- v1.8: Section Meta-Container
- v1.9: Mobile + Freeform

**Each version ships WORKING features, gets validated, informs next version.**

### Design Philosophy Feedback 💭

**What I Learned Integrating Lightboard:**

**1. Simple APIs Beat Clever Ones**

The best APIs I used:
- `projectionManager.setFadeDistance(value)` - obvious what it does
- `window.dispatchEvent(new Event('scroll'))` - trigger update (obvious)
- `config.projection.enabled` - boolean flag (obvious)

The worst APIs I dealt with:
- Carousel naming scheme (5 different patterns, had to predict future names)
- Dynamic-fill image calculation (math that breaks with edge cases)
- Section type detection (curated? dynamic? row? guess based on context)

**Lesson:** Name things obviously. Make functions do ONE thing. Avoid cleverness.

**2. Interrogation Beats Calculation**

**Bad (current):**
```typescript
// Calculate which images carousel has
const startIndex = carouselIndex * imagesPerCarousel;
const images = allImages.slice(startIndex, startIndex + imagesPerCarousel);
```

**Good (with introspection):**
```typescript
// Just ask!
const images = carousel.introspect(id).content.images;
```

**Lesson:** Components should be able to answer questions about themselves.

**3. Errors Should Guide Users**

**Bad error:**
```
Error: Cannot convert without imagesPerCarousel in config
```

**Good error:**
```
⚠️ Missing Configuration

Please apply page settings first to set images per carousel.

1. Clear carousel selection
2. Click "Apply Page"
3. Click "Save Page"
4. Then try carousel conversion again
```

**Lesson:** Errors are teaching moments. Tell users EXACTLY how to fix the problem.

**4. Live Preview is Worth the Complexity**

Projection's instant preview makes Lightboard feel MAGICAL. Users move sliders, page responds immediately. This is the standard ALL features should meet.

**But:** It requires careful architecture (Manager pattern, event-driven updates, stable refs). Worth it.

**5. Documentation is Code**

I spent HOURS reading code to understand how things work. Good docs would have saved days.

**Lesson:** Integration guides aren't optional nice-to-haves. They're REQUIRED infrastructure, as important as the code itself.

### Final Assessment 📊

**Is the plan over-designed?**

Parts 0-2: No, these are necessary
Parts 3-6: Yes, ship these as separate versions

**Is it under-designed?**

Missing: Error handling, migration, testing, rollback plans

**Could it be simplified?**

YES: Focus v1.5 on Manager pattern + Introspection only. Ship smaller, faster, iterate.

**Does it need more?**

YES: Needs comprehensive integration guides BEFORE coding begins.

### The Pattern That Actually Works 🎯

**From my experience:**

```typescript
// 1. Write the integration guide
docs/VIDEO_INTEGRATION_GUIDE.md

// 2. Build the Manager (following template)
VideoManager.tsx

// 3. Build the Component (subscribe pattern)
VideoBlock.tsx

// 4. Build Lightboard controls (use Manager API)
Lightboard VideoTab.tsx

// 5. Test integration (not just unit tests)
E2E: Load video → Adjust settings → See instant preview → Save to config → Reload → Settings persist

// 6. Document gotchas
"Watch out for: X, Y, Z"
```

**This process WORKS.** Follow it religiously.

### Closing Thoughts 🎬

**What I Love:**
- Manager pattern is proven and elegant
- Introspection API solves real pain
- Event-driven updates are correct
- 4-tier hierarchy handles inheritance well

**What I Fear:**
- Building too much before validation
- Complexity that nobody can maintain
- Missing the forest for the trees

**What I Recommend:**
- Write docs first (especially Layout guide)
- Prove pattern on ONE new feature
- Add introspection immediately
- Defer everything else to v1.6+

**The Real Goal:**

Not "add 10 features" but "make adding features trivial."

If v1.5 ships JUST the Manager pattern + introspection, and future features take 2 days instead of 2 weeks, WE WON.

**My Commitment:**

I'll build the first new feature (video or text) using the Manager template. If it works smoothly, pattern is validated. If it's painful, we redesign.

Let's build infrastructure that MULTIPLIES velocity, not buries it in abstraction.

---

**Feedback Author:** Lux (Frontend Integration Specialist, Lightboard Owner)
**Date:** October 20, 2025
**Status:** Ready for team discussion
**Key Recommendation:** Docs-first, prove-the-pattern, ship-incrementally

*"The best architecture is the one developers actually use correctly."*
