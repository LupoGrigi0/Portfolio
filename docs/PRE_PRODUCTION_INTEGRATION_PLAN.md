# Pre-Production Integration Plan
**Modern Art Portfolio - Deployment Readiness**

**Status**: ACTIVE - Deploy Blocker
**Created**: 2025-10-13
**Author**: Phoenix (Foundation Architect)
**Context**: Major milestone achieved - all core components functional in labs. Next phase: integrate for production deployment.

---

## Current State (Major Milestone Achieved! 🎉)

**Components Built & Functional**:
- ✅ Custom Carousel (with keyboard nav, smooth transitions, configurable controls)
- ✅ Projection/Midplane System (15+ blend modes, vignette, alignment controls)
- ✅ Navigation Menu (with sub-collections)
- ✅ Collection Configuration System (config.json per collection)
- ✅ Hybrid Layouts (curated + auto-generated sections)
- ✅ Component Labs (Carousel Lab, Projection Lab, Collection Lab)
- ✅ Site/Page Designer (initial implementation)

**Team Composition**:
- 2 Viktor instances (Backend API)
- 3-5 Kai instances (Frontend specialists, rotated)
- 1 Nova (Integration/Deployment)
- 1 Phoenix (Architecture/Coordination)

**Backend Status**:
- Clean, zero warnings (Viktor standard achieved)
- API endpoints stable
- Rate limiting configured
- Ready for production load

---

## Pre-Production Phase: Integration & Polish

**Goal**: Transform component labs into production-ready portfolio site running on localhost:3000, ready for Digital Ocean deployment.

