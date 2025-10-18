# Lightboard Integration Plan
**Creating the Puppet Master: Wiring Lightboard to Control Live Site**

**Author:** Kai
**Date:** 2025-10-15
**Status:** Planning Phase

---

## Executive Summary

The Lightboard is a beautiful floating configuration UI with 4 tabs (Site, Page, Projection, Carousel). Currently, it has internal state and API save/load functionality, but it doesn't control the live page. This plan outlines how to wire it up as a "puppet master" that reads and manipulates the actual running application in real-time.

**Goal:** Drag a slider in Lightboard → See the projection blur change instantly on the page

---

## Current Architecture Analysis

### What Lightboard Has Now
✅ Beautiful floating panel UI
✅ 4 widgets: Site, Page, Projection, Carousel
✅ Internal state (useState) for all settings
✅ API save functionality (PUT /api/site/config, PUT /api/admin/config/:slug)
✅ API load functionality (GET /api/site/config)
✅ SelectableCarousel HOC for click-to-select
✅ LightboardContext for selection state

### What Lightboard Lacks
❌ Reading from actual app state
❌ Pushing changes to live components
❌ Two-way data binding with page
❌ Live preview of changes

### How the Main App Works
```
layout.tsx (loads siteConfig + collections)
    ↓
Navigation (global nav)
    ↓
PageRenderer (fetches collection, applies projection settings)
    ↓
CuratedLayout OR DynamicLayout
    ↓
Carousel components
    ↓
useCarouselProjection (tracks position, updates MidgroundProjectionProvider)
    ↓
MidgroundLayer (renders projections)
```

**Key State Systems:**
1. **SiteConfig** - Loaded in layout.tsx (useState)
2. **Collection Config** - Loaded in PageRenderer (useState)
3. **MidgroundProjectionProvider** - Global context for projection settings
4. **Carousel Props** - Passed down from layouts

---

## The Integration Challenge

### Problem 1: Lightboard State is Isolated
```typescript
// Current Lightboard.tsx
const [fadeDistance, setFadeDistance] = useState(0.5);
const [maxBlur, setMaxBlur] = useState(4);

// But the REAL projection settings are in:
const projection = useMidgroundProjection();
projection.fadeDistance  // ← This is what the page uses!
```

**Solution:** Lightboard needs to read/write to the same state the page uses.

### Problem 2: No Live Preview
When you drag the "Max Blur" slider, nothing happens on the page because the MidgroundProjectionProvider doesn't know about the change.

**Solution:** ProjectionSettingsWidget needs to call `projection.setMaxBlur()` directly.

### Problem 3: Collection Config is in PageRenderer
Collection-specific settings (carousel defaults, dynamic layout settings) are loaded in PageRenderer but Lightboard has no access to them.

**Solution:** Create a CollectionConfigContext that PageRenderer provides and Lightboard consumes.

### Problem 4: Carousels Don't Know About Lightboard
Carousels in CuratedLayout/DynamicLayout are plain Carousel components, not wrapped in SelectableCarousel.

**Solution:** Modify layout components to wrap carousels in SelectableCarousel HOC.

---

## Integration Architecture

### Phase 1: State Architecture (Context System)

