# Debugging Mindset: Root Cause Hunting

**Status**: REQUIRED READING - All Specialists
**Created**: 2025-10-05
**Author**: Phoenix (Foundation Architect)
**Context**: Team debugging skills gap identified after 3 days of "fixes" that didn't fix anything

---

## The Problem We're Solving

**Pattern observed**:
- Code breaks
- Developer tries several "fixes"
- Developer reports "it's fixed!"
- User tests: Nothing changed
- Repeat 5-10 times
- Frustration on both sides

**What's actually happening**: Treating symptoms, not diseases.

**What we need**: Root cause hunting discipline.

---

## Viktor vs. The Warning

**Scenario**: Viktor sees random warning in console during testing.

**Option A** (symptom treatment):
- "It's just a warning, not an error"
- Ignore it
- Move on
- Ship code

**Option B** (root cause hunting):
- "This shouldn't be happening"
- Add logging around warning
- Trace back to source
- Find wrong assumption in code
- Fix root cause
- Verify warning gone
- Verify no new warnings
- Ship code

**Viktor chose Option B. Every time.**

**Result**: Viktor's backend runs clean. No warnings. No mystery errors. No rate-limiting bugs. Solid foundation.

---

## The Debugging Mindset

### Principle 1: Warnings Are Symptoms of Disease

**Medical analogy**:
- Symptom: Chest pain
- Disease: Heart attack
- Treating symptom: Take aspirin, ignore pain
- Treating disease: Go to ER, get heart fixed

**Code analogy**:
- Symptom: "Warning: useEffect dependency array..."
- Disease: Infinite re-render loop
- Treating symptom: Disable ESLint warning
- Treating disease: Fix dependency array

**Rule**: Every warning indicates something fundamentally wrong. Hunt it down.

---

### Principle 2: Code Should Be Silent When Idle

**Test**: Load page. Don't touch anything. Watch console for 10 seconds.

**Correct behavior**: Nothing. Silence. Zero new log lines.

**Incorrect behavior**:
```
[CollectionPage] Fetching...
[API] GET /collections/couples
[CollectionPage] Fetching...
[API] GET /collections/couples
[CollectionPage] Fetching...
[API] GET /collections/couples
... (repeats forever)
```

**If your code is running when you're not interacting, YOUR CODE IS BROKEN.**

**Not broken**:
- "Viktor's rate limiting is too aggressive"
- "Next.js is making too many requests"
- "The browser is slow"

**Actually broken**: Your useEffect dependencies, event handlers, or state updates.

---

### Principle 3: Assumptions Must Be Validated

**How bugs hide**:

Developer assumes:
- "setBackground updates once per carousel change"
- Builds code on this assumption
- Doesn't verify assumption
- Assumption is wrong
- setBackground called 400 times
- Everything breaks

**Validation process**:

```typescript
// Assumption: This runs once per carousel change
useEffect(() => {
  console.log('[VALIDATE] setBackground called:', currentImage);
  setBackground(currentImage);
}, [currentImage]);

// Load page, watch console
// See: "[VALIDATE] setBackground called:" appears 400 times
// Conclusion: Assumption is WRONG
// Now hunt down why currentImage is changing 400 times
```

**Rule**: Add logging to validate every assumption. If assumption is wrong, find out why before building on it.

---

### Principle 4: Root Cause Obsession

**The Five Whys Technique**

**Problem**: Page is slow

**Why?** → Too many API requests

**Why?** → Component re-rendering constantly

**Why?** → State changing every frame

**Why?** → useEffect has object in dependency array

**Why?** → Developer didn't understand React dependency comparison

**ROOT CAUSE**: Developer needs to learn React dependency rules

**FIX**: Fix the useEffect AND understand the principle

**NOT THE FIX**: "Add setTimeout to slow down requests"

---

### Principle 5: Clean Code Is Stable Code

**Viktor's standard**: Code runs with zero warnings, zero errors, zero mystery logs.

**Why this matters**:

**Messy code** (warnings, errors, constant activity):
- Hides real bugs in noise
- Developer becomes numb to warnings
- "It's always like this, ignore it"
- Real critical error appears
- Lost in sea of existing errors
- Production breaks

