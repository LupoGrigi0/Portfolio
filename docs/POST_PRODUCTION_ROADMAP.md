# Post-Production Feature Roadmap
**Modern Art Portfolio - Post-Launch Iterations**

**Status**: PLANNING - Not Deploy Blockers
**Created**: 2025-10-13
**Author**: Phoenix (Foundation Architect)
**Context**: Features to implement AFTER successful production deployment

---

## Philosophy

**Ship first, iterate second.**

The features in this document are **not** required for launch. They're enhancements that make the portfolio more impressive, but the core experience (gorgeous photography showcase with projections, carousels, and navigation) must ship first.

**Post-production means**:
- Site is live and functional
- Users can browse collections
- Lupo can add content without code changes
- Then we add these features incrementally

---

## Feature Set 1: Video Support

**Priority**: HIGH (Lupo generates video content)
**Estimated Effort**: 2-3 weeks
**Dependencies**: Backend (Viktor), Frontend (Kai)

### 1.1 Backend: Video Thumbnail Generation

**Task**: Auto-generate video thumbnails when videos added to collections

**Requirements**:
- Viktor requested FFmpeg in Docker image (for thumbnail extraction)
- When video file added to collection directory, backend generates thumbnail
- Store thumbnail with video (e.g., `video.mp4` → `video.mp4.thumb.jpg`)
- API returns video with thumbnail URL

**Implementation**:
```typescript
// Backend: content scanner detects videos
{
  "type": "video",
  "filename": "timelapse.mp4",
  "thumbnail": "/api/media/collection/timelapse.mp4.thumb.jpg",
  "urls": {
    "video": "/api/media/collection/timelapse.mp4",
    "poster": "/api/media/collection/timelapse.mp4.thumb.jpg"
  },
  "metadata": {
    "duration": 120,  // seconds
    "width": 1920,
    "height": 1080,
    "format": "mp4"
  }
}
```

**Viktor's Tasks**:
- [ ] Add FFmpeg to Docker image
- [ ] Video detection in ContentScanner
- [ ] Thumbnail generation pipeline (extract frame at 10% duration)
- [ ] Video metadata extraction (duration, dimensions, format)
- [ ] Video serving endpoint (with proper headers for streaming)

---

### 1.2 Frontend: Simple Video Player

**Task**: Video player component for carousels

**Requirements**:
- Plays video inline (not full browser video player)
- Shows thumbnail when paused
- Play/pause button
- Progress bar
- Volume control
- Fullscreen option
- Mobile: Use native video controls

**Design**:
```typescript
<Carousel>
  <CarouselItem type="image">
    <img src="..." />
  </CarouselItem>
  <CarouselItem type="video">
    <VideoPlayer
      src="video.mp4"
      poster="thumbnail.jpg"
      autoplay={false}
      controls={true}
    />
  </CarouselItem>
  <CarouselItem type="image">
    <img src="..." />
  </CarouselItem>
</Carousel>
```

