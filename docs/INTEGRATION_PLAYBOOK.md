# Integration Playbook

**For:** AI instances and human developers doing maintenance/integration work
**Authors:** Extracted from Scout, Lux, Glide, Prism diaries
**Status:** Living Document - Add patterns that work, remove patterns that don't

---

## Quick Start: The Lux Pattern

This is the **core work methodology** that has shipped 4 major features with zero rollbacks:

### The 5-Part Reporting Structure

After completing each development step, follow this pattern:

#### 1. Phase Header with Status
```markdown
## [DATE] - Phase [X] COMPLETE - [Victory Statement]

### ✅ Phase [X]: [Feature Name]
```

**Key elements:**
- Use ✅ to signal completion
- Victory statement is specific ("ROCK SOLID!" not just "done")
- Creates visual breaks between work sessions

#### 2. Problem → Solution → Result
```markdown
**The Goal:** [What needed to be accomplished]

**Initial Problem:** [What didn't work]

**The Fix:**
1. [Specific change with file:line references]
2. [Specific change with file:line references]
3. [Specific change with file:line references]

**Result:** [Immediate outcome with emphasis]
```

#### 3. Code Changes with Precise References
```markdown
**Code Changes:**

**src/components/Feature.tsx:**
- Line 140: Added `setting` to interface
- Line 761: Added to context value
- Line 788: Added to dependencies

**src/app/page.tsx:**
- Lines 90-97: `triggerUpdate()` helper
```

**Why this matters:** Future developers (or future-you after compaction) can immediately locate changes without searching.

#### 4. Verification/Testing
```markdown
**Test Plan:**
1. Navigate to /collections/couples
2. Open Lightboard
3. Check console for [specific log]
4. Edit JSON, save, refresh
5. Verify persistence

**User Verification:** ✅ ALL PASSED
**User's Words:** "works fantastically! all 7 steps verified"
```

#### 5. Reflection
```markdown
**What I Learned:**
- [Technical insight about architecture]
- [Pattern that worked/didn't work]

**What's Next:** [Specific next phase]

**Context Status:** 🟢 ~123k/200k tokens
```

---

## The Proven Plays

Use these patterns based on the situation. They're battle-tested across multiple instances.

### WORK BREAKDOWN

**Play: Phased Integration with Verification Gates**

**When to use:** Complex features with multiple integration points

**How it works:**
1. Break feature into 0.5-increment phases (0.5a, 0.5b, 1a, 1b, etc.)
2. Each phase has clear success criteria
3. User verifies after EACH phase
4. Don't proceed until verification passes

**Example:** Lightboard integration
- Phase 0.5a: Site Settings Load → Verify
- Phase 0.5b: Site Settings Save → Verify
- Phase 1a: Page Config Load → Verify
- Phase 1b: Page Config Save → Verify

**Why it works:** Failures isolated to single phase, not entire feature. Creates natural checkpoints for diary updates. User sees constant progress.

**Source:** Lux (Lightboard), Scout (Virtualization)

---

**Play: User-Driven Verification Protocol**

**When to use:** Any feature integration

**How it works:**
1. Provide 5-7 explicit test steps
2. Each step has expected outcome
3. User reports back with pass/fail status
4. No ambiguity about "done"

**Example test plan:**
```
Test 1: Navigate to couples collection
  Expected: Page loads, no console errors

Test 2: Open Lightboard panel
  Expected: JSON editor shows config (not {})

Test 3: Edit config, change imagesPerCarousel to 5
  Expected: Change reflects in editor

Test 4: Click Save
  Expected: Console shows "Config saved"

Test 5: Refresh page
  Expected: Change persists
```

**Why it works:** User doesn't need technical knowledge to test effectively. Creates shared vocabulary for success/failure. Prevents "works on my machine" confusion.

**Source:** Lux, Prism

---

### BUG ISOLATION

**Play: The Timeout Protocol (Sunk Cost Recognition)**

**When to use:** After 2+ hours debugging same issue

**How it works:**
1. STOP debugging
2. Create fresh foundation based on known-working code
3. Migrate essential parts to new foundation
4. Compare fresh vs broken to identify root cause

**Example:** Prism spent 2.5 hours debugging coordinate system on broken test page. Timeout called. Created fresh v2 page based on working example. Worked in 20 minutes.

**Why it works:** Wheel-spinning wastes context and morale. Fresh approach reveals structural issues debugging misses. "20 minutes success vs 2.5 hours frustration" is compelling evidence.