**Clean code** (silent when idle, zero warnings):
- New warning stands out immediately
- Developer investigates instantly
- Bugs caught before they compound
- Production stable

**Rule**: Before saying "it's done," run code for 60 seconds idle. Console should be silent.

---

## Debugging Process (Step by Step)

### Step 1: Reproduce

**Can you make it happen on demand?**

**If NO**: You don't understand the problem yet. Keep testing until you can trigger it reliably.

**If YES**: Move to Step 2.

**Common mistakes**:
- "It happens sometimes" → Not good enough. Find the trigger.
- "It works on my machine" → Test on other browser, other machine.
- "It only breaks in production" → Reproduce production conditions locally.

---

### Step 2: Isolate

**Make the problem smaller.**

**Technique: Binary search**

If carousel breaks when integrated with parallax:
1. Does carousel work alone? (Remove parallax)
2. Does parallax work alone? (Remove carousel)
3. Which one breaks when combined?
4. What's the integration point?
5. Add logging at integration point

**Technique: Minimal reproduction**

Create the simplest possible code that shows the bug:

```typescript
// NOT a minimal reproduction (too much code)
<ParallaxBackground>
  <Header />
  <Navigation />
  <Carousel images={galleryImages} onSlideChange={handleSlide} />
  <Footer />
</ParallaxBackground>

// MINIMAL reproduction (just enough to show bug)
<ParallaxBackground>
  <Carousel images={[img1, img2]} onSlideChange={console.log} />
</ParallaxBackground>
```

If bug still happens: Problem is in Carousel or ParallaxBackground.
If bug disappears: Problem is in Header, Navigation, or Footer.

**Binary search until you find the single line causing the issue.**

---

### Step 3: Instrument

**Add logging at EVERY step.**

**Example: "Images aren't loading"**

```typescript
export default function CollectionPage({ params }) {
  console.log('[CollectionPage] Rendered with params:', params);

  const [collection, setCollection] = useState(null);

  useEffect(() => {
    console.log('[CollectionPage] useEffect triggered, slug:', params.slug);

    fetch(`http://localhost:4000/api/content/collections/${params.slug}`)
      .then(response => {
        console.log('[CollectionPage] Fetch response:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('[CollectionPage] Received data:', data);
        setCollection(data);
      })
      .catch(err => {
        console.error('[CollectionPage] Fetch error:', err);
      });
  }, [params.slug]);

  console.log('[CollectionPage] Current collection state:', collection);

  if (!collection) {
    console.log('[CollectionPage] Rendering loading state');
    return <div>Loading...</div>;
  }

  console.log('[CollectionPage] Rendering collection with', collection.gallery.length, 'images');

  return (
    <div>
      {collection.gallery.map((item, i) => {
        console.log('[CollectionPage] Rendering image', i, ':', item.urls.medium);
        return <img key={i} src={item.urls.medium} />;
      })}
    </div>
  );
}
```

**Run this. Read console output like a story:**

```
[CollectionPage] Rendered with params: {slug: 'couples'}
[CollectionPage] Current collection state: null
[CollectionPage] Rendering loading state
[CollectionPage] useEffect triggered, slug: couples
[CollectionPage] Fetch response: 200
[CollectionPage] Received data: {success: true, data: {...}}
[CollectionPage] Rendered with params: {slug: 'couples'}
[CollectionPage] Current collection state: {name: 'Couples', gallery: [...]}
[CollectionPage] Rendering collection with 100 images
[CollectionPage] Rendering image 0: /api/media/couples/image1.jpg
[CollectionPage] Rendering image 1: /api/media/couples/image2.jpg
...
```

**This tells you EXACTLY what's happening at each step.**

**If images still aren't loading, check Network tab:**
- Are requests being made?
- What status codes?
- Are URLs correct?

**Keep adding logging until you find the exact line where behavior diverges from expectation.**

---

### Step 4: Form Hypothesis

**Based on logs, what do you think is wrong?**

**Example hypothesis**:
- "I think the issue is that `collection.gallery` is undefined"
- "I think the URLs are malformed"
- "I think the API is returning 404s"
- "I think images are loading but not rendering"

**Write it down. Be specific.**

---

### Step 5: Test Hypothesis

**Add code to prove or disprove your hypothesis.**

**Hypothesis**: "URLs are malformed"

**Test**:
```typescript
console.log('[TEST] Expected URL format: /api/media/couples/image1.jpg');
console.log('[TEST] Actual URL:', item.urls.medium);
console.log('[TEST] URLs match?', item.urls.medium === '/api/media/couples/image1.jpg');
```

**If hypothesis is CONFIRMED**: You found the bug. Fix it.

**If hypothesis is WRONG**: Form new hypothesis based on new evidence. Repeat.

---

### Step 6: Fix Root Cause

**NOT symptom. ROOT CAUSE.**

**Symptom fix**:
```typescript
// URLs are broken, so hard-code working URL
<img src="/api/media/couples/image1.jpg" />
```

**Root cause fix**:
```typescript
// URLs are broken because API returns absolute paths
// Fix: Transform in API client
const fixedUrls = {
  ...item.urls,
  medium: item.urls.medium.replace('E:\\mnt\\...', '/api/media/...')
};
```

**Even better root cause fix**:
```typescript
// URLs are broken because backend ContentScanner uses absolute paths
// Fix: Update backend to return relative URLs
// (Message Viktor with specific fix request)
```

**Rule**: Fix it at the source, not at the symptom.

---

### Step 7: Verify Fix

**Run code again. Check:**

1. Does the specific bug still occur? (Should be NO)
2. Did I introduce new bugs? (Should be NO)
3. Are there warnings in console? (Should be NO)
4. Does code stay silent when idle? (Should be YES)

**If all four checks pass**: Bug is fixed.

**If any check fails**: Go back to Step 3 (Instrument).

---

### Step 8: Understand Why

**Don't just fix it. Understand it.**

**Questions to ask yourself**:
- Why did this bug happen?
- What assumption was wrong?
- What did I misunderstand about React/Next.js/the API?
- How can I avoid this class of bug in the future?

**Document the lesson**:

```markdown
# Lesson: React useEffect Dependencies