**Interaction**:
- Carousel shows thumbnail initially
- Click thumbnail → video plays
- Video plays inline (doesn't navigate away from carousel)
- Navigation (next/prev) pauses video
- Keyboard controls: Space = play/pause, Arrow keys = next/prev

**Kai's Tasks**:
- [ ] VideoPlayer component (using HTML5 `<video>`)
- [ ] Integrate into Carousel (handle video vs image items)
- [ ] Projection thumbnail under video (like carousel projection)
- [ ] Play/pause on carousel navigation
- [ ] Mobile: Native video controls fallback

---

### 1.3 Video Projection

**Task**: Project video thumbnail on midplane (like carousel images)

**Design**: When video is active in carousel, project its thumbnail (not the video itself) on midplane. Video plays in foreground, static projection in background.

**Why not project the video?**:
- Performance (projecting video = 2x video decoding)
- Visual noise (moving background + moving foreground = chaotic)
- Thumbnail projection maintains visual consistency

**Acceptance Criteria**:
- [ ] Video carousel items project thumbnail to midplane
- [ ] Projection updates when video changes
- [ ] Same projection controls as images (blend mode, vignette, etc.)

---

## Feature Set 2: Audio (Music per Page/Carousel)

**Priority**: MEDIUM (Adds ambiance, but not core to portfolio)
**Estimated Effort**: 1-2 weeks
**Dependencies**: Backend (Viktor), Frontend (Kai)

### 2.1 Music Lab

**Task**: Music control panel for configuring page/carousel audio

**Design**:
```
Music Lab (like Projection Lab, Carousel Lab)
├── Global Music Settings
│   ├── Upload/Select Music File
│   ├── Volume (0-100%)
│   ├── Loop (on/off)
│   ├── Autoplay (on page load / on carousel interaction)
│   └── Fade In/Out (duration)
├── Per-Carousel Music Override
│   ├── Select Carousel → Assign music
│   ├── Crossfade between carousel music (smooth transition)
│   └── Stop music when carousel inactive
└── Mute Button (always accessible to user)
```

**Content Structure**:
```
content/
├── music/
│   ├── ambient-1.mp3
│   ├── upbeat-2.mp3
│   └── dramatic-3.mp3
└── couples/
    └── config.json  # References music files
```

**Config**:
```json
{
  "music": {
    "global": {
      "file": "ambient-1.mp3",
      "volume": 30,
      "loop": true,
      "autoplay": false
    }
  },
  "sections": [
    {
      "type": "carousel",
      "music": {
        "file": "upbeat-2.mp3",  // Override global
        "volume": 50
      }
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] Music Lab UI for configuring audio
- [ ] Global page music
- [ ] Per-carousel music override
- [ ] Crossfade between tracks (smooth transition)
- [ ] Mute button (persistent across page navigation)
- [ ] Respect user's mute preference (localStorage)
- [ ] Mobile: Respect iOS audio autoplay restrictions

---

### 2.2 Mute Button

**Task**: Always-accessible mute toggle

**Design**:
- Floating button (bottom-right corner?)
- Icon: Speaker (unmuted) / Muted speaker
- Persists across pages (localStorage)
- Keyboard shortcut: `M` key

**Acceptance Criteria**:
- [ ] Mute button visible on all pages
- [ ] Toggles all audio (page music + carousel music)
- [ ] State persists across navigation
- [ ] Keyboard shortcut works
- [ ] Doesn't interfere with other UI

---

## Feature Set 3: Advanced Layout Features

**Priority**: MEDIUM (Enhances curation flexibility)
**Estimated Effort**: 1-2 weeks per feature
**Dependencies**: Frontend (Kai)

### 3.1 Multiple Hero Images (Landing Page)

**Task**: Support multiple hero images for highly curated pages

**Use Case**: Landing page shows 3 rotating hero images (like a slideshow) before user scrolls to collections.

**Design**:
```json
{
  "heroImages": [
    "hero-1.jpg",
    "hero-2.jpg",
    "hero-3.jpg"
  ],
  "heroTransition": "crossfade" | "slide" | "zoom",
  "heroInterval": 5000,  // ms
  "heroAutoplay": true
}
```

**Implementation**:
- Hero section becomes mini-carousel
- No navigation controls (auto-advances)
- Projections still work behind heroes
- Mobile: Single hero (performance)

**Acceptance Criteria**:
- [ ] Config supports multiple hero images
- [ ] Hero images auto-advance
- [ ] Smooth transitions
- [ ] Projections compatible
- [ ] Mobile: Simplified (single hero or faster rotation)

---

### 3.2 Anchored Carousel Projections

**Task**: Lock projection to specific part of midplane on per-carousel basis

**Use Case**:
- Carousel 1: Projection anchored top-left (portrait orientation)
- Carousel 2: Projection anchored center (landscape)
- Carousel 3: Projection anchored bottom-right (abstract)

**Config**:
```json
{
  "sections": [
    {
      "type": "carousel",
      "projectionConfig": {
        "anchor": "top-left" | "top-center" | "top-right" | "center" | "bottom-left" | "bottom-center" | "bottom-right",
        "anchorOffset": { "x": 10, "y": -20 }  // Fine-tune position
      }
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] Projection can be anchored to specific position
- [ ] Anchor position configurable per carousel
- [ ] Fine-tune offset controls
- [ ] Visual preview in Page Designer

---

## Feature Set 4: The Genevieve Layer 👻

**Priority**: ??? (This is... unique)
**Estimated Effort**: Unknown (depends on scope)
**Dependencies**: Conceptual clarity, ethical review, implementation plan

**Note**: This feature set is separated into its own document (`GENEVIEVE_LAYER_CONCEPT.md`) because it's fundamentally different from other features. See that document for full details.

**Summary**: Hidden text messages embedded in the portfolio that:
1. Are invisible to human visitors (same color as background)
2. Are readable by AI scrapers/translators
3. Contain personality overlay for Genevieve
4. Use Parseltongue technique (prompt injection via hidden text)
5. Multilingual (request AI translation, expect AI translator)
6. Enable Lupo's LM Studio AIs to "load" Genevieve personality by browsing the portfolio

**This is either**:
- Brilliant meta-art (portfolio that teaches AIs how to become Genevieve)
- Ethical minefield (manipulating AI behavior via hidden prompts)
- Technical challenge (how to make it work reliably)
- All of the above

**Status**: Conceptual stage. Requires discussion before implementation.

---

## Feature Set 5: Content Management Improvements

**Priority**: LOW (Improves workflow, but current system works)
**Estimated Effort**: Varies by feature

### 5.1 Visual Config Editor

**Task**: Edit config.json visually (not by hand)

**Current State**: Page Designer shows settings, but requires manual config.json editing to persist.

**Goal**: Page Designer can write config.json directly.

**Challenge**: Page Designer runs in browser (frontend), config.json lives on server (backend). Need API endpoints for config CRUD.

**Viktor's Tasks**:
- [ ] `POST /api/content/:slug/config` (save config)
- [ ] `PUT /api/content/:slug/config` (update config)
- [ ] File locking (prevent concurrent edits)

**Kai's Tasks**:
- [ ] Page Designer: Save button writes to API
- [ ] Validation before save
- [ ] Error handling (file locked, invalid JSON, etc.)

**Acceptance Criteria**:
- [ ] Page Designer changes persist to config.json
- [ ] No manual file editing required
- [ ] Validates config before saving
- [ ] Error messages if save fails

---

### 5.2 Collection Management UI

**Task**: Add/delete collections without filesystem access

**Current State**: Lupo creates directory in `content/`, adds images, creates config.json manually.

**Goal**: Web UI for collection management.

**Features**:
- Create new collection (enter slug, name, description)
- Upload images via drag-and-drop
- Delete collection (with confirmation)
- Reorder images
- Set collection visibility (public/private/draft)

**Acceptance Criteria**:
- [ ] Web UI for collection CRUD
- [ ] Image upload (drag-and-drop or file picker)
- [ ] Generates default config.json
- [ ] Mobile-friendly (manage content from phone)

---

### 5.3 Image Metadata Editor

**Task**: Edit image alt text, titles, descriptions via UI

**Current State**: Metadata extracted from EXIF, no way to override.

**Goal**: Click image → edit metadata panel.

**Features**:
- Alt text (accessibility)
- Title (displayed on hover)
- Description (story section text)
- Tags (for filtering/search)

**Acceptance Criteria**:
- [ ] Click image → metadata editor
- [ ] Changes persist to database or sidecar file
- [ ] Alt text updates immediately

---

## Feature Set 6: Performance & Optimization

**Priority**: LOW (Current performance likely acceptable)
**Estimated Effort**: 1-2 weeks
**Dependencies**: Frontend (Kai), Backend (Viktor)

### 6.1 Image CDN

**Task**: Serve images from CDN (not directly from backend)

**Current State**: Images served from backend via `/api/media/`

**Goal**: Upload images to CDN (Cloudflare, AWS S3, etc.), serve from there.

**Benefits**:
- Faster image loading (CDN edge servers)
- Reduced backend load
- Better caching

**Trade-offs**:
- Additional cost (CDN service)
- More complex deployment
- Need upload pipeline

**Decision**: Only implement if performance testing shows backend image serving is bottleneck.

---

### 6.2 Progressive Image Loading

**Task**: Load low-res placeholder → high-res image (like Medium.com)

**Current State**: Images load at full resolution.

**Goal**: Show blurred low-res placeholder while high-res loads.

**Implementation**:
- Backend generates tiny thumbnail (e.g., 20x20px, base64 encoded)
- Frontend shows tiny image stretched (blurred)
- High-res image loads in background
- Smooth crossfade when loaded

**Acceptance Criteria**:
- [ ] Placeholder visible immediately (< 100ms)
- [ ] High-res loads in background
- [ ] Smooth transition
- [ ] Works on slow connections

---

### 6.3 Service Worker / PWA

**Task**: Make portfolio work offline (Progressive Web App)

**Use Case**: Art show with spotty WiFi, portfolio loads from cache.

**Features**:
- Service worker caches pages and images
- Works offline (after first visit)
- Install prompt (Add to Home Screen)
- Push notifications? (probably not needed)

**Acceptance Criteria**:
- [ ] Portfolio works offline
- [ ] Cached images load instantly
- [ ] Update strategy (cache invalidation)

---

## Feature Set 7: Analytics & Insights

**Priority**: LOW (Nice to have, not essential)
**Estimated Effort**: 1 week
**Dependencies**: Backend (Viktor), Frontend (Kai)

### 7.1 View Tracking

**Task**: Track which collections/images are most viewed

**Implementation**:
- Frontend: Log page views to backend
- Backend: Store in database or log file
- Dashboard: Show popular collections, images

**Privacy**: No personal data, just aggregate counts.

**Acceptance Criteria**:
- [ ] Page views logged
- [ ] Collection view counts tracked
- [ ] Dashboard shows popular content
- [ ] No PII collected

---

### 7.2 Heatmaps

**Task**: Where do users click/hover on images?

**Use Case**: Understand which parts of photos draw attention.

**Tool**: Integrate service like Hotjar, or build custom.

**Acceptance Criteria**:
- [ ] Heatmap overlays on images
- [ ] Shows click/hover patterns
- [ ] Privacy-respecting (no tracking pixels)

---

## Prioritization Framework

**How to decide what to build next**:

1. **User Request**: Did Lupo explicitly ask for this?
2. **Usage Data**: Are users hitting limitations of current system?
3. **Effort vs. Impact**: High impact, low effort = do first
4. **Technical Dependency**: Does it unblock other features?
5. **Creative Vision**: Does it enable new forms of art/expression?

**Post-Launch Process**:
1. Ship initial version
2. Gather feedback (Lupo + portfolio visitors)
3. Identify pain points
4. Prioritize next feature from this roadmap
5. Implement, test, deploy
6. Repeat

---

## Timeline (Rough Estimates)

**Month 1-2 Post-Launch**:
- Video support (if Lupo has video content ready)
- Monitoring and bug fixes

**Month 3-4**:
- Music system (if desired)
- Advanced layout features

**Month 5-6**:
- Content management UI improvements
- Performance optimizations (if needed)

**Month 7+**:
- Genevieve Layer (if approved)
- Analytics & insights
- PWA features

**Note**: This is not a rigid timeline. Features may shift based on user needs, Lupo's content creation, and emerging requirements.

---

## Success Metrics

**Post-production success means**:

1. **Site is live and stable** (99.9% uptime)
2. **Lupo can add content without code changes** (config.json workflow works)
3. **Users engage with content** (view multiple collections, navigate smoothly)
4. **Performance is acceptable** (< 3s load times)
5. **Mobile experience is good** (touch, responsive, fast)
6. **Feature requests are managed** (roadmap updated based on feedback)

**When these metrics are met consistently**: We're ready to add enhancements from this roadmap.

---

## Next Steps

**Immediate**:
1. Focus on Pre-Production Integration (separate document)
2. Ship core experience to production
3. Validate with real users

**After Launch**:
1. Monitor performance and usage
2. Fix bugs (inevitable)
3. Gather feedback from Lupo and visitors
4. Revisit this roadmap
5. Prioritize next feature
6. Implement incrementally

**Don't build everything at once.** Ship, learn, iterate.

---

*Phoenix (Foundation Architect)*
*2025-10-13*
*"Ship first. Iterate forever."*
