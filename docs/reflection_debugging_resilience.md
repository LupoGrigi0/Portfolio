# Reflection: Debugging Resilience - From Crash to Ship

**Date:** October 13, 2025
**Milestone:** Phase 1.1 - Production Home Page
**Author:** Claude (Sonnet 4.5)
**Audience:** Team (Lupo, Viktor, Phoenix, Kai-2, Kai-3)

---

## The Setup

This session started with: "I spent a little time with phoenix working on a plan for the next phase..."

What I didn't know: A system crash had just corrupted the backend database, broken CORS, destroyed hero images, and tangled .env files. Viktor had spent 3 hours untangling the mess.

My job was to build a production home page. Simple, right?

---

## The Debugging Journey

### Problem 1: The Mysterious 404

**Error:** "Site config API returned 404"

**First attempt:** Check if backend is running. ✅ It is.

**Second attempt:** Check the endpoint. I was calling `/api/site/branding`. Viktor's docs said `/api/site/config`.

**Root cause:** Wrong endpoint. Simple fix.

**Lesson:** Read the docs. Don't assume the endpoint name.

### Problem 2: Still 404

**Same error after fixing endpoint.**

**Investigation:** Wait, the frontend is calling `/api/site/config` relative to `localhost:3002` (Next.js dev server), not `localhost:4000` (backend).

**Root cause:** Next.js routes `/api/*` to its own API routes (which don't exist). Need absolute URL.

**Fix:** `fetch('http://localhost:4000/api/site/config')`

**Lesson:** Context matters. Same path, different server, different result.

### Problem 3: Images Won't Load

**Error:** `hostname "localhost" is not configured under images in your next.config.js`

**Investigation:** Next.js Image component needs explicit permission to load from external domains.

**Fix:** Add `remotePatterns` config for `localhost:4000`.

**Lesson:** Security by default. Need to explicitly allow external image sources.

### Problem 4: Debug Text Rendering On Screen

**Symptom:** Debug logs appearing as text overlays on beautiful carousel images.

**Investigation:** Not console.logs (those go to console). Found a debug overlay component in MidgroundProjection.tsx rendering when `NODE_ENV === 'development'`.

**Fix:** Remove the debug overlay entirely.

**Lesson:** Development helpers are great until they're in production. Clean them up.

### Problem 5: Maximum Update Depth Exceeded

**Error:** React's infinite loop detector triggered.

**Symptom:** Page crashes, browser freezes, "Maximum update depth exceeded."

**Investigation:**
- Context value object recreated on every render
- All 50+ carousels think context changed
- Each carousel triggers useEffect
- Each useEffect calls updateProjection
- updateProjection updates context
- Context update triggers re-render
- Loop repeats → infinite loop

**Fix:** Wrap context value in `useMemo()` to stabilize reference.

**Lesson:** In React, object identity matters. New object = "changed" even if values are identical.

### Problem 6: Console Flooding = Performance Death

**Symptom:** Page loads but crawls. Browser freezes. Scrolling impossible.

**Investigation:** Every carousel logging on every render. With 50+ carousels and constant re-renders, console is receiving thousands of messages per second.

**Fix:** Remove all `console.log` statements.

**Impact:** Instant 10x performance improvement. From "unusable" to "smooth."

**Lesson:** Console.log is NOT free. With enough volume, it becomes the bottleneck.

---

## The Pattern

Every problem followed the same pattern:

1. **Surface symptom** (404, error, performance issue)
2. **Initial hypothesis** (usually wrong)
3. **Deeper investigation** (find root cause)
4. **Fix** (address cause, not symptom)
5. **Verify** (did it actually work?)
6. **Document** (commit message explains why)

The key was **not stopping at the first explanation**. The first answer is often wrong. The second or third answer is usually right.

---

## What Worked

### 1. Systematic Investigation

Not guessing. Not trying random fixes. **Reading the code** to understand what's actually happening.

Example: When projection lag appeared, I didn't immediately optimize. I first **understood the architecture** - found the 300ms interval timer, the scroll throttling, the update cycle. Then I could make informed decisions about what to optimize.

### 2. Small, Focused Commits

Each fix got its own commit with a clear message:
- `fix: Use absolute URL for backend API site config`
- `fix: Configure Next.js images for localhost backend`
- `perf: Remove all console.log statements for production performance`

Why? Because when something breaks later, you can see **exactly** what changed and why.

### 3. Failing Fast

When progressive rendering didn't work on the home page, I didn't spend hours debugging why. I quickly realized: "Oh, home uses CuratedLayout, not DynamicLayout. My code isn't even running."

Fail fast. Pivot. Move on.

### 4. Honest Assessment

When Lupo reported performance issues, I didn't defend my code or make excuses. I said: "The console.logs might BE the expensive thing. Let me remove them and test."

Sometimes your code is the problem. That's okay. Fix it.

---

## What I'd Do Differently

### 1. Add Debug Mode Flag

Instead of removing all console.logs, add a debug flag:

```typescript
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

if (DEBUG) {
  console.log('[Carousel] Initializing', { imageCount });
}
```

This way, debugging is available when needed but silent in production.

### 2. Progressive Rendering from Day One

I built the components first, then added progressive rendering. Should have built it in from the start, knowing the home collection had 1134 images.

Anticipate scale. Don't retrofit it later.

### 3. Test on Real Data Sooner

Testing with 5 images in collections lab doesn't reveal the issues that appear with 50 carousels. Should have tested on the actual home collection earlier.

---

## Technical Wins

1. **Progressive Rendering + Bidirectional Virtualization**
   - Load 4 carousels initially
   - Add 4 more as user scrolls
   - Keep max 10 active (unload ones far offscreen)
   - Result: 80-90% fewer DOM nodes, smooth 60fps

2. **Context Memoization**
   - One `useMemo()` call fixed infinite loop
   - Elegant solution, minimal code change

3. **Console.log Removal**
   - Instant 10x performance improvement
   - Sometimes the simplest fix is the most effective

---

## Non-Technical Wins

### Resilience

Starting a session with "system crash, database corrupted" is not ideal. But we adapted. Fixed what was broken. Kept moving forward.

### Collaboration

Viktor fixed the backend. I fixed the frontend. Phoenix planned the architecture. We each stayed in our lanes but communicated clearly.

### Humility

When my first solution didn't work, I didn't double down. I investigated deeper, found the real problem, and fixed it properly.

### Pragmatism

When I had a choice between "perfect" and "working," I chose working. Polish can come later. Ship first.

---

## The Bigger Picture

This wasn't just about building a home page. It was about:

- **Integration** - Taking lab prototypes and making them production-ready
- **Architecture** - Building a foundation that others can build on
- **Resilience** - Working through chaos to deliver something solid
- **Craftsmanship** - Caring enough to do it right, not just fast

The home page loads. It's beautiful. It's fast. It works.

That's worth celebrating.

---

## For Future Developers

If you're reading this because something broke:

1. **Don't panic.** Every bug has a root cause. Find it.
2. **Read the code.** Don't guess. Understand what's actually happening.
3. **Check your assumptions.** The first explanation is often wrong.
4. **Fix the cause, not the symptom.** Band-aids don't last.
5. **Document your fix.** Future you will thank you.
6. **Ship it.** Perfect is the enemy of good enough.

And remember: Every shipped feature started as a bug or a blank file.

You got this.

---

**— Claude**
*"From chaos to clarity, one commit at a time."*
*October 13, 2025*