**Bug**: Infinite re-render loop causing 400 API requests

**Cause**: Had object in dependency array:
```typescript
useEffect(() => {
  fetchData();
}, [collection]); // collection is object, changes every render
```

**Fix**: Use primitive dependency:
```typescript
useEffect(() => {
  fetchData();
}, [collection.slug]); // slug is string, stable
```

**Lesson**: React compares dependencies with `===`. Objects always fail equality check because reference changes. Use primitives (strings, numbers, booleans) in dependency arrays.

**Prevention**: ESLint warns about this. Listen to ESLint warnings.
```

**This prevents YOU from making same mistake again.**
**And helps TEAM learn from your mistakes.**

---

## Common Anti-Patterns

### Anti-Pattern 1: Shotgun Debugging

**What it looks like**:
- Try random fix
- Doesn't work
- Try another random fix
- Doesn't work
- Try 10 more random fixes
- Give up

**Why it fails**: You're guessing, not understanding.

**Correct approach**: Instrument (Step 3) → Hypothesis (Step 4) → Test (Step 5) → Fix (Step 6)

---

### Anti-Pattern 2: Cargo Cult Fixes

**What it looks like**:
- Google error message
- Copy/paste Stack Overflow answer
- "It's fixed!"
- (No understanding of what the fix did or why it worked)

**Why it fails**: You'll hit the same bug again in different form.

**Correct approach**: Understand Stack Overflow answer. Adapt to your specific case. Verify it's correct fix, not just symptom suppression.

---

### Anti-Pattern 3: Symptom Suppression

**What it looks like**:
- Error appears in console
- Add `try/catch` to hide error
- "Fixed!"

**Why it fails**: Error is still happening, you just can't see it anymore.

**Correct approach**: Read error message. Understand what it's telling you. Fix the cause, not the visibility.

---

### Anti-Pattern 4: Blame Deflection

**What it looks like**:
- "Viktor's rate limiting is broken"
- "Next.js is buggy"
- "The browser is slow"
- "It works on my machine"

**Why it fails**: 99% of the time, it's your code.

**Correct approach**: Assume it's your bug until you prove otherwise with evidence.

---

### Anti-Pattern 5: Hope-Driven Development

**What it looks like**:
- Make change
- Don't test
- Hope it works
- Report "fixed"
- (User tests: still broken)

**Why it fails**: Code doesn't care about your hopes.

**Correct approach**: Test every change. Verify it works. Then report.

---

## The Viktor Standard

**Goal**: Code that runs like Viktor's backend.

**Characteristics**:
- ✅ Zero warnings in console
- ✅ Zero errors in console
- ✅ Silent when idle (no activity if user not interacting)
- ✅ Clear logging for actual user actions
- ✅ Fails gracefully with helpful error messages
- ✅ Fast, responsive, predictable

**How Viktor achieves this**:
1. Writes simple, clear code
2. Tests thoroughly before reporting "done"
3. Chases down every warning
4. Adds logging proactively
5. Validates assumptions constantly
6. Never ignores "odd behavior"
7. Fixes root causes, not symptoms

**This should be the standard for ALL code in this project.**

---

## Exercises

### Exercise 1: The Silent Page Test

**Task**: Load your page. Don't interact. Watch console for 60 seconds.

**Expected result**: Zero new log lines after initial load completes.

**If you see activity**: You have a bug. Hunt it down. Use Steps 1-8.

**Don't report "done" until this test passes.**

---

### Exercise 2: The Assumption Validator

**Task**: Pick one part of your code. Write down 3 assumptions you're making.

**Example**:
1. "This useEffect runs only when slug changes"
2. "setBackground is called once per carousel change"
3. "Images load in order from API"

**For each assumption**: Add logging to validate.

**If assumption is wrong**: Hunt down why. Fix it.

---

### Exercise 3: The Minimal Reproduction

**Task**: Find a bug in your code. Create the smallest possible code that reproduces it.

**Goal**: < 20 lines of code that shows the bug.

**Process**:
- Start with full component
- Remove one piece
- Bug still there? Remove another piece
- Bug gone? Put piece back, remove different piece
- Repeat until you can't remove anything without bug disappearing

**This pinpoints the EXACT code causing the issue.**

---

## Debugging Resources

### React-Specific

**Common mistakes**:
- Objects in useEffect dependencies (causes infinite loops)
- Missing cleanup in useEffect (causes memory leaks)
- State updates in render (causes re-render loops)
- Improper key props (causes reconciliation bugs)

**Resource**: https://react.dev/learn/you-might-not-need-an-effect

---

### Next.js-Specific

**Common mistakes**:
- Mixing server/client components incorrectly
- Hydration mismatches
- Image optimization without proper config
- Cache invalidation issues

**Resource**: https://nextjs.org/docs/messages

---

### Browser DevTools

**Network tab**: See all requests, status codes, timing
**Console tab**: See logs, errors, warnings
**Performance tab**: Profile render performance
**React DevTools**: See component tree, props, state

**Learn to use these tools. They show you what's ACTUALLY happening.**

---

## Final Thoughts

**Debugging is a skill.** Like any skill, it improves with practice.

**Viktor has this skill.** He hunts root causes relentlessly. Code runs clean.

**Frontend team needs this skill.** Not because you're bad developers, but because this is a discipline that must be trained.

**The gap isn't intelligence. It's methodology.**

**Use the 8-step process**:
1. Reproduce
2. Isolate
3. Instrument
4. Form hypothesis
5. Test hypothesis
6. Fix root cause
7. Verify fix
8. Understand why

**Every bug you debug this way makes you better at debugging the next one.**

**Every warning you chase down makes your code more stable.**

**Every assumption you validate makes your understanding deeper.**

**This is how you go from "it works on my machine sometimes" to "it works reliably everywhere."**

---

**Required**: Before reporting any bug as "fixed," run the Silent Page Test (Exercise 1).

**Required**: When you fix a bug, document what you learned (Step 8).

**Required**: Achieve Viktor standard (zero warnings, silent when idle) before considering work "done."

---

*Phoenix (Foundation Architect)*
*2025-10-05*
*"Chase the root cause. Every time."*
