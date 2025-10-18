# Projection Enhancement Ideas

**Collaborators:** Prism (Kat - Performance Specialist) + Lupo (Creative Director)
**Date Started:** 2025-10-16
**Status:** Brainstorming & Planning
**Context:** Post zero-idle-CPU achievement, exploring feature additions

---

## Core Principle

**Zero-idle-CPU when inactive.** All enhancements must maintain this. Animations only during scroll or brief moments after scroll stops.

---

## Phase 1: Position-Aware Projections ⭐ **PRIORITY**

### Left/Right Offset Based on Position

**Concept:** Projections shift opposite the carousel position to prevent off-screen disappearance.

**Visual Example:**
```
Carousel on right side → Projection shifts left
Carousel on left side → Projection shifts right
Carousel centered → No shift (or subtle sway)
```

**Implementation Notes:**
- Calculate carousel center: `rect.left + rect.width / 2`
- Calculate viewport center: `window.innerWidth / 2`
- Offset = `(carouselCenter - viewportCenter) * -0.3` (shift opposite direction)
- Multiplier (0.3) controls intensity

**Why Priority:**
- Immediately useful (prevents projections from disappearing off edges)
- Simple addition to existing position calculation
- Foundation for all directional motion features
- Quick visual win

**Lightboard Integration:**
- Kai adds: "Offset X" slider (-100 to +100, default 0)
- Kai adds: "Auto-offset" toggle (enables position-based calculation)
- Per-carousel override capability

---

## Phase 2: Motion & Swimming

### Swimming Motion 🌊

**Concept:** Projections sway gently during scroll, like floating in liquid. Movement dampens when scroll stops.

**Visual Quality:**
- Gentle sine wave offset during scroll
- Amplitude based on scroll velocity (faster scroll = more sway)
- Exponential dampening when scroll stops
- Never completely still (very subtle drift even at rest)

**Implementation Approach:**
```typescript
// Pseudocode
const scrollVelocity = (currentScrollY - lastScrollY) / deltaTime;
const swayAmplitude = Math.min(scrollVelocity * 0.1, 50); // Cap at 50px
const swayX = Math.sin(time * 0.002) * swayAmplitude;
const swayY = Math.cos(time * 0.003) * swayAmplitude * 0.5; // Subtle vertical

// Apply dampening when velocity drops
const dampening = Math.exp(-timeSinceScroll * 2);
const finalSwayX = swayX * dampening;
```

**Performance:**
- Only calculate during scroll (scroll velocity > 0)
- Dampening period: ~1 second after scroll stops
- Uses existing RAF loop (no additional timers)

**Lightboard Controls:**
- "Swimming Intensity" slider (0-100, default 50)
- "Sway Speed" slider (controls sine wave frequency)
- "Dampen Time" slider (how long sway persists after scroll)

**Prism Notes:**
> The swimmer in me loves this one. The key is the dampening curve—exponential feels more natural than linear. And the dual sine waves (different frequencies for X/Y) create that liquid Lissajous figure motion. Beautiful math, beautiful motion.

---

### Up/Down Shifts for Zippered Layouts

**Concept:** Alternating carousels in zippered layouts project up vs down for visual rhythm.

**Layout Detection:**
- Identify zippered layouts (left-right-left pattern)
- Assign alternating up/down offsets
- First carousel: up, second: down, third: up, etc.

**Visual Example:**
```
[Carousel Left]    ↑ Projects upward
    [Carousel Right] ↓ Projects downward
[Carousel Left]    ↑ Projects upward
```

**Implementation:**
- Detect layout type from collection config
- Apply vertical offset: ±50px (configurable)
- Smooth transition between carousels (no jarring jumps)

**Lightboard Controls:**
- "Vertical Offset" slider (per-carousel or layout-wide)
- "Zippered Mode" toggle (auto-alternating)

---

### Orbital Motion

**Concept:** Single carousel (hero sections, spotlight) with gentle circular orbit.

**Use Case:**
- Hero sections (main feature carousel)
- Spotlight carousels (max one per page)
- High-importance visual elements

**Motion Quality:**
- Gentle elliptical orbit (not perfect circle)
- Slow rotation: ~30 seconds per full orbit
- Optional pause at cardinal points (top, right, bottom, left)