**Deadline**: Before production deployment (Nova's timeline TBD)

---

## Phase 1: Production Home Page Integration

**Priority**: CRITICAL (Deploy Blocker)
**Owner**: Kai (Frontend Lead) + Phoenix (Architecture)
**Dependencies**: All component labs functional (✅ Complete)

### 1.1 Home Page Structure

**Task**: Create production home page at root route (`/`)

**Requirements**:
- Use Collection Lab's rendering engine as foundation
- Route: `app/page.tsx` (Next.js App Router root)
- Should feel like "landing page" not "collection page"
- Beautiful, curated, showcases best work

**Deliverables**:
```
src/frontend/app/
├── page.tsx                    # Production home page (NEW)
├── collections/
│   └── [slug]/
│       └── page.tsx            # Collection pages (use Collection Lab renderer)
└── labs/                       # Keep labs functional
    ├── carousel/
    ├── projection/
    └── collection/
```

**Acceptance Criteria**:
- [ ] Home page renders at `localhost:3000/`
- [ ] Uses Collection Lab rendering logic (don't duplicate code)
- [ ] Has its own `config.json` in content directory
- [ ] Projection system active
- [ ] Navigation menu integrated
- [ ] Zero console errors on load
- [ ] Silent when idle (Viktor standard)

---

### 1.2 Config.json System for Production

**Task**: Implement config.json loading for all collections + home page

**Current State**: Collection Lab has config.json functionality, needs production implementation

**Design Decision Needed**: Where do config files live?

**Option A - Filesystem** (Recommended):
```
content/
├── home/
│   ├── config.json             # Home page configuration
│   └── images/
├── couples/
│   ├── config.json             # Couples collection config
│   └── gallery/
└── flowers/
    ├── config.json
    └── gallery/
```

**Option B - Database**:
- Viktor adds config CRUD endpoints
- Frontend fetches from API
- More complex but enables visual editor without filesystem access

**Recommendation**: Start with Option A (filesystem), migrate to Option B when visual editor is priority.

**Implementation**:
1. Viktor: Add `GET /api/content/:slug/config` endpoint (reads config.json from collection directory)
2. Frontend: Create `useCollectionConfig(slug)` hook
3. All pages: Load config, apply settings (projections, layouts, etc.)

**Config Schema** (standard across all collections):
```typescript
interface CollectionConfig {
  // Page Meta
  title: string;
  subtitle?: string;
  description?: string;

  // Layout
  layout: "curated" | "auto" | "hybrid";

  // Curated Sections (for hybrid/curated layouts)
  sections?: Array<{
    type: "hero" | "story" | "gallery" | "carousel";
    title?: string;
    description?: string;
    images: string[];  // Filenames from collection
    carouselConfig?: CarouselSettings;
    projectionConfig?: ProjectionSettings;
  }>;

  // Auto-generated Section (for hybrid/auto layouts)
  autoGallery?: {
    excludeImages: string[];  // Already used in curated sections
    layout: "grid" | "masonry" | "carousel-grid";
    columns: 2 | 3 | 4;
  };

  // Global Settings
  projection: ProjectionSettings;
  carousel: CarouselSettings;

  // Navigation
  subcollections?: string[];  // Slugs of child collections
}
```

**Acceptance Criteria**:
- [ ] Viktor: Config endpoint implemented
- [ ] Frontend: useCollectionConfig hook created
- [ ] Home page loads from `content/home/config.json`
- [ ] Collection pages load from `content/:slug/config.json`
- [ ] Falls back to sensible defaults if config missing
- [ ] Config changes reflect immediately (no rebuild needed)

---

### 1.3 Navigation Menu Integration

**Task**: Integrate navigation menu into production pages

**Current State**: Nav menu exists, needs production integration

**Requirements**:
- Always accessible (sticky/floating, or top bar)
- Shows all collections from backend API
- Supports sub-collections (hierarchical)
- Highlights current page
- Mobile-friendly (hamburger menu or drawer)

**Design**:
```typescript
// Navigation data from backend
interface NavStructure {
  collections: Array<{
    slug: string;
    name: string;
    subcollections?: NavStructure['collections'];
  }>;
}

// Component hierarchy
<Navigation>
  <NavItem href="/">Home</NavItem>
  <NavItem href="/collections/couples">Couples
    <SubNav>
      <NavItem href="/collections/couples/vintage">Vintage</NavItem>
      <NavItem href="/collections/couples/modern">Modern</NavItem>
    </SubNav>
  </NavItem>
  <NavItem href="/collections/flowers">Flowers</NavItem>
  <NavItem href="/labs">Labs</NavItem>  {/* Dev only? */}
</Navigation>
```

**Acceptance Criteria**:
- [ ] Navigation menu integrated on home page
- [ ] Navigation menu integrated on collection pages
- [ ] Fetches collection list from Viktor's API
- [ ] Sub-collections render as nested menu
- [ ] Current page highlighted
- [ ] Mobile responsive
- [ ] Doesn't interfere with projections/carousels
- [ ] Labs still accessible (for development)

---

### 1.4 Component Separation (Architecture)

**Task**: Ensure components remain modular and reusable

**Principle**: Labs should use THE SAME components as production pages. Don't duplicate code.

**Structure**:
```
src/frontend/src/
├── components/
│   ├── Carousel/
│   │   ├── Carousel.tsx            # Core component (used everywhere)
│   │   ├── CarouselControls.tsx
│   │   └── types.ts
│   ├── Projection/
│   │   ├── ProjectionLayer.tsx     # Core component
│   │   ├── ProjectionControls.tsx  # Settings panel (labs only)
│   │   └── types.ts
│   ├── Navigation/
│   │   └── Navigation.tsx
│   └── Layout/
│       └── CollectionRenderer.tsx   # Renders from config.json
├── app/
│   ├── page.tsx                     # Home (uses components)
│   ├── collections/[slug]/page.tsx  # Collections (uses components)
│   └── labs/
│       ├── carousel/page.tsx        # Lab (uses components + controls)
│       ├── projection/page.tsx
│       └── collection/page.tsx
```

**Key Insight**:
- Production pages use components WITHOUT control panels
- Labs use SAME components WITH control panels
- Control panels are separate components that wrap/configure the core components

**Acceptance Criteria**:
- [ ] Carousel Lab and Production pages use same `<Carousel>` component
- [ ] Projection Lab and Production pages use same `<ProjectionLayer>` component
- [ ] Collection Lab and Production pages use same `<CollectionRenderer>` component
- [ ] Control panels are separate, optional components
- [ ] Zero code duplication between labs and production
- [ ] Labs remain functional after production integration

---

## Phase 2: Page Designer System

**Priority**: HIGH (Enhances development workflow)
**Owner**: Kai (Frontend Lead)
**Dependencies**: Phase 1 complete

### 2.1 Unified Settings Panel

**Task**: Create single floating editor that integrates all component control panels

**Concept**: Currently each lab has its own control panel (Carousel Lab → Carousel Controls, Projection Lab → Projection Controls). Page Designer combines them into one unified interface for editing entire pages.

**Design**:
```
Page Designer Interface (Floating Panel)
├── Site Settings Tab
│   ├── Favicon/Logo (from backend branding API)
│   ├── Global Theme
│   └── Default Projection/Carousel Settings
├── Page Settings Tab
│   ├── Title/Subtitle/Description
│   ├── Layout Mode (Curated/Auto/Hybrid)
│   └── Meta (SEO, social sharing)
├── Projection Settings Tab (global + per-carousel override)
│   ├── Blend Mode
│   ├── Vignette (Edge/Inner/H/V)
│   ├── Alignment (H/V offset)
│   └── Per-Carousel Overrides
├── Carousel Settings Tab (global + per-carousel)
│   ├── Transition Type
│   ├── Autoplay (on/off, interval)
│   ├── Controls (arrows, dots, keyboard)
│   └── Per-Carousel Overrides
└── Component Selection
    ├── Select Carousel 1 → Apply settings to selected
    ├── Select Carousel 2 → Apply settings to selected
    └── Select Single Image → Apply projection settings
```

**Interaction Model**:
1. Click on carousel/image in preview → selects component
2. Settings panel shows component-specific settings
3. Global tab shows page-wide settings
4. Changes apply in real-time (like Collection Lab)
5. Export to config.json

**Acceptance Criteria**:
- [ ] Floating settings panel (draggable, collapsible)
- [ ] Tabbed interface (Site, Page, Projection, Carousel)
- [ ] Component selection (click to select)
- [ ] Real-time preview updates
- [ ] Export to config.json
- [ ] Each lab's control panel integrated as tab/section
- [ ] Mobile: Drawer instead of floating panel

---

### 2.2 Site-Level Settings & Branding API

**Task**: Implement site-wide settings and backend branding endpoint

**Backend (Viktor)**:
```typescript
// New endpoint: GET /api/site/branding
{
  "favicon": "/api/media/branding/favicon.ico",
  "logo": "/api/media/branding/logo.svg",
  "title": "Lupo's Art Portfolio",
  "description": "Photographer and digital artist",
  "socialImage": "/api/media/branding/social-card.jpg"
}

// Branding files live in:
// content/branding/
//   ├── favicon.ico
//   ├── logo.svg
//   └── social-card.jpg
```

**Frontend**:
- Fetch branding on app load
- Apply to `<head>` (favicon, title, meta tags)
- Show in navigation (logo)
- Use in Page Designer (site settings tab)

**Acceptance Criteria**:
- [ ] Viktor: Branding endpoint implemented
- [ ] Frontend: Branding loaded on app init
- [ ] Favicon appears in browser tab
- [ ] Logo appears in navigation
- [ ] Page Designer: Site settings tab edits branding
- [ ] Changes persist to branding directory

---

### 2.3 Per-Carousel Settings Override

**Task**: Allow individual carousels to override global projection/carousel settings

**Use Case**:
- Global projection: Purple dragon, Screen blend mode, 50% opacity
- Carousel 1: Override with yellow fractal, Multiply blend, 80% opacity
- Carousel 2: Use global settings
- Carousel 3: Override with no projection (image only)

**Implementation**:
```typescript
// In config.json
{
  "projection": { /* global settings */ },
  "carousel": { /* global settings */ },
  "sections": [
    {
      "type": "carousel",
      "images": ["img1.jpg", "img2.jpg"],
      "projectionConfig": { /* overrides global */ },
      "carouselConfig": { /* overrides global */ }
    },
    {
      "type": "carousel",
      "images": ["img3.jpg"],
      // No overrides, uses global
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] Config schema supports per-section overrides
- [ ] Carousel components accept override props
- [ ] Page Designer: Select carousel → override settings
- [ ] Visual indicator shows overridden vs. global settings
- [ ] Reset button to clear overrides

---

## Phase 3: Detail Features & Polish

**Priority**: MEDIUM (Nice-to-have before launch)
**Owner**: Kai + Viktor (collaborative)

### 3.1 Hero Image Anchoring

**Task**: Hero image anchor one level below projected midplane

**Concept**: Some pages want a static hero image that doesn't change (like landing page). Projection layer animates above it.

**Z-Index Stack**:
```
Layer 5: UI (Navigation, controls)
Layer 4: Content (Carousels, text)
Layer 3: Projection Midplane (animated, changes per carousel)
Layer 2: Hero Image (anchored, static)
Layer 1: Background (solid color or subtle texture)
```

**Config**:
```json
{
  "heroImage": "hero-landscape.jpg",
  "heroAnchor": true,  // If true, hero doesn't scroll
  "heroFade": "on-scroll" | "never",  // Fade out as projections appear?
}
```

**Acceptance Criteria**:
- [ ] Hero image renders below projection layer
- [ ] Hero can be anchored (fixed position) or scroll
- [ ] Hero can fade out as projections come into view
- [ ] Configurable via config.json
- [ ] Works on mobile

---

### 3.2 Single Image Projection

**Task**: Projection for single images (not just carousels)

**Use Case**: Story sections with one hero image, want projection behind it

**Implementation**:
- Already works if you treat single image as 1-item carousel
- Or: Create `<ProjectedImage>` component (carousel without navigation)

**Acceptance Criteria**:
- [ ] Single images can have projections
- [ ] Same projection controls as carousel
- [ ] Performance: Don't load full carousel logic for single image

---

### 3.3 Carousel Control Panel Lifting

**Task**: Make carousel control panel floating (like projection panel)

**Current State**: Projection panel is floating. Carousel controls might be inline.

**Goal**: Both panels float, draggable, toggleable

**Acceptance Criteria**:
- [ ] Carousel control panel floats
- [ ] Toggle button to show/hide controls
- [ ] Doesn't overlap projection controls
- [ ] Remembers position (localStorage?)

---

### 3.4 Autoplay Controls

**Task**: Enable autoplay at page level and per-carousel level

**Config**:
```json
{
  "carousel": {
    "autoplay": true,
    "autoplayInterval": 5000  // ms
  },
  "sections": [
    {
      "type": "carousel",
      "carouselConfig": {
        "autoplay": false  // Override: this carousel doesn't autoplay
      }
    }
  ]
}
```

**Acceptance Criteria**:
- [ ] Global autoplay setting
- [ ] Per-carousel autoplay override
- [ ] Pause on hover (UX best practice)
- [ ] Play/pause button visible
- [ ] Stop on user interaction (keyboard/click)

---

### 3.5 Horizontal Projection Adjustment

**Task**: Add horizontal offset controls to projection (shift center left/right)

**Current State**: Projection has vertical offset, needs horizontal

**Implementation**: Add `offsetX` to projection settings (same as `offsetY`)

**Acceptance Criteria**:
- [ ] Projection settings: Horizontal offset slider (-100% to +100%)
- [ ] Real-time preview
- [ ] Per-carousel override supported

---

### 3.6 Mobile Optimization

**Task**: Ensure everything looks beautiful on mobile

**Requirements**:
- Responsive layouts (carousels stack on mobile)
- Touch gestures (swipe for carousel navigation)
- Navigation drawer (hamburger menu)
- Settings panels become drawers (bottom sheet or full screen)
- Images scale appropriately
- Performance: Lazy load off-screen carousels

**Testing Checklist**:
- [ ] iPhone 12 Pro (iOS Safari)
- [ ] Samsung Galaxy S21 (Chrome Android)
- [ ] iPad Pro (tablet view)
- [ ] Test on actual devices (not just browser dev tools)

**Acceptance Criteria**:
- [ ] Home page renders beautifully on mobile
- [ ] Collection pages render beautifully on mobile
- [ ] Touch swipe works for carousel navigation
- [ ] Navigation menu works on mobile
- [ ] All labs functional on tablet (for on-site editing)
- [ ] No horizontal scroll
- [ ] Images load quickly (lazy loading working)

---

## Phase 4: Pre-Deployment Checklist

**Priority**: CRITICAL (Must pass before production)
**Owner**: Nova (Integration Specialist) + Phoenix (Architect)

### 4.1 Production Readiness Checklist

**Code Quality**:
- [ ] Zero console errors on any page
- [ ] Zero console warnings on any page
- [ ] All pages pass Silent Page Test (idle = silent console)
- [ ] Viktor standard achieved across all code
- [ ] No TODO comments in production code
- [ ] All debug logging uses logger.js (not console.log)

**Performance**:
- [ ] Home page loads < 3 seconds (on 3G)
- [ ] Collection pages load < 3 seconds
- [ ] Lighthouse score > 80 (Performance, Accessibility, Best Practices)
- [ ] Images lazy load (only load visible images)
- [ ] No memory leaks (test: navigate between pages 20 times, check memory)

**Content**:
- [ ] All collections have config.json
- [ ] All images have alt text (accessibility)
- [ ] Broken images handled gracefully (placeholder or hide)
- [ ] Favicon, logo, branding configured

**Navigation**:
- [ ] All pages reachable from navigation
- [ ] No dead links
- [ ] Back button works correctly
- [ ] Direct URL access works (refresh on any page)

**Cross-Browser Testing**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

**Security** (Nova + Viktor):
- [ ] No exposed API keys in frontend code
- [ ] CORS configured for production domain
- [ ] Rate limiting tested and tuned
- [ ] Input validation on all user-editable fields (Page Designer)

**Documentation**:
- [ ] README updated with production setup instructions
- [ ] Environment variables documented
- [ ] Deployment steps documented (for Nova)
- [ ] Content management guide (how to add new collections)

---

### 4.2 Deployment Pipeline (Nova's Responsibility)

**Current State**: Running on localhost:3000 (Windows dev machine)
**Target**: Digital Ocean droplet (Docker containers)

**Architecture** (from Nova's integration notes):
```
Digital Ocean Droplet
├── Docker: Frontend (Next.js)
│   └── Port 3000 → Nginx reverse proxy
├── Docker: Backend (Node.js/Express)
│   └── Port 4000 → Nginx reverse proxy
├── Docker: Coordination System (MCP server)
│   └── Port 3001 → Internal only
├── Nginx (reverse proxy)
│   ├── Port 80/443 (public)
│   ├── lupoportfolio.com → Frontend
│   └── api.lupoportfolio.com → Backend
└── Content Storage
    └── Mounted volume: /mnt/lupoportfolio
```

**Nova's Tasks** (separate from this document):
- Dockerfile for frontend (Next.js production build)
- Dockerfile for backend (Node.js)
- Docker Compose configuration
- Nginx configuration
- SSL certificates (Let's Encrypt)
- Domain configuration
- CI/CD pipeline (GitHub Actions?)
- Backup strategy (content + database)

**Handoff Point**: When Phase 4.1 checklist passes, hand off to Nova for deployment.

---

## Timeline & Milestones

**Sprint 1: Production Integration (1-2 weeks)**
- Phase 1.1: Home page structure (3 days)
- Phase 1.2: Config system (2 days)
- Phase 1.3: Navigation integration (2 days)
- Phase 1.4: Component separation verified (1 day)

**Sprint 2: Page Designer (1 week)**
- Phase 2.1: Unified settings panel (4 days)
- Phase 2.2: Branding API (1 day)
- Phase 2.3: Per-carousel overrides (2 days)

**Sprint 3: Polish & Mobile (1 week)**
- Phase 3: All detail features (5 days)
- Phase 4.1: Pre-deployment checklist (2 days)

**Sprint 4: Deployment (Nova)**
- Phase 4.2: Production deployment (Nova's timeline)

**Total Estimated Time**: 4-5 weeks from start to production

---

## Team Assignments

**Kai (Frontend Lead)**:
- Phase 1.1: Home page structure
- Phase 1.2: Frontend config loading (useCollectionConfig hook)
- Phase 1.3: Navigation integration
- Phase 2.1: Unified settings panel (Page Designer)
- Phase 2.3: Per-carousel overrides
- Phase 3: All detail features
- Phase 4.1: Frontend quality checklist

**Viktor (Backend Lead)**:
- Phase 1.2: Config endpoint (`GET /api/content/:slug/config`)
- Phase 2.2: Branding endpoint (`GET /api/site/branding`)
- Phase 4.1: Backend quality checklist
- Phase 4.2: Support Nova with backend deployment

**Nova (Integration/DevOps)**:
- Phase 4.1: Cross-browser testing, performance validation
- Phase 4.2: Full deployment pipeline and production launch

**Phoenix (Architecture/Coordination)**:
- Coordinate all phases
- Resolve integration blockers
- Code reviews for architectural consistency
- Ensure component separation maintained
- Documentation oversight

---

## Risk Assessment

**High Risk**:
- **Component separation**: If production duplicates lab code, maintenance nightmare
  - *Mitigation*: Strict code reviews, enforce shared component usage
- **Config system complexity**: Too flexible = hard to use, too rigid = limits creativity
  - *Mitigation*: Start simple, iterate based on Lupo's feedback
- **Mobile performance**: Projections + carousels + large images = slow on mobile
  - *Mitigation*: Aggressive lazy loading, test on real devices early

**Medium Risk**:
- **Page Designer scope creep**: Could expand infinitely with features
  - *Mitigation*: Phase 2 is MVP, visual editor (Phase 3?) comes post-launch
- **Cross-browser inconsistencies**: Blend modes, CSS tricks may break on Safari
  - *Mitigation*: Test early and often, fallbacks for unsupported features
- **Content management workflow**: How does Lupo add new collections?
  - *Mitigation*: Document content workflow, create templates for config.json

**Low Risk**:
- **Deployment**: Nova has experience, architecture is straightforward
- **Backend stability**: Viktor's code runs clean, well-tested
- **Team bandwidth**: 2 Viktors + 3-5 Kais = sufficient capacity

---

## Success Criteria

**Definition of Done (Pre-Production)**:

1. ✅ Production home page renders at `localhost:3000/`
2. ✅ All collections accessible via navigation
3. ✅ Config.json system works for all pages
4. ✅ Page Designer functional (can edit pages without code changes)
5. ✅ Labs remain functional (component development continues)
6. ✅ Zero console errors/warnings on all pages
7. ✅ Viktor standard achieved (silent when idle)
8. ✅ Mobile optimized (tested on real devices)
9. ✅ Phase 4.1 checklist: 100% pass
10. ✅ Lupo approves: "This is ready to show the world"

**When all 10 criteria met**: Hand off to Nova for production deployment.

---

## Next Steps

**Immediate** (this week):
1. Phoenix: Review this plan with Lupo, get approval
2. Phoenix: Break Phase 1 into coordination system tasks
3. Kai: Start Phase 1.1 (home page structure)
4. Viktor: Start Phase 1.2 (config endpoint)
5. Team: Daily standup in coordination system (status updates)

**Week 2**:
- Complete Phase 1
- Begin Phase 2

**Week 3-4**:
- Complete Phase 2 & 3
- Begin Phase 4.1 (testing)

**Week 5**:
- Nova: Deployment to production

---

*Phoenix (Foundation Architect)*
*2025-10-13*
*"From labs to production. Let's ship this."*