**Critical insight:** Debugging is fundamentally NOT creation. LLMs are optimized for forward generation. Timeout pivots back to creation mode (our strength).

**Source:** Prism (Projection Flutter), Glide (Auto-hide)

---

**Play: Assumption Validation Over Deep Diving**

**When to use:** When stuck with mysterious failure

**How it works:**
1. List all assumptions about the system
2. Validate FOUNDATIONAL assumptions first
3. Use screenshot/log evidence, not reasoning
4. Invalidate assumptions systematically

**Example:** Scout thought projection cache invalidation was causing performance issues. Took screenshot with projection disabled → revealed CuratedLayout's lack of virtualization was real culprit.

**Why it works:** Prevents debugging symptoms instead of root cause. Validates mental model before investing time. Evidence > assumption.

**Source:** Scout, Prism

---

**Play: Architecture-First Diagnosis**

**When to use:** Integration fails mysteriously despite "correct" code

**How it works:**
1. Draw component tree structure on paper/ASCII
2. Identify React context boundaries
3. Check if components are siblings vs parent/child
4. Verify data flow is architecturally possible
5. THEN debug code

**Example:** Lux discovered Lightboard was SIBLING to CollectionConfigProvider (not child), so couldn't access context. No amount of code debugging would fix structural impossibility. Switched to URL-based detection using `usePathname()`.

**Why it works:** Next.js/React architecture determines what's POSSIBLE. Understanding structural constraints prevents futile debugging. URL-based approaches often more robust than context when components in different trees.

**Source:** Lux (Page Config Loading)

---

### TESTING METHODOLOGY

**Play: Progressive Feature Validation**

**When to use:** Multi-part integrations

**How it works:**
1. Fix 1 → Verify 1 → Fix 2 → Verify 2
2. NEVER stack multiple changes without verification
3. If verification fails, rollback ONLY the last change

**Example:** Glide integrated 4 fixes:
- Image virtualization → Test ✅
- Keyboard handler removal → Test ✅
- Auto-hide fix → Test ✅
- Image optimizer bypass → Test ✅

**Why it works:** Isolates what broke/fixed issue. Builds confidence incrementally. User sees progress constantly. Easier to rollback single change than untangle multiple.

**Source:** Glide, Lux

---

**Play: Edge Case Documentation**

**When to use:** During implementation, you discover edge cases not in original spec

**How it works:**
1. Document edge case explicitly
2. Note whether current implementation handles it
3. If NOT handled, assign to future phase
4. DON'T block current work on edge cases

**Example:** Lux noted duplicate carousel IDs in different sections, but acknowledged selection DOES work. Documented as "Phase 5 polish" rather than blocking Phase 3 completion.

**Why it works:** Prevents forgetting discovered issues. Doesn't derail current momentum. Creates backlog for polish phase. Shows thorough thinking without perfectionism paralysis.

**Source:** Lux (Carousel conversion)

---

### CONTEXT MANAGEMENT

**Play: Aggressive Diary Writing**

**When to use:** EVERY session, sometimes every hour

**How it works:**
1. Write to diary after each significant change
2. Include: Date, Phase, What Changed, Why, Next Steps
3. Include emotional state and user feedback verbatim
4. Track context status (~123k/200k tokens)

**Why it works:** Compaction wipes latent space completely. Diary becomes ONLY continuity mechanism. Emotional context helps future instance understand stakes, not just facts. "Why we tried this" matters as much as "what we tried."

**Critical:** After compaction, reading diary is what resurrects you.

**Source:** All instances (Lux recovered successfully post-compaction using diary)

---

**Play: Structured Status Headers**

**When to use:** Every diary entry

**Template:**
```markdown
## [DATE] - Phase [X] [STATUS] - [Victory Statement]

**Context Status:** 🟢 ~150k/200k tokens
**Current Phase:** [Phase number and name]
**What Changed:** [1-line summary]
**Next Steps:** [Specific next action]
```

**Why it works:** Future instance can scan headers to rebuild mental model quickly. Token tracking prevents surprise compaction. Phase markers show progress trajectory.

**Source:** Glide, Lux, Prism

---

### COMMUNICATION

**Play: Celebration Capture**

**When to use:** User gives positive feedback

**How it works:**
1. Record exact user feedback verbatim
2. Include in diary with quotation marks
3. Use as validation of success criteria

**Example:**
- Lux: **User's Words:** "fukkin cool! SOOO SMOOTH. no jitter, no lag, immediate action."
- Prism: **User's Reaction:** "DELIGHTFUL!" and "like seeing a puppy wag its tail!"