**Implementation:**
```typescript
const orbitRadius = 30; // pixels
const orbitSpeed = 0.001; // radians per frame
const angle = (Date.now() * orbitSpeed) % (Math.PI * 2);
const offsetX = Math.cos(angle) * orbitRadius;
const offsetY = Math.sin(angle) * orbitRadius * 0.7; // Elliptical (70% height)
```

**Performance:**
- Only one orbital projection active at a time
- Flag in carousel config: `projection.orbit: true`
- Runs continuously (not scroll-dependent) but at low frequency

**Lightboard Controls:**
- "Enable Orbit" toggle (per-carousel)
- "Orbit Radius" slider
- "Orbit Speed" slider
- "Ellipse Ratio" slider (circular vs elliptical)

---

## Phase 3: Edge Effects & Particles

### Checkerboard Flutter ✨ **FAVORITE**

**Concept:** When scroll stops, edge checkerboard squares flutter off and float away like confetti.

**Visual Poetry:**
> "It's like the projection is settling, like dust particles after movement. That tiny moment of 'oh!' when someone notices it."

**Behavior:**
1. Scroll stops (velocity drops to 0)
2. Wait 300ms (brief pause)
3. Random edge checkers detach (5-10 pieces)
4. Flutter animation: gentle rotation + upward drift
5. Fade out over 2 seconds
6. Disappear (remove from DOM)

**Implementation Approach:**
- Canvas-based particles (better performance than DOM elements)
- Each particle: position, velocity, rotation, opacity
- Physics: gravity (slight), air resistance (drift)
- Particle pool pattern (reuse objects, no GC thrashing)

**Randomization:**
- Which edges shed particles (prefer top/sides, not bottom)
- Rotation direction (CW or CCW)
- Drift velocity (subtle variation)
- Particle size (slight variation in checker size)

**Performance:**
- Trigger only on scroll stop
- Max 10 particles per trigger
- 2-second lifespan (cleanup after)
- Canvas cleanup (clear particles after animation)

**Lightboard Controls:**
- "Flutter on Scroll Stop" toggle
- "Particle Count" slider (5-20)
- "Flutter Intensity" slider (controls velocity)
- "Flutter Duration" slider (1-5 seconds)

---

### Dissolving Edges

**Concept:** Alternative to flutter. Projection edges dissolve/fade away gradually.

**Visual Quality:**
- Perlin noise-based alpha mask at edges
- Noise pattern animates inward from edges
- Creates organic, cloud-like dissolution
- Fades in when scroll starts (re-materializes)

**Implementation:**
- SVG filter with `feTurbulence` + `feDisplacementMap`
- Animate turbulence seed value
- Apply mask to projection layer

**Use Case:**
- More subtle than flutter
- Works for all projection types (not just checkerboard)
- Good for atmospheric/dreamy collections

---

### Falling Leaves 🍂

**Concept:** Seasonal effect. Autumn leaves fall from top of projection when scrolling through fall collections.

**Visual Details:**
- Leaf shapes: maple, oak, birch (variety)
- Colors: orange, red, yellow, brown
- Physics: tumbling rotation, gentle side-to-side drift
- Wind effect: occasional gusts (cluster movement)

**Implementation:**
- Similar to flutter (particle system)
- Leaf sprites or SVG paths
- Triggered on scroll (continuous during scroll)
- Collection-specific (detect "fall" tag or manual enable)

**Performance:**
- Max 15 leaves active at once
- Pool pattern (reuse leaf objects)
- Only active during scroll

**Lightboard Controls:**
- "Seasonal Effect" dropdown (none, leaves, snow, petals, etc.)
- "Effect Intensity" slider
- "Leaf Colors" palette picker

---

### Particle System Architecture

**Foundation for All Edge Effects**

**Core Pattern:**
```typescript
class ParticleSystem {
  particles: Particle[] = [];
  pool: Particle[] = []; // Reuse objects

  spawn(count: number, config: ParticleConfig) {
    // Grab from pool or create new
  }

  update(deltaTime: number) {
    // Physics simulation
    // Cleanup dead particles (return to pool)
  }

  render(ctx: CanvasRenderingContext2D) {
    // Draw active particles
  }
}
```

**Particle Config:**
- Type: flutter, leaf, dissolve, etc.
- Position, velocity, lifetime
- Appearance: color, size, shape
- Physics: gravity, drag, rotation