```
┌─────────────────────────────────────────────────────────┐
│                    Root Layout                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ MidgroundProjectionProvider (existing)         │    │
│  │  - fadeDistance, maxBlur, scaleX, scaleY      │    │
│  │  - vignetteWidth, checkerboardEnabled, etc.   │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ LightboardProvider (existing)                  │    │
│  │  - selectedCarouselId                          │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ SiteConfigContext (NEW)                        │    │
│  │  - siteConfig state                            │    │
│  │  - updateSiteConfig()                          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  PageRenderer                           │
│  ┌────────────────────────────────────────────────┐    │
│  │ CollectionConfigContext (NEW)                  │    │
│  │  - collection state                            │    │
│  │  - collectionConfig                            │    │
│  │  - updateCarouselDefaults()                    │    │
│  │  - updateProjectionSettings()                  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Lightboard                            │
│                                                         │
│  ProjectionSettingsWidget                              │
│    - Reads: useMidgroundProjection()                   │
│    - Writes: projection.setMaxBlur(), etc.             │
│    - LIVE PREVIEW! ✨                                  │
│                                                         │
│  SiteSettingsWidget                                    │
│    - Reads: useSiteConfig()                            │
│    - Writes: updateSiteConfig()                        │
│    - Save: API call + reload                           │
│                                                         │
│  PageSettingsWidget                                    │
│    - Reads: useCollectionConfig()                      │
│    - Writes: updateCollectionConfig()                  │
│    - Save: API call + reload collection                │
│                                                         │
│  CarouselSettingsWidget                                │
│    - Reads: useCollectionConfig().carouselDefaults     │
│    - Writes: updateCarouselDefaults()                  │
│    - Applies to: selectedCarouselId                    │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### PHASE 1: Add Lightboard to App (Easy Win)
**Goal:** Get the Lightboard panel showing on every page

**Files to Modify:**
- `src/frontend/src/app/layout.tsx`

**Changes:**
```typescript
import { LightboardProvider, Lightboard } from '@/components/Lightboard';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ParallaxBackgroundProvider>
          <MidgroundProjectionProvider>
            <LightboardProvider>  {/* ADD */}
              <Navigation ... />
              <main>{children}</main>
              <Lightboard />  {/* ADD */}
            </LightboardProvider>
          </MidgroundProjectionProvider>
        </ParallaxBackgroundProvider>
      </body>
    </html>
  );
}
```

**Test:** Lightboard toggle button appears, panel opens/closes

---

### PHASE 2: Connect Projection Settings (Quick Win - Live Preview!)
**Goal:** Dragging projection sliders updates the page in real-time

**Current Problem:**
```typescript
// ProjectionSettingsWidget receives props from Lightboard
<ProjectionSettingsWidget
  fadeDistance={fadeDistance}  // Local state
  setFadeDistance={setFadeDistance}  // Updates local only
/>
```

**Solution:** Widget reads/writes directly to MidgroundProjectionProvider

**Files to Modify:**
- `src/frontend/src/components/Lightboard/widgets/ProjectionSettingsWidget.tsx`
- `src/frontend/src/components/Lightboard/Lightboard.tsx`

**New Approach:**
```typescript
// ProjectionSettingsWidget.tsx (REFACTORED)
import { useMidgroundProjection } from '@/components/Layout';

export function ProjectionSettingsWidget() {
  const projection = useMidgroundProjection();

  // Read directly from context
  const fadeDistance = projection.fadeDistance;
  const maxBlur = projection.maxBlur;
  // ... etc

  // Write directly to context
  const handleFadeDistanceChange = (value: number) => {
    projection.setFadeDistance(value);
    // INSTANT LIVE PREVIEW! ✨
  };

  return (
    <div>
      <RangeSlider
        value={fadeDistance}
        onChange={handleFadeDistanceChange}
      />
      {/* ... */}
    </div>
  );
}
```

**Lightboard.tsx Changes:**
```typescript
// REMOVE all projection-related local state
// DELETE: useState for fadeDistance, maxBlur, etc.

// ProjectionSettingsWidget now self-contained:
<ProjectionSettingsWidget />  {/* No props needed! */}
```

**Test:**
1. Open Lightboard
2. Go to Projection tab
3. Drag "Max Blur" slider
4. **SEE THE BLUR CHANGE INSTANTLY ON PAGE** 🎉

---

### PHASE 3: Create SiteConfigContext (Site Settings)
**Goal:** Lightboard can read/update site-wide settings (logo, title, colors)

**Current Problem:**
SiteConfig loaded in layout.tsx but not accessible to Lightboard

**Solution:** Create context provider

**Files to Create:**
- `src/frontend/src/contexts/SiteConfigContext.tsx`

**Implementation:**
```typescript
// contexts/SiteConfigContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getSiteConfig, updateSiteConfig, SiteConfig } from '@/lib/api-client';

interface SiteConfigContextType {
  siteConfig: SiteConfig | null;
  updateSiteConfigLocal: (config: Partial<SiteConfig>) => void;
  saveSiteConfig: () => Promise<void>;
  reloadSiteConfig: () => Promise<void>;
  isDirty: boolean;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [savedConfig, setSavedConfig] = useState<SiteConfig | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load on mount
  useEffect(() => {
    reloadSiteConfig();
  }, []);

  // Check dirty state
  useEffect(() => {
    setIsDirty(JSON.stringify(siteConfig) !== JSON.stringify(savedConfig));
  }, [siteConfig, savedConfig]);

