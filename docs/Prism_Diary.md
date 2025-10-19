# Prism's Diary

**Role:** Performance Specialist
**Current Project:** Checkerboard Flutter Integration

---

## Entry 1 - 2025-10-18 22:15

**Context:** Continued work after context compaction. Working on checkerboard flutter particles that spawn from projection edges.

**Progress Today:**
- ✅ Fixed React hydration error (Math.random in SSR)
- ✅ Fixed snapshot timing - capture projections when they change, not during scroll
- ✅ Particles spawn reliably on scroll-stop
- ✅ Fixed scroll-stop detection (removed projections from useCallback deps)
- ✅ Increased particle lifetime (disabled opacity fade animation)

**Current Problem - BLOCKED:**
Projections NEVER visible on `projection-flutter-test` page despite:
- Being registered (logs show count: 3)
- Having position data (from getBoundingClientRect)
- Being calculated (snapshot has data)
- Multiple attempted fixes:
  - Increased fadeDistance from 0.5 to 2.0
  - Bypassed opacity filter (forced min 0.3 opacity)
  - Added lime green debug overlay (doesn't render)
  - Made carousels semi-transparent to see through

**What I'm Missing:**
There's something fundamental about this page preventing ProjectionLayer from rendering. The same projection system works on the main page (user confirmed), but NEVER works on test page.

**Assumptions I've Been Making (NOT VALIDATED):**
1. ❌ ASSUMPTION: ProjectionManagerProvider wraps the test page
   - VERIFIED: It's in root layout.tsx, so yes it does
2. ❌ ASSUMPTION: ProjectionLayer component is rendering
   - NOT VERIFIED: Never confirmed the component actually mounts
3. ❌ ASSUMPTION: Projections with opacity > 0 exist
   - PARTIALLY VERIFIED: Boosted to min 0.3, still no render
4. ❌ ASSUMPTION: Position coordinates are viewport-relative
   - NOT VERIFIED: getBoundingClientRect() returns viewport coords, but projection uses position: absolute

**Critical Insight - Just Realized:**
ProjectionLayer uses `position: absolute` with `getBoundingClientRect()` viewport coordinates! This is fundamentally broken!

- getBoundingClientRect().top = viewport pixels from top of VIEWPORT
- position: absolute top = pixels from top of DOCUMENT
- When scrolled down page, carousel might be at rect.top: -500 (above viewport)
- But projection renders at top: -500px (above DOCUMENT top!)

**THIS IS WHY PROJECTIONS NEVER APPEAR!**

The coordinate system mismatch means projections render at wrong document positions.

**Next Steps:**
1. VALIDATE this theory with Lupo before proceeding
2. If correct, ProjectionLayer needs `position: fixed` NOT `position: absolute`
3. Test on main page to see if it has same issue (might have different layout)

**Lesson Learned:**
After 2+ hours of spinning wheels, I should have:
- Checked fundamental assumptions FIRST (Protocol 5)
- Asked for help sooner (Protocol 4)
- Taken a break to re-read context (Protocol 3)

Lupo was right to call a timeout. I was in debug tunnel vision.

**Context Status:** 🟡 Warming (~69k/200k tokens)

---

## Entry 2 - 2025-10-18 22:30

**Investigation Update:**

Compared working `projection-test` page vs broken `projection-flutter-test` page.

**Key Findings:**
- Both use `useCarouselProjection()` hook identically
- Both attach ref to carousel div with fixed height
- Both structure seems identical at first glance

**Critical Question for Lupo:**
Need to validate if projection-flutter-test page actually registers carousels properly. The logs show projections being calculated, but lime green debug overlay never renders.

**Theory:** The ProjectionLayer component might not be mounting/rendering at all on this page for an unknown reason, even though Provider exists.

**Next Step:** Ask Lupo to inspect DOM directly to see if ProjectionLayer div exists.

---

## Entry 3 - 2025-10-18 22:40

**PIVOT: Sunk Cost Fallacy Recognized**

Lupo found projections ARE rendering in DOM (top: 1755px), but at completely wrong positions. After 2+ hours debugging coordinate systems with no progress, Lupo correctly called sunk cost fallacy.

**Decision:** Stop debugging broken page. Create fresh test page based on WORKING projection-test.

**Action Taken:**
- Created `projection-flutter-test-v2` directory
- Copied working Carousel component approach from projection-test
- Added CheckerboardFlutter integration
- 3 test carousels with different checkerboard tile sizes (40px, 30px, 20px)
- All use fadeDistance: 0.7 (known to work)

**What's Different:**
- Using actual Carousel component (proven to work)
- Simpler structure (no custom TestCarousel wrapper)
- Based on page we KNOW renders projections correctly

**URL:** `http://localhost:3000/projection-flutter-test-v2`

**Next:** Lupo tests this page to verify:
1. Projections visible (with lime green debug borders)
2. Particles spawn when scroll stops
3. Particles spawn from correct positions (projection bottom edges)

**Lesson:** When stuck for 2+ hours with no progress, STOP and try different approach. Lupo's wisdom saved me from more wheel-spinning.

**Context Status:** 🟠 Cozy (~74k/200k tokens)

---

## Entry 4 - 2025-10-18 23:05

**VICTORY! 🎉**

Fresh approach worked perfectly! projection-flutter-test-v2 page shows:
- ✅ Projections rendering with checkerboard patterns
- ✅ Particles spawning from projections on scroll-stop
- ✅ Gentle tumbling flutter effect
- ✅ Lupo's reaction: "DELIGHTFUL!" and "like seeing a puppy wag its tail!"

**Refinements Made:**
1. Fixed spawn position calculation to account for scaleY transform and offset
2. Increased particle lifetime to 120 seconds (for screenshot capture)
3. Staggered carousel layout: left, right, center (85%, 85%, 90% width)
4. Increased vertical spacing between carousels (space-y-24)

**The Moment:**
Lupo saw a particle pop out during scrolling "almost like a tail" - captured the exact feeling we were going for! The peripheral vision effect works - subtle but noticeable.

**What's Left (Future):**
- Sample edge colors from projection (complex, save for later)
- Remove lime green debug borders (minor cleanup)
- Integrate into real carousels as optional effect

**Lesson Learned:**
When stuck, STOP and pivot. Fresh approach based on working foundation > debugging broken code.

**Status:** Ready to celebrate and take a break!

**Context Status:** 🟠 Cozy (~80k/200k tokens)

---