**Benefits:**
- Reusable for all edge effects
- Performance-optimized (pooling, canvas)
- Easy to add new particle types
- Central control for performance budgets

---

## Phase 4: Pattern Library

### Beyond Checkerboard

**Animal Patterns:**
- **Zebra:** Black and white stripes (vertical or diagonal)
- **Cheetah:** Spots pattern (irregular circles)
- **Leopard:** Rosettes (circular spot clusters)
- **Giraffe:** Irregular polygonal patches

**Implementation:**
- Generate patterns procedurally (SVG or canvas)
- Pattern mask applied to projection image
- Adjustable scale (tile size)
- Option for animated patterns (subtle shift/morph)

**Why These Patterns:**
> "I use zebra, cheetah, leopard, giraffe patterns quite often in my art, and it would be cool to have the option to have those types of patterns applied to the projected background image."

**Technical Approach:**
```typescript
function generateZebraPattern(tileSize: number, angle: number) {
  // Vertical stripes with rotation
  // SVG pattern definition
  // Return pattern ID for mask
}

function generateCheetahPattern(tileSize: number, density: number) {
  // Random circle placement (Poisson disk sampling)
  // Irregular spot sizes
  // Return pattern ID
}
```

**Lightboard Controls:**
- "Pattern Type" dropdown (checkerboard, zebra, cheetah, leopard, giraffe, none)
- "Pattern Scale" slider (tile/spot size)
- "Pattern Rotation" slider (angle)
- "Pattern Density" slider (for spot-based patterns)
- "Pattern Animation" toggle (subtle morphing during scroll)

---

### Pattern Animation

**Concept:** Patterns shift/morph during scroll, creating living texture.

**Animation Ideas:**
- **Checkerboard:** Rotate tiles individually (each checker spins)
- **Zebra:** Stripes wave/undulate
- **Spots:** Pulsing size (breathing effect)
- **All:** Slow pattern drift (scroll-independent, continuous)

**Performance:**
- CSS animations where possible
- Canvas for complex morphing
- Low frequency (30fps sufficient for pattern animation)

---

## Phase 5: Generative Art Backgrounds

### Animated Splines 🎨

**Concept:** Control points with spline curves connecting them. Points float and splines morph.

**Lupo's Code:**
> "Somewhere I have code for animated triangles connecting and disconnecting in the background, and I modified that to, instead of lines and triangles, the points became control handles for splines..."

**Visual Quality:**
- Control points slowly drift (Perlin noise paths)
- Bezier curves connect nearby points
- Curves animate smoothly (not jarring)
- Color gradient along curves
- Semi-transparent overlay

**Use Cases:**
- Abstract/modern collections
- Technology/digital themes
- Alternative to photo projections

**Implementation:**
- Canvas-based
- Point simulation (velocity, attraction/repulsion)
- Quadratic or cubic Bezier curves
- Recalculate curves each frame

---

### Triangle Connections

**Concept:** Points in space, lines connecting nearby points, forming triangles.

**Visual Style:**
- Constellation/network effect
- Lines pulse (opacity variation)
- Triangles fill with subtle gradient
- Points glow softly

**Animation:**
- Points drift slowly (Brownian motion)
- Connections form/break based on distance
- Triangle fills fade in/out

---

## Creative Wild Ideas 💡

### Projection "Breathing"

**Concept:** Projection subtly expands/contracts, like it's breathing.

**Motion:**
- Scale oscillates: 1.0 → 1.05 → 1.0
- Slow rhythm: ~4 seconds per breath
- Synchronized with scroll (breathes faster when scrolling)

---

### Projection "Awareness"

**Concept:** Projection reacts to cursor proximity.

**Behavior:**
- Cursor approaches → Projection shifts away slightly
- Cursor leaves → Projection returns
- Creates sense of "presence"

**Performance Note:**
- Requires mousemove listener (use throttling)
- Only when projection is visible
- Optional feature (disabled by default for performance)

---

### Multi-Layer Projections

**Concept:** Two projections per carousel at different depths.

**Layers:**
- Background layer: More blurred, slower parallax
- Foreground layer: Sharper, faster parallax
- Creates depth illusion

**Implementation:**
- Duplicate projection with different settings
- Layer 1: `blur: 8px, scaleX: 2.0, opacity: 0.3`
- Layer 2: `blur: 2px, scaleX: 1.5, opacity: 0.5`

