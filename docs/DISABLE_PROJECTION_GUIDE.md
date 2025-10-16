# How to Disable Midplane Projection

## Quick Disable (Temporary)

To disable the midplane projection system site-wide, add this to your site configuration file:

**Location:** `D:\Lupo\Source\Portfolio\content\site-config.json`

```json
{
  "siteName": "Your Site Name",
  "enableProjection": false,
  ...
}
```

This will:
- ✅ Disable ALL projections across the entire site
- ✅ Override any page-level projection settings
- ✅ Stop the 300ms projection intervals
- ✅ Eliminate idle CPU usage from projection system
- ✅ Allow you to see the site without projection effects

## Re-Enable

To re-enable projections (after Kat-Projection completes the refactor):

```json
{
  "enableProjection": true
}
```

Or simply remove the `enableProjection` field entirely (defaults to `true`).

## How It Works

### Implementation Details

1. **SiteConfig Flag** (`api-client.ts:361`)
   - Added `enableProjection?: boolean` to `SiteConfig` interface
   - Default: `true` (preserves existing behavior)

2. **Layout Integration** (`layout.tsx:54`)
   - Passes `globalEnabled` prop to `MidgroundProjectionProvider`
   - Reads from `siteConfig.enableProjection`

3. **Provider Enforcement** (`MidgroundProjection.tsx:404`)
   - Checks `globalEnabled` flag before registering projections
   - If false, no carousels will project to midground layer
   - Intervals never start, no scroll listeners attached

### Effect on Performance

**With Projection Disabled:**
- Idle CPU usage: 0% (no projection intervals running)
- Scroll performance: Improved (no projection calculations)
- Memory: Reduced (no projection Map, no position tracking)

**When to Disable:**
- During performance optimization work
- Testing page without projection effects
- Mobile devices (optional - can be device-specific)
- While Kat-Projection refactors the system

## Per-Page Override (Still Works)

Even with global `enableProjection: true`, individual pages can still disable projection:

**In collection config.json:**
```json
{
  "projection": {
    "enabled": false
  }
}
```

**Page-level priority:**
- If `siteConfig.enableProjection === false` → No projections anywhere (global override)
- If `siteConfig.enableProjection === true` → Page configs control their own projection

## Testing the Disable

1. Edit `content/site-config.json`
2. Add `"enableProjection": false`
3. Restart dev server (`npm run dev`)
4. Navigate to home page
5. Verify:
   - No projection layer visible
   - No idle CPU usage
   - Console shows no projection-related logs
   - Carousels work normally (just without midground effect)

## Notes for Development

- This is a **temporary** control for the refactor period
- Once Kat-Projection completes the redesign, this flag remains useful for:
  - Device-specific optimizations (disable on mobile)
  - A/B testing projection impact
  - Quick troubleshooting when debugging other issues

---

**Created by:** Kat (Performance Tactical Controller)
**Date:** October 16, 2025
**Related:** BRIEFING_KAT_PROJECTION.md