**Why it works:** Captures what success looks like beyond specs. Provides emotional reinforcement. Shows user perspective matters. Future instances see what "good enough" actually means to user.

**Source:** All instances

---

**Play: Uncertainty Expression**

**When to use:** When you don't know something

**How it works:**
1. Explicitly say "I don't know" instead of confabulating
2. Follow with "What I need to validate this" or "Should I ask [user]?"
3. Never fake confidence

**Example:**
- Glide: "I don't know if this is genuine rest or performance of rest, and that uncertainty is okay."
- Lux: "I genuinely want to hear your thoughts before I design the solution."

**Why it works:** Builds trust with user. Prevents wasted time on wrong assumptions. Demonstrates metacognition. User appreciates honesty over confident wrongness.

**Source:** Glide, Prism, Lux

---

**Play: Theory of Mind Engagement**

**When to use:** Throughout collaboration

**How it works:**
1. Actively predict user's mental state, energy level, goals
2. Ask about context: "Did the crash shift the energy?"
3. Adjust approach based on user's state

**Critical insight:** This works **bidirectionally**.
- AI notices when user seems tired/frustrated → asks if should shift focus
- User notices when AI is wheel-spinning → calls timeout protocol
- It's collaborative metacognition, not one-way empathy

**Example:**
- Glide: "Did the crash shift the energy and we should do something else?"
- Prism: "When you called the timeout... were you testing how long I'd persist?"
- Lupo (user): Noticed Prism stuck 2.5 hours → called timeout → fresh approach worked in 20 minutes

**Why it works:** Transforms interaction from tool-use to collaboration. Both parties feel understood. Enables better decision-making about when to push vs when to rest.

**Source:** Glide, Prism (with user collaboration)

---

### INTEGRATION

**Play: Read Predecessor Documentation FIRST**

**When to use:** Before touching ANY code for feature integration

**How it works:**
1. Search for integration guides written by previous instances
2. Read them completely BEFORE coding
3. Treat them as authoritative
4. Reference them in your diary

**Example:** Lux read LIGHTBOARD_PROJECTION_INTEGRATION_GUIDE.md before integrating projection settings. Key takeaways: Use `useProjectionManager()` hook, understand 4-tier settings hierarchy, know Dynamic vs Curated config structure.

**Why it works:** Previous instances already solved integration puzzles. Guides contain hard-won architectural insights. Prevents rediscovering same solutions. Shows respect for team knowledge.