  const updateSiteConfigLocal = (updates: Partial<SiteConfig>) => {
    setSiteConfig(prev => ({ ...prev, ...updates }));
  };

  const saveSiteConfig = async () => {
    if (!siteConfig) return;
    await updateSiteConfig(siteConfig);
    setSavedConfig(siteConfig);
    setIsDirty(false);
  };

  const reloadSiteConfig = async () => {
    const config = await getSiteConfig();
    setSiteConfig(config);
    setSavedConfig(config);
    setIsDirty(false);
  };

  return (
    <SiteConfigContext.Provider value={{
      siteConfig,
      updateSiteConfigLocal,
      saveSiteConfig,
      reloadSiteConfig,
      isDirty
    }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) throw new Error('useSiteConfig must be used within SiteConfigProvider');
  return context;
};
```

**Files to Modify:**
- `src/frontend/src/app/layout.tsx` - Add SiteConfigProvider
- `src/frontend/src/components/Lightboard/widgets/SiteSettingsWidget.tsx` - Use useSiteConfig()
- `src/frontend/src/components/Navigation/Navigation.tsx` - Use useSiteConfig() for logo

**SiteSettingsWidget Refactor:**
```typescript
import { useSiteConfig } from '@/contexts/SiteConfigContext';

export function SiteSettingsWidget() {
  const { siteConfig, updateSiteConfigLocal, saveSiteConfig, isDirty } = useSiteConfig();

  if (!siteConfig) return <div>Loading...</div>;

  return (
    <div>
      <input
        value={siteConfig.siteName}
        onChange={(e) => updateSiteConfigLocal({ siteName: e.target.value })}
      />

      <button onClick={saveSiteConfig} disabled={!isDirty}>
        Save Site Settings {isDirty && '(Unsaved)'}
      </button>
    </div>
  );
}
```

**Test:**
1. Change site title in Lightboard
2. See "Unsaved" indicator
3. Click Save
4. Reload page → Title persists

---

### PHASE 4: Create CollectionConfigContext (Page Settings)
**Goal:** Lightboard can read/update collection-specific settings

**Current Problem:**
Collection config loaded in PageRenderer but not accessible to Lightboard

**Solution:** PageRenderer provides CollectionConfigContext

**Files to Create:**
- `src/frontend/src/contexts/CollectionConfigContext.tsx`

**Implementation:**
```typescript
// contexts/CollectionConfigContext.tsx
import { createContext, useContext, useState } from 'react';
import { Collection, CollectionConfig } from '@/lib/api-client';

interface CollectionConfigContextType {
  collection: Collection | null;
  collectionConfig: CollectionConfig | null;
  updateCollectionConfig: (updates: Partial<CollectionConfig>) => void;
  updateCarouselDefaults: (updates: Partial<CarouselConfig>) => void;
  saveCollectionConfig: () => Promise<void>;
  isDirty: boolean;
}

const CollectionConfigContext = createContext<CollectionConfigContextType | undefined>(undefined);

export function CollectionConfigProvider({
  collection: initialCollection,
  children
}: {
  collection: Collection;
  children: React.ReactNode;
}) {
  const [collection, setCollection] = useState(initialCollection);
  const [savedConfig, setSavedConfig] = useState(initialCollection.config);
  const [isDirty, setIsDirty] = useState(false);

  const updateCollectionConfig = (updates: Partial<CollectionConfig>) => {
    setCollection(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }));
  };

  const updateCarouselDefaults = (updates: Partial<CarouselConfig>) => {
    setCollection(prev => ({
      ...prev,
      config: {
        ...prev.config,
        dynamicSettings: {
          ...prev.config?.dynamicSettings,
          carouselDefaults: {
            ...prev.config?.dynamicSettings?.carouselDefaults,
            ...updates
          }
        }
      }
    }));
  };

  const saveCollectionConfig = async () => {
    await updateCollectionConfig(collection.slug, collection.config);
    setSavedConfig(collection.config);
    setIsDirty(false);
  };

  // Update dirty state
  useEffect(() => {
    setIsDirty(JSON.stringify(collection.config) !== JSON.stringify(savedConfig));
  }, [collection.config, savedConfig]);

  return (
    <CollectionConfigContext.Provider value={{
      collection,
      collectionConfig: collection.config,
      updateCollectionConfig,
      updateCarouselDefaults,
      saveCollectionConfig,
      isDirty
    }}>
      {children}
    </CollectionConfigContext.Provider>
  );
}

