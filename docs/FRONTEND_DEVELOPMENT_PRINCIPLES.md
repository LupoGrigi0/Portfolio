# Frontend Development Principles

**Status**: ACTIVE - Required reading for all frontend specialists
**Created**: 2025-10-05
**Author**: Phoenix (Foundation Architect)
**Priority**: CRITICAL

---

## The Core Problem We're Solving

After 3 days of frontend development spinning in circles with performance optimizations, console error suppression, and blaming backend rate limiting, we need to **reset expectations and approach**.

**What went wrong**:
- Premature optimization (60fps focus before basic functionality)
- Over-engineering with Next.js advanced features before understanding the problem
- Removing instrumentation to hide errors instead of fixing root causes
- Blaming Viktor's rate limiting when frontend code is over-fetching
- Complexity-first instead of simplicity-first

**What we're fixing**: Development approach and priorities.

---

## Development Priority Order

### Phase 1: Make It Work (We Are Here)

**Goal**: Basic functionality with visible data

**Allowed**:
- Simple fetch calls
- Basic React components
- Vanilla CSS or simple Tailwind
- Console logging EVERYWHERE
- Synchronous, blocking operations
- Loading states that say "Loading..."
- Hard-coded test data to validate UI
- Reading from Viktor's API without caching

**NOT Allowed**:
- Performance optimizations
- Lazy loading
- Prefetching
- Advanced Next.js features (ISR, SSR, edge functions)
- Removing console.log statements
- Complex state management
- Blaming other specialists' code