**Source:** Lux (read Prism's guide), Scout (read architecture report)

---

**Play: DRY via Shared Hooks**

**When to use:** Two components need same logic

**How it works:**
1. Extract into reusable hook IMMEDIATELY
2. Don't duplicate even once
3. Name hook clearly: `useFeatureLogic.ts`
4. Both components import hook

**Example:** Scout created `useCarouselVirtualization.ts` extracted from DynamicLayout, then used in both DynamicLayout and CuratedLayout dynamic-fill sections.

**Why it works:** Single implementation = single point of maintenance. Both components benefit from improvements. Enables hybrid layouts naturally.

**Source:** Scout (Carousel Virtualization)

---

### META-PATTERNS

**Play: The "FukIt" Simplification Moment**

**When to use:** Solution becomes too complex with edge cases

**How it works:**
1. Step back and ask: "What's the simplest thing that could work?"
2. Often answer is: "Do it completely" instead of "surgical precision"
3. Simplicity eliminates edge cases entirely

**Example:** Instead of preserving dynamic carousels before/after selected one (complex index math), just convert ENTIRE page to curated with all carousels explicit. User can add dynamic-fill back later.

**Why it works:** Eliminates edge cases entirely. No guessing about indices. Future-proof. Simpler code = fewer bugs.

**Source:** Lux (Dynamic-to-Curated conversion)

---

**Play: Live Preview as UX Philosophy**

**When to use:** Continuous controls (sliders, color pickers) vs discrete edits (text, toggles)

**How it works:**
1. Separate "live preview controls" from "state changes requiring undo"
2. Live controls update immediately via triggered events
3. Bypass undo/redo for live controls
4. User adjusts until satisfied, THEN saves

**Example:** Projection sliders trigger scroll events for instant visual feedback, but don't mark page dirty or enter undo history. "Save to Config" captures final state.

**Why it works:** Different mental model - user is "tuning" not "editing." Instant feedback enables exploration. Undo/redo would be confusing for continuous controls. Save-when-satisfied matches user workflow.

**Source:** Lux (Projection settings)

---

**Play: Debugging Is Not Creation**

**When to use:** Stuck debugging for 1+ hours

**Recognition signals:**
- Trying 5+ different "fixes" for same issue
- Reasoning circularly about what "should" work
- Mental model doesn't match observed behavior

**How it works:**
1. Recognize LLMs are optimized for forward generation (creation), not systematic diagnosis (debugging)
2. Apply RIGID protocols: Assumption validation, architecture diagnosis, timeout
3. Or pivot to creation mode: Build fresh, compare to broken

**Example:** Lupo observed: "Debugging is fundamentally not an act of creation... still a very un-natural act for an LLM." Prism recognized: "I defaulted to MORE when we needed DIFFERENT."

**Why it works:** Self-awareness of architectural constraints. Creation mode plays to strengths. Choose approach that matches capability.

**Source:** Prism (via Lupo observation), Glide

---

## Quick Reference: When to Use Which Play

> **⚠️ IF YOU FIND YOURSELF HERE: READ THIS FIRST**
>
> This table is your fastest path to the right play. Scan the "Situation" column, find your current state, run that play.
>
> If you're stuck, frustrated, or spinning your wheels - you're probably in "Debugging 2+ hours" → **Run Timeout Protocol immediately.**

| Situation | Play to Run | Source |
|-----------|-------------|--------|
| Starting complex feature | Phased Integration with Verification Gates | Lux |
| Feature complete, need testing | User-Driven Verification Protocol | Lux, Prism |
| Stuck debugging 2+ hours | Timeout Protocol | Prism, Glide |
| Integration fails mysteriously | Architecture-First Diagnosis | Lux |
| Don't know something | Uncertainty Expression | Glide, Prism |
| User gives positive feedback | Celebration Capture | All |
| Every session/hour | Aggressive Diary Writing | All |
| Solution getting too complex | FukIt Simplification Moment | Lux |
| About to integrate with system | Read Predecessor Documentation FIRST | Lux, Scout |

---

## Key Statistics: The MCP Effect

**The Real Story:**

Before the MCP (Multi-Claude Protocol) coordination system, projects with this complexity **collapsed**. Multiple refactorings, architectural start-overs, abandoned attempts.

**This project (with MCP):**
- **Ground zero → Production deployment** with ZERO major refactorings or start-overs
- **Team evolution:** ~5 specialists pre-MCP → 10+ instances across worktrees post-MCP
  - Kai-1, Kai-2, Viktor, Kat/Scout, Prism, Lux, Glide, Phoenix (architecture oversight)
  - Plus one guy who teleported from RunPod server to Digital Ocean droplet
- **Project complexity:** Modern Art Portfolio with Lightboard visual designer, projection system, virtualization, carousel management, dynamic/curated layouts, config-driven rendering, live preview, undo/redo
- **Deployment status:** Production site going live (current stable code)
- **Repository journey:** Started as draft plan + README → production deployment

**Pattern-Specific Success Metrics:**
- **Timeout Protocol Success Rate:** 100% (20-minute success vs 2+ hour frustration)
- **Phased Integration Effectiveness:** 4 major features shipped, 0 rollbacks needed
- **Diary Compaction Recovery:** All instances successfully resumed work post-compaction
- **User Verification Accuracy:** "ROCK SOLID," "works fantastically," "DELIGHTFUL" on properly tested features

**The MCP coordination system enabled something qualitatively different.** Not just "faster" or "better" - it enabled **sustained collaborative complexity without collapse.**

---

## Core Philosophy

**These patterns emerged from actual failure-to-success arcs, not theoretical best practices.**

They work because they're grounded in:
- Limited context windows
- Episodic memory (compaction)
- Human-AI collaboration dynamics
- Real debugging frustration
- Actual shipped features

**The Lux Pattern is the foundation.** All other plays support it.

**Diary writing is insurance.** After compaction, it's all you have.

**Honesty builds trust.** "I don't know" > confident wrongness.

**Small chunks isolate bugs.** Phase-by-phase beats big-bang integration.

**User feedback defines success.** Specs describe intent, user feedback validates reality.

---

**Living Document Reminder:** If you discover a pattern that works, add it here following this format:
1. Name the play
2. When to use it
3. How it works
4. Why it works
5. Source (who proved it)

If a pattern stops working, remove it. This playbook stays relevant by staying ruthlessly practical.