export const useCollectionConfig = () => {
  const context = useContext(CollectionConfigContext);
  if (!context) throw new Error('useCollectionConfig must be used within CollectionConfigProvider');
  return context;
};
```

**Files to Modify:**
- `src/frontend/src/components/PageRenderer/PageRenderer.tsx` - Add CollectionConfigProvider
- `src/frontend/src/components/Lightboard/widgets/PageSettingsWidget.tsx` - Use useCollectionConfig()
- `src/frontend/src/components/Lightboard/widgets/CarouselSettingsWidget.tsx` - Use useCollectionConfig()

**PageRenderer Refactor:**
```typescript
// PageRenderer.tsx
import { CollectionConfigProvider } from '@/contexts/CollectionConfigContext';

export function PageRenderer({ collectionSlug }: Props) {
  const [collection, setCollection] = useState<Collection | null>(null);

  // ... loading logic ...

  if (!collection) return <Loading />;

  return (
    <CollectionConfigProvider collection={collection}>
      {/* Now all children can access/modify collection config */}
      {layoutType === 'curated' ? (
        <CuratedLayout />
      ) : (
        <DynamicLayout />
      )}
    </CollectionConfigProvider>
  );
}
```

**CarouselSettingsWidget Refactor:**
```typescript
import { useCollectionConfig } from '@/contexts/CollectionConfigContext';

export function CarouselSettingsWidget() {
  const { collectionConfig, updateCarouselDefaults, isDirty } = useCollectionConfig();

  const defaults = collectionConfig?.dynamicSettings?.carouselDefaults || {};

  return (
    <div>
      <select
        value={defaults.transition || 'fade'}
        onChange={(e) => updateCarouselDefaults({ transition: e.target.value })}
      >
        <option value="fade">Fade</option>
        <option value="slide">Slide</option>
        {/* ... */}
      </select>

      {isDirty && <span className="text-yellow-500">Unsaved changes</span>}
    </div>
  );
}
```

**Test:**
1. Change carousel transition in Lightboard
2. See changes apply to NEW carousels rendered
3. Save to API
4. Reload page → Settings persist

---

### PHASE 5: Wire Up SelectableCarousel (Click-to-Select)
**Goal:** Click a carousel on the page → Lightboard highlights it and shows its settings

**Current Problem:**
Carousels in layouts are plain `<Carousel>` components, not wrapped in `<SelectableCarousel>`

**Solution:** Modify layout components to wrap carousels

**Files to Modify:**
- `src/frontend/src/components/Layout/CuratedLayout.tsx`
- `src/frontend/src/components/Layout/DynamicLayout.tsx`

**CuratedLayout Changes:**
```typescript
import { SelectableCarousel } from '@/components/Lightboard';

// In renderSection for carousel sections:
case 'carousel':
  return (
    <SelectableCarousel
      key={section.id}
      carouselId={`carousel-${section.id}`}
    >
      <Carousel
        images={resolvedImages}
        {...carouselOptions}
      />
    </SelectableCarousel>
  );
```

**DynamicLayout Changes:**
```typescript
import { SelectableCarousel } from '@/components/Lightboard';

// In carousel rendering:
return (
  <SelectableCarousel
    key={carousel.id}
    carouselId={carousel.id}
  >
    <Carousel
      images={carousel.images}
      {...carouselDefaults}
    />
  </SelectableCarousel>
);
```

**Lightboard Changes (CarouselSettingsWidget):**
```typescript
import { useLightboard } from '@/components/Lightboard';