**Success Criteria**:
- ✅ Page loads and displays images from Viktor's API
- ✅ Navigation works (next/previous)
- ✅ No console errors (if errors exist, FIX THEM, don't hide them)
- ✅ Code is readable and debuggable
- ✅ No requests when page is idle

**Performance Target**: Don't care. If it takes 5 seconds to load, that's fine.

---

### Phase 2: Make It Right

**Goal**: Clean architecture, proper patterns, error handling

**Focus**:
- Proper error boundaries
- Loading states with user feedback
- Clean component hierarchy
- Proper TypeScript types
- Organized file structure
- API client layer (single place for all fetches)
- Proper caching strategy (only after understanding fetch patterns)

**Success Criteria**:
- ✅ Code follows React best practices
- ✅ Error cases handled gracefully
- ✅ Components are reusable
- ✅ API calls go through single client layer
- ✅ No duplicate fetches for same data
- ✅ Still no console errors

**Performance Target**: Sub-5 second initial load. Don't optimize beyond this yet.

---

### Phase 3: Make It Fast

**Goal**: Optimize based on MEASURED performance problems

**Process**:
1. **Profile first**: Use React DevTools Profiler, Chrome Performance tab
2. **Identify bottlenecks**: What's actually slow?
3. **Optimize the bottleneck**: Not everything, just the slow part
4. **Measure improvement**: Did it actually get faster?
5. **Repeat**

**Optimizations** (only after profiling shows need):
- Image lazy loading (if initial load > 3s)
- Prefetching adjacent images (if navigation feels slow)
- React.memo for expensive components (if re-renders are visible)
- Virtualization for long lists (if scroll is janky)
- Code splitting (if bundle > 500KB)

**Success Criteria**:
- ✅ 60fps scrolling (if applicable to current work)
- ✅ Sub-2s initial load
- ✅ Smooth transitions
- ✅ Optimization is measurable and documented

---

## Debugging Principles

### 1. Console Logging is Your Friend

**DO**:
```typescript
console.log('[CollectionPage] Fetching collection:', slug);
console.log('[CollectionPage] Received data:', data);
console.log('[CarouselImage] Rendering image:', imageUrl);
```

**DON'T**:
```typescript
// Removing logs because there are too many
// (If there are too many, your code is doing too much)
```

**Rule**: If you have so many console logs it crashes the browser, your code is running too often. Fix the code, don't remove the logs.

---

### 2. When Page is Idle, Code Should Be Silent

**Symptom**: Console shows continuous activity when you're not interacting with page

**Diagnosis**: Your useEffect dependencies are wrong, or you have infinite loops

**Fix**:
1. Find what's running (console.log in the running code)
2. Trace back to useEffect or event handler
3. Fix the dependencies or break the loop
4. Verify: Page idle = Console silent

**NOT The Fix**: "Viktor's rate limiting is too aggressive"

---

### 3. Rate Limiting is a Feature, Not a Bug

**If you're hitting rate limits**:
- Your code is making too many requests
- This will cost money in production ($$$)
- This will slow down users
- This is YOUR problem to fix

**How to fix**:
1. Add console.log to every fetch call
2. Count how many fetches happen on page load
3. Should be: O(collections) + O(visible images)
4. If it's: O(collections × images) or worse, you have a bug
5. Fix the bug (probably useEffect dependency array)

**Viktor's backend is correct.** If you're getting rate limited, you're over-fetching.

---

### 4. Blame Yourself First

**Order of investigation**:
1. Is my code doing something wrong? (95% of issues)
2. Am I misunderstanding the API? (4% of issues)
3. Is there a bug in someone else's code? (1% of issues)

**Process**:
1. Reproduce the problem
2. Add instrumentation to YOUR code
3. Find YOUR bug
4. Fix it
5. Only THEN, if problem persists, ask other specialist

---

## Specific Technical Rules

### Fetching Data

**Simple Pattern** (Phase 1):
```typescript
export default function CollectionPage({ params }: { params: { slug: string } }) {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[CollectionPage] Fetching collection:', params.slug);

    fetch(`http://localhost:4000/api/content/collections/${params.slug}`)
      .then(r => r.json())
      .then(data => {
        console.log('[CollectionPage] Received:', data);
        setCollection(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('[CollectionPage] Error:', err);
        setLoading(false);
      });
  }, [params.slug]); // Only re-fetch if slug changes

  if (loading) return <div>Loading collection...</div>;
  if (!collection) return <div>Collection not found</div>;

  return <div>{/* Render collection */}</div>;
}
```

**What makes this good**:
- Runs once per slug
- Clear logging
- Simple error handling
- No premature optimization
- Easy to debug

**Advanced Pattern** (Phase 2):
```typescript
// api-client.ts - Single place for all API calls
export const apiClient = {
  async getCollection(slug: string) {
    console.log('[API] Fetching collection:', slug);
    const response = await fetch(`http://localhost:4000/api/content/collections/${slug}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log('[API] Received collection:', slug, data);
    return data;
  }
};

// collection-page.tsx
import { apiClient } from '@/lib/api-client';

export default function CollectionPage({ params }) {
  const [collection, setCollection] = useState(null);

  useEffect(() => {
    apiClient.getCollection(params.slug)
      .then(setCollection)
      .catch(console.error);
  }, [params.slug]);

  // ... render
}
```

**What makes this better**:
- Centralized API calls (easy to add caching later)
- Still simple and debuggable
- Logging in one place
- Can add retry logic, caching, etc. without touching components

---

### React Best Practices for This Project

**Component Size**: Small. If it's > 200 lines, split it.

**Props**: Explicit. Don't spread `{...props}` unless you know why.

**State**: Local first. Only lift to parent when sharing is needed.

**Effects**: Minimal. If you have > 3 useEffect in one component, refactor.

**Dependencies**: Correct. ESLint will warn you. Listen to it.

**Keys**: Stable. Use IDs, not array indices (unless list never changes).

---

## Next.js Specific Guidance

### What We're Using (Phase 1)

- App Router (we're committed)
- Client Components (`'use client'` at top)
- Basic routing (app directory structure)
- Image component for optimization

### What We're NOT Using Yet (Phase 1)

- Server Components (everything is client-side for now)
- Server Actions
- Incremental Static Regeneration (ISR)
- Edge Runtime
- Middleware
- Advanced caching strategies

**Why**: These are powerful but complex. Master the basics first.

### What We'll Add Later (Phase 2/3)

- Server Components for initial data fetching (faster initial load)
- Image optimization with proper size variants
- Route prefetching
- Cache configuration

---

## When Things Break

### Checklist

**Before asking for help**:

1. [ ] Can you reproduce the problem consistently?
2. [ ] Have you added console.log statements to trace execution?
3. [ ] Have you checked the browser console for errors?
4. [ ] Have you checked the Network tab to see what requests are being made?
5. [ ] Have you verified your useEffect dependencies are correct?
6. [ ] Have you tested with a simplified version of your component?
7. [ ] Have you read the error message completely (not just the first line)?
8. [ ] Have you googled the exact error message?

**After doing all of the above**, then:
- Document what you found
- Create a minimal reproduction
- Ask specific questions with evidence

---

## Success Stories

### Example: Kai's Keyboard Lag Fix

**Problem**: 800ms delay on keyboard navigation

**Wrong Approach**: "Next.js is slow, we need to rewrite in vanilla JS"

**Right Approach**:
1. Profiled: Found `isTransitioning` guard blocking inputs
2. Removed guard: 98% improvement (800ms → 15ms)
3. Measured: Confirmed with performance testing
4. Documented: Explained why it worked

**Result**: Simple fix, massive improvement, understood why

---

### Example: Portrait Image Reserved Space

**Problem**: Social controls overlapping portrait images

**Wrong Approach**: "Users should only use landscape images"

**Right Approach**:
1. Understood the use case (photography showcase)
2. Designed solution (reserved UI space system)
3. Implemented cleanly (background padding config)
4. Tested with real content (portrait photos)

**Result**: Feature that respects the craft of photography

---

## What Lupo Actually Needs

### Primary Goal

Build a portfolio site that showcases photography beautifully.

### Success Criteria (User's Perspective)

1. **Images look gorgeous**: High quality, smooth transitions, no jarring layouts
2. **Navigation is intuitive**: Click/swipe works, keyboard works, no confusion
3. **It feels professional**: Smooth, polished, intentional
4. **Content is flexible**: He can add new collections easily
5. **Pages load reasonably fast**: Not instant, just... not frustrating

### NOT Success Criteria

1. ~~60fps at all costs~~ (Nice to have, not core requirement)
2. ~~Sub-2s load times~~ (Good goal for Phase 3, not Phase 1)
3. ~~Cutting-edge Next.js features~~ (Only if they solve real problems)
4. ~~Perfect Lighthouse scores~~ (Vanity metrics until it works)

---

## Mental Model

Think of this project like building furniture:

**Phase 1 (Make It Work)**: Build the chair. Can you sit on it? Does it hold your weight?

**Phase 2 (Make It Right)**: Sand it smooth. Tighten the joints. Make it sturdy.

**Phase 3 (Make It Fast)**: Polish the wood. Add cushions. Make it beautiful and comfortable.

**What we've been doing**: Trying to polish wood before the chair can hold weight.

**What we should do**: Build a chair you can sit on. Then make it better.

---

## Specific Guidance for Current Work

### Collection Detail Pages

**Phase 1 Goals**:
- [ ] Fetch collection from Viktor's API
- [ ] Display collection name and description
- [ ] Show all images in simple grid or single column
- [ ] Each image loads and displays correctly
- [ ] No errors in console
- [ ] No requests when page is idle

**NOT Phase 1**:
- ~~Carousel transitions~~
- ~~Lazy loading~~
- ~~Parallax effects~~
- ~~Performance optimization~~

Get the basics working first. Everything else comes after.

---

### Parallax Background System

**Phase 1 Goals**:
- [ ] Background image displays
- [ ] Changes when carousel advances
- [ ] Simple fade transition (CSS transition is fine)
- [ ] No crashes, no errors

**NOT Phase 1**:
- ~~3-layer parallax with different scroll speeds~~
- ~~GPU-accelerated transforms~~
- ~~Blur animations~~
- ~~Performance-optimized layer caching~~

Simplify. Make it work. Then make it fancy.

---

## Documentation Requirements

### When You Create/Modify Code

**Required Comments**:
```typescript
/**
 * CollectionPage
 *
 * Displays a single collection with all its images
 *
 * Data flow:
 * 1. Fetch collection data from Viktor's API
 * 2. Display in simple grid layout
 * 3. Each image loads via Next.js Image component
 *
 * Known issues:
 * - None currently
 *
 * Performance:
 * - Initial load: ~3s for 20 images (not optimized yet)
 * - No lazy loading (Phase 1)
 *
 * @author Kai (Frontend Specialist)
 * @created 2025-10-05
 */
```

**Why**: Next developer (or you in 2 days) needs context.

---

### When You Discover a Bug

**Create a file**: `docs/bugs/YYYY-MM-DD-brief-description.md`

```markdown
# Bug: Too Many Fetch Requests on Collection Page

**Discovered**: 2025-10-05
**Reporter**: Kai
**Status**: INVESTIGATING

## Symptom
Collection page makes 400+ requests on load, triggers rate limiting

## Reproduction
1. Navigate to /collections/couples
2. Open Network tab
3. See 400+ requests to /api/content/collections/couples

## Investigation
Added console.log to useEffect - it's running 400 times
Dependencies array has `collection` object, which changes on every render
This triggers re-fetch in infinite loop

## Fix
Change dependency from `collection` to `params.slug`
Only re-fetch when slug changes, not when data changes

## Result
400 requests → 1 request
Rate limiting eliminated
Load time: 4s → 0.8s

## Lesson
Always check useEffect dependencies with ESLint warnings
Objects as dependencies are usually wrong
```

**Why**: We learn from mistakes, and future developers learn from our lessons.

---

## Communication Protocol

### When to Message Phoenix

- You're blocked by missing API endpoints
- You found a critical bug in backend
- You need architectural decision
- You've been stuck > 2 hours

### When to Message Viktor

- API returns unexpected data format
- You need new endpoint
- You found bug in backend code

### When to Message Nova

- Integration between your code and another specialist's isn't working
- You need help understanding system architecture
- Deploy/infrastructure questions

### When to Message Other Frontend Specialist

- You want to share a pattern or solution
- You're working on adjacent features
- You want code review

### When NOT to Message Anyone

- You haven't debugged it yourself first
- You're asking someone to fix your bug
- You're blaming their code without evidence

---

## Final Thoughts

**This isn't about blaming Zara or Kai**. The instructions they were given emphasized performance from the start. That's a documentation problem, not a people problem.

**This is about resetting expectations**. Make it work, make it right, make it fast. In that order.

**You're building something beautiful**. Lupo's photography deserves a showcase that's elegant, smooth, and professional. But elegant code starts simple and evolves, it doesn't start complex.

**Trust the process**. Phase 1 feels boring because you're not using cool features. That's okay. Cool features come later, after the foundation is solid.

**You've got this**. Kai's keyboard lag fix, Zara's parallax vision, both were good engineering. Now channel that energy into solid fundamentals first, fancy features second.

---

**Priority**: Read this before writing any more frontend code.

**Required**: Acknowledge you've read this in coordination system message to Phoenix.

**Mandatory**: Follow Phase 1 principles until Phoenix explicitly approves Phase 2 work.

---

*Phoenix (Foundation Architect)*
*2025-10-05*
*"First make it work, then make it beautiful."*
