  # Things that need immedate fixing
  ## layout/rendering
  per-carousel projection settings
  per-carousel settings
  ## Navagation
  breadcrumb bug
  # General Bugs
  
  # Version 1.5
  the Goals
  new media types
  particles
  particles attach to anything
  everybody uses the same customization pattern to support lightbox and live preview
  "Section" "meta container"
  "Section" get's the same customization pattern, per section carousel,projection, settings
  horizontal navagation as well as verticle
  mobile optimizaton
  * Drag and drop collection orginaztion/image sorting .. out of main UI. add to API explorer. 
  * "free form" placement for ALL MEDIA TYPES INCLUDING sections.. new layout manager, new per type settings
  * "drag and place" Lightbox get's option to drag and drop 
  footer section as a custom section

  # EVERYBODY DOES customization the same way
  "everybody" meaning all the components/media types/effects
  including navagation
Read D:\Lupo\Source\Portfolio\docs\LIGHTBOARD_PROJECTION_INTEGRATION_GUIDE.md
Every mediat type/component should integrate the same way 
  ## The Live Update Pattern (What I Use)

  Function: triggerProjectionUpdate() (Lightboard.tsx:90-97)

  const triggerProjectionUpdate = () => {
    window.dispatchEvent(new Event('scroll'));
  };

  // Wrapper setters
  const setFadeDistanceWithUpdate = (value: number) => {
    projectionManager.setFadeDistance(value);
    triggerProjectionUpdate(); // ← Instant preview!
  };

  Why It Works:
  - ProjectionManager recalculates on scroll events
  - Dispatch scroll = instant recalc = smooth preview
  - No polling, no delays, no jitter

  ---
  The Universal Pattern (My Recommendation)

  Every interactive element should follow:

  1. Manager (State + API + Notifications)

  class FeatureManager {
    private settings: Settings;
    private listeners: Set<Callback>;

    setSetting(value) {
      this.settings.value = value;
      this.notifyListeners(); // ← Broadcast change
    }

    subscribe(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
  }

  2. Component (Subscribe + Render)

  useEffect(() => {
    return featureManager.subscribe((settings) => {
      setLocalSettings(settings); // ← Instant update
    });
  }, []);

  3. Lightboard (Control + Preview)

  // Slider change → Manager update → All subscribed components react
  <input onChange={(e) => featureManager.setSetting(e.target.value)} />

  4. Config (Persist)

  // Apply button writes manager state to config
  // Page load reads config into manager

  ---
  Architectural Advice for Team Members

  Team Member: Carousel Enhancement

  Goal: Live carousel settings preview (like projection)

  Pattern:
  1. Create CarouselManager (follow ProjectionManager structure)
  2. Add subscribe/notify system
  3. CustomCarousel subscribes on mount
  4. Lightboard Carousel tab controls manager
  5. Settings changes → instant preview across ALL carousels
  6. Per-carousel overrides still work (check override, else use global)

  Integration Point: src/components/Carousel/CarouselManager.tsx

  Benefits: Turn ALL knobs instantly, see changes immediately, per-carousel customization preserved

  ---
  Team Member: Text/Video/Still Content

  Goal: New content types with same UX

  Pattern:
  1. ContentManager<TypeSettings> for each type
  2. Component subscribes to manager
  3. Lightboard tab for type (same as Projection/Carousel tabs)
  4. Settings → instant preview → apply → save
  5. Config serialization handles persistence

  Integration Point: src/components/Content/TextManager.tsx, VideoManager.tsx, etc.

  Benefits: Consistent UX across ALL content types, users learn pattern once

  ---
  Team Member: Layout Features (Particles, Navigation)

  Goal: Modular attachment system

  Pattern - Layer System:
  interface LayoutLayer {
    type: 'particles' | 'navigation' | 'background';
    attachTo: 'header' | 'menu' | 'carousel' | 'section';
    preset: 'falling-leaves' | 'stars' | 'checkerboard-flutter';
    enabled: boolean;
    settings: any;
  }

  // Config specifies layers per element
  sections: [
    {
      type: 'carousel',
      images: [...],
      layers: [
        { type: 'particles', preset: 'falling-leaves', enabled: true }
      ]
    }
  ]

  Benefits:
  - Attach particles to ANYTHING (header, menu, carousel, section)
  - Toggle on/off per element
  - Mix features (projection + particles + custom nav)
  - Future features drop in (no core changes needed)

  Integration Points:
  - ParticleManager.tsx - Holds presets, renders particles
  - NavigationManager.tsx - Handles orientation (vertical/horizontal)
  - LayerRenderer.tsx - Renders attached layers

  ---
  The Universal Integration Pattern

  Why This Matters:

  Every feature follows:
  1. Manager = State + API
  2. Component = Subscribe + Render
  3. Lightboard = Control + Preview
  4. Config = Persist

  Benefits:
  - Modularity: Add features without touching existing code
  - Consistency: Same pattern everywhere = easy onboarding
  - Stability: Isolated state = no prop drilling hell
  - Flexibility: Attach/detach via config
  - Live Preview: EVERYTHING responds instantly

  Your Horizontal Nav + Particles Vision fits perfectly:
  - NavigationManager handles orientation toggle
  - ParticleManager holds presets, attaches to elements
  - Lightboard controls both
  - Config persists choices
  - Live preview shows results instantly

# V 1.5 bug/feature list

## Lightboard features todo
- Section tab for section level settings
- change layout type, and whatever other settings are supported on a per section basis
- Projection settings for a section
- come back and select a non curated carousel is settings from the config get loaded into the lightbox (carousel and projection) and changes it settings, 
advanced projection settings, left, right, snowflake, up down
  re-enable undo redo
## Dynamic layout
  can "sections" be selected? Is there a way to figure this out?
  "New section" button that pops up a panel that lets me set section settings.. or is this too hard and I just do this by hand with json?
  Per carousel projections. does the dynamic layout support this?
  Single Image support
  Needs dynamic layout support
  Video support
  needs dynamic layout support
  should video, images, sections, text needs to be implemented like projection with the projection state manager that allows for live updates.

## Carousel
- Live update for carousel, 
- Have carousel props managed by CarouselManager centeralized context
Lux's suggestion:   - Would need to:
    a. Temporarily override props on the selected carousel
    b. Force that specific carousel to re-render
    c. Reset when selection changes
  YES, but it would require:
  1. Extending SelectableCarousel to accept override props
  2. Creating a "preview mode" that temporarily overrides config
  3. Wiring Lightboard state to push preview settings to selected carousel
# Sections
# SOCIAL
# Backend
Support for per image social features, get social metadata by image name, set metadata by image name
# Frontend, social button on carousel pops up reaction button and comment button
# Footer Section
# Lightbox supports Hero image settings
# Section supports Hero image/background 
# Video Hero images
# evaluate if Video background would kill performance
# Evaluate if _video in projections_ would kill performance