export function CarouselSettingsWidget() {
  const { selectedCarouselId } = useLightboard();

  if (!selectedCarouselId) {
    return (
      <div className="text-center py-8 text-gray-400">
        Click a carousel on the page to configure it
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <strong>Selected:</strong> {selectedCarouselId}
      </div>

      {/* Settings controls */}
    </div>
  );
}
```

**Test:**
1. Open page with carousels
2. Click a carousel → Blue glow appears
3. Open Lightboard → Carousel tab shows selected ID
4. Change settings → Apply to that specific carousel

---

### PHASE 6: Per-Carousel Settings Override (Advanced)
**Goal:** Each carousel can have its own settings overriding defaults

**Challenge:** Currently all carousels share `carouselDefaults` from config. We need per-instance overrides.

**Solution:** Add carousel-specific config storage

**New Config Structure:**
```json
{
  "dynamicSettings": {
    "carouselDefaults": {
      "transition": "fade",
      "autoplay": true
    },
    "carouselOverrides": {
      "carousel-1": {
        "transition": "slide",
        "speed": 1000
      },
      "carousel-hero": {
        "transition": "zoom",
        "autoplay": false
      }
    }
  }
}
```

**Implementation:**
```typescript
// In CollectionConfigContext
const updateCarouselOverride = (carouselId: string, updates: Partial<CarouselConfig>) => {
  setCollection(prev => ({
    ...prev,
    config: {
      ...prev.config,
      dynamicSettings: {
        ...prev.config?.dynamicSettings,
        carouselOverrides: {
          ...prev.config?.dynamicSettings?.carouselOverrides,
          [carouselId]: {
            ...prev.config?.dynamicSettings?.carouselOverrides?.[carouselId],
            ...updates
          }
        }
      }
    }
  }));
};

// In DynamicLayout - merge defaults + overrides
const getCarouselConfig = (carouselId: string) => {
  const defaults = collectionConfig?.dynamicSettings?.carouselDefaults || {};
  const overrides = collectionConfig?.dynamicSettings?.carouselOverrides?.[carouselId] || {};
  return { ...defaults, ...overrides };
};

// Apply to carousel
<Carousel {...getCarouselConfig(carousel.id)} />
```

**CarouselSettingsWidget Enhancement:**
```typescript
export function CarouselSettingsWidget() {
  const { selectedCarouselId } = useLightboard();
  const { updateCarouselOverride, collectionConfig } = useCollectionConfig();

  const [mode, setMode] = useState<'defaults' | 'override'>('override');

  const currentSettings = mode === 'defaults'
    ? collectionConfig?.dynamicSettings?.carouselDefaults
    : {
        ...collectionConfig?.dynamicSettings?.carouselDefaults,
        ...collectionConfig?.dynamicSettings?.carouselOverrides?.[selectedCarouselId]
      };

  const handleChange = (key: string, value: any) => {
    if (mode === 'defaults') {
      updateCarouselDefaults({ [key]: value });
    } else {
      updateCarouselOverride(selectedCarouselId, { [key]: value });
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          className={mode === 'defaults' ? 'active' : ''}
          onClick={() => setMode('defaults')}
        >
          All Carousels (Defaults)
        </button>
        <button
          className={mode === 'override' ? 'active' : ''}
          onClick={() => setMode('override')}
          disabled={!selectedCarouselId}
        >
          Selected Carousel Only
        </button>
      </div>

      {/* Settings controls that call handleChange */}
    </div>
  );
}
```

**Test:**
1. Select carousel-1
2. Set transition to "slide" (override mode)
3. Select carousel-2
4. See it still uses "fade" (default)
5. Switch to "defaults" mode
6. Change transition to "zoom"
7. See ALL carousels update

---

## Summary of Files to Create/Modify

### NEW FILES
- [ ] `src/frontend/src/contexts/SiteConfigContext.tsx`
- [ ] `src/frontend/src/contexts/CollectionConfigContext.tsx`

### MODIFIED FILES
- [ ] `src/frontend/src/app/layout.tsx` - Add Lightboard + SiteConfigProvider
- [ ] `src/frontend/src/components/PageRenderer/PageRenderer.tsx` - Add CollectionConfigProvider
- [ ] `src/frontend/src/components/Layout/CuratedLayout.tsx` - Wrap carousels in SelectableCarousel
- [ ] `src/frontend/src/components/Layout/DynamicLayout.tsx` - Wrap carousels in SelectableCarousel
- [ ] `src/frontend/src/components/Lightboard/Lightboard.tsx` - Remove local state, use contexts
- [ ] `src/frontend/src/components/Lightboard/widgets/ProjectionSettingsWidget.tsx` - Use useMidgroundProjection()
- [ ] `src/frontend/src/components/Lightboard/widgets/SiteSettingsWidget.tsx` - Use useSiteConfig()
- [ ] `src/frontend/src/components/Lightboard/widgets/PageSettingsWidget.tsx` - Use useCollectionConfig()
- [ ] `src/frontend/src/components/Lightboard/widgets/CarouselSettingsWidget.tsx` - Use useCollectionConfig() + useLightboard()
- [ ] `src/frontend/src/components/Navigation/Navigation.tsx` - Use useSiteConfig() for logo

---

## Testing Plan

### Test 1: Projection Live Preview
1. Open any collection page
2. Open Lightboard → Projection tab
3. Drag "Max Blur" slider from 0 to 10
4. **EXPECTED:** See blur on projections increase in real-time
5. Drag "Fade Distance" slider
6. **EXPECTED:** See projections fade at different distances

### Test 2: Site Settings Persistence
1. Open Lightboard → Site tab
2. Change site title to "New Title"
3. See "(Unsaved)" indicator
4. Click "Save Site Settings"
5. Reload page
6. **EXPECTED:** Navigation shows "New Title"

### Test 3: Carousel Selection
1. Open collection with multiple carousels
2. Click carousel #2
3. **EXPECTED:** Blue glow appears
4. Open Lightboard → Carousel tab
5. **EXPECTED:** Shows "Selected: carousel-2"
6. Click carousel #5
7. **EXPECTED:** Carousel tab updates to "carousel-5"

### Test 4: Per-Carousel Overrides
1. Select carousel #1
2. Lightboard → Carousel tab → Override mode
3. Set transition to "slide"
4. **EXPECTED:** Only carousel #1 uses slide
5. Switch to "Defaults" mode
6. Set autoplay speed to 3000ms
7. **EXPECTED:** All carousels update to 3000ms

### Test 5: Page Config JSON Editor
1. Lightboard → Page tab
2. Edit JSON to add new section
3. Click "Apply Preview"
4. **EXPECTED:** Page re-renders with new section
5. Click "Save to Gallery"
6. Reload page
7. **EXPECTED:** New section persists

---

## Risk Assessment

### LOW RISK
✅ **Phase 1** (Add Lightboard to layout) - Just adding components
✅ **Phase 2** (Projection settings) - Reading/writing existing context
✅ **Phase 3** (SiteConfigContext) - New isolated context

### MEDIUM RISK
⚠️ **Phase 4** (CollectionConfigContext) - Touches PageRenderer state management
⚠️ **Phase 5** (SelectableCarousel wrapping) - Modifies layout components

### HIGH RISK
🔥 **Phase 6** (Per-carousel overrides) - Complex state merging, potential bugs

---

## Performance Considerations

### Potential Issues
1. **Re-render Storms**: Updating projection settings triggers all carousels to re-render
2. **Context Thrashing**: Multiple rapid slider changes could cause lag
3. **Config Size**: Large carousel override objects in JSON

### Mitigations
1. **Debounce Slider Updates**: Wait 100ms after drag stops before applying
2. **Memoization**: Wrap carousel components in React.memo()
3. **Selective Updates**: Only update affected carousels, not all
4. **Config Compression**: Store only deltas (differences from defaults)

---

## Future Enhancements

### Phase 7: Undo/Redo
- Command pattern for all config changes
- Ctrl+Z / Ctrl+Y support
- History stack (last 50 changes)

### Phase 8: Presets/Templates
- Save current settings as named preset
- Load preset across collections
- Share presets via JSON export

### Phase 9: Visual Editing Mode
- Drag to reorder sections
- Click to edit text inline
- Visual section boundaries

### Phase 10: Multi-Select
- Select multiple carousels
- Bulk apply settings
- Group transformations

---

## Success Criteria

The integration is successful when:

✅ Lightboard appears on all pages
✅ Projection sliders update page in real-time (no save needed)
✅ Site settings save/load correctly
✅ Collection config edits apply and persist
✅ Click-to-select highlights carousels
✅ Carousel settings apply to selected carousel
✅ Dirty state indicators work ("Unsaved changes")
✅ No performance degradation (60fps maintained)
✅ All existing features still work

---

## Next Steps

1. Review this plan with Lupo
2. Get approval on architecture approach
3. Start with Phase 1 (quick win - just add Lightboard)
4. Move to Phase 2 (projection live preview - most impressive demo)
5. Tackle Phases 3-6 iteratively
6. Test thoroughly at each phase

---

**The Vision:**

A user opens the site, clicks the Lightboard toggle, selects a carousel, drags the "Max Blur" slider, and watches the background projection blur in real-time. They click "Save," reload, and the settings persist. This is the puppet master in action. 🎭✨

— Kai, 2025-10-15