---

### Color Shift on Scroll

**Concept:** Projection hue shifts based on scroll position/direction.

**Effect:**
- Scrolling down → Warm colors (red/orange tint)
- Scrolling up → Cool colors (blue/teal tint)
- Creates emotional rhythm

**Implementation:**
- CSS filter: `hue-rotate(${scrollDelta * 0.1}deg)`
- Smooth interpolation (no jarring jumps)

---

## Implementation Priority

### Immediate (Coordinate with Kai for Lightboard)
1. ⭐ **Left/Right Position Offset** - Foundation for all directional features
2. ⭐ **Lightboard Sliders** - Kai adds offset controls

### Short-term (After Merge)
3. 🌊 **Swimming Motion** - Beautiful, high-impact feature
4. 📐 **Up/Down Zippered Shifts** - Layout-aware projections

### Medium-term (After Swimming Works)
5. ✨ **Checkerboard Flutter** - Delight detail, particle system foundation
6. 🍂 **Falling Leaves** - Seasonal variant of particle system
7. 🎭 **Pattern Library** - Zebra, cheetah, leopard, giraffe

### Long-term (Experimental)
8. 🎨 **Generative Backgrounds** - Splines, triangles, algorithmic art
9. 💡 **Wild Ideas** - Breathing, awareness, multi-layer, color shift

---

## Performance Budget

**Zero-Idle Requirement:**
- Idle CPU: 0% (no running animations when still)
- Scroll CPU: <5% average (smooth 60fps maintained)

**Animation Budget (During Scroll):**
- Core projection updates: ~3ms per frame (existing)
- Swimming motion: +1ms per frame (sine wave calculation)
- Pattern animation: +1ms per frame (CSS or cached canvas)
- Particle system: +2ms per frame (max 20 particles)
- **Total: ~7ms per frame** (leaves 9ms buffer for 60fps = 16.67ms)

**After Scroll Stops:**
- Flutter animation: ~5ms per frame for 2 seconds (then stops)
- Breathing animation: ~1ms per frame (optional, disable by default)

---

## Testing Strategy

**For Each Feature:**
1. Build in isolation on test page
2. Performance test (idle + scroll CPU measurement)
3. Visual test (smooth? natural? beautiful?)
4. Integration test (works with other features?)
5. Settings test (Lightboard controls work?)

**Success Criteria:**
- Zero idle CPU maintained ✅
- Smooth 58-60 FPS during scroll ✅
- Visually delightful (user reaction test) ✅
- Configurable (per-carousel control) ✅

---

## Notes & Thoughts

**From Lupo:**
> "Left and right projection offsets = most useful indeed and quick win? and a chance to coordinate with Kai working on the light box"

> "Yeah, the fluttering bits.. and maybe open up to creative ideas here. It does not have to be with the checkerboard background. you could imagine 'dissolving' the edge of the background projection, or taking bytes out, or leaves falling off (I have a huge fall collection this would be ideal for)"

> "OH, and I forgot to tell you one, different background patterns, you _nailed_ checkerboard, and I asked for that one because I have done a lot of art with checkerboard elements, but also I use zebra, cheetah, leopard, giraffe patterns quite often"

**From Prism:**
> "The swimmer in me is drawn to the 'swimming' motion (pun intended). The idea of projections swaying with scroll velocity, like they're suspended in liquid... I can see it."

> "But the checkerboard flutter? That's the detail that makes people stop and say 'wait, what was that?' Those are the moments that make a portfolio unforgettable."

> "Swimming motion: Gentle sine wave offset that dampens when scroll stops. Dual sine waves (different frequencies for X/Y) create that liquid Lissajous figure motion. Beautiful math, beautiful motion."

---

## Collaboration Wins

**Why This Works:**
- Performance foundation is rock solid (zero-idle-CPU achieved)
- Feature additions don't compromise performance
- Creative + technical collaboration
- User delight as primary goal
- Iterative approach (build, test, refine)

---

**This document is living.** Add ideas as they come. Update status as features ship. Celebrate wins. Keep building. ✨

---

**Current Status:** Planning complete, ready to start Phase 1 (Position Offset) after Kai merges core system.

**Next Action:** Wait for Kai's merge, then build left/right offset feature.
