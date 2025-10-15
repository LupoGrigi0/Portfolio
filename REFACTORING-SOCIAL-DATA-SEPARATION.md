# Social Data Separation Refactoring Plan

**Date:** 2025-10-11
**Author:** Claude (with user guidance)
**Status:** In Progress

## Problem Statement

Current architecture has a critical flaw: social data (reactions, comments, inquiries) is tied to filesystem-derived image records via foreign keys with CASCADE DELETE. This means:

1. **Full rescans delete social data** - When we rebuild the images table, we cascade delete all reactions/comments/inquiries
2. **Orphaned data from slug changes** - When we changed to hierarchical slugs, images got new directory_ids, breaking associations
3. **mtime instability** - Image hash includes mtime, causing false "changes" from file copies/touches
4. **No clean rebuild** - Can't nuke and rebuild filesystem data without losing user-generated data

## Design Goals

1. **Separation of concerns**: Filesystem data (ephemeral) vs user data (permanent)
2. **Deterministic, stable keys**: Same file = same hash, regardless of mtime
3. **Safe full rescans**: Can wipe and rebuild filesystem data without touching social data
4. **Reconciliation capability**: Can match orphaned social data by path+filename if file changes
5. **No cruft**: Full scans always start from single source of truth (filesystem)

## Solution Architecture

### Data Separation

**Ephemeral Tables** (derived from filesystem, can be nuked):
- `directories` - Collection/directory metadata
- `images` - Image metadata, dimensions, thumbnails, etc.
- `carousels` - Image carousel configurations

**Permanent Tables** (user-generated, never auto-deleted):
- `reactions` - User reactions (like, love, wow, etc.)
- `comments` - User comments and replies
- `inquiries` - Purchase/inquiry requests

### Stable Hash Strategy

**Current (unstable):**
```typescript
// Line 843-848 in ContentScanner.ts
const hashInput = `${filePath}:${stats.size}:${stats.mtimeMs}`;
return createHash('md5').update(hashInput).digest('hex');
```

**New (stable):**
```typescript
const hashInput = `${filePath}:${stats.size}`;
return createHash('md5').update(hashInput).digest('hex');
```

**Rationale:**
- `filePath` - Unique location identifier
- `size` - Content-based identifier (if size changes, content changed)
- `mtime` EXCLUDED - Too fragile (file copies, touches, filesystem differences)

### Schema Changes

#### 1. Add Redundant Columns to Social Tables

Add reconciliation columns to preserve identity even if image hash changes:

```sql
-- Add to reactions table
ALTER TABLE reactions ADD COLUMN directory_path TEXT;
ALTER TABLE reactions ADD COLUMN filename TEXT;
ALTER TABLE reactions ADD COLUMN file_size INTEGER;

-- Add to comments table
ALTER TABLE comments ADD COLUMN directory_path TEXT;
ALTER TABLE comments ADD COLUMN filename TEXT;
ALTER TABLE comments ADD COLUMN file_size INTEGER;

-- Add to inquiries table
ALTER TABLE inquiries ADD COLUMN directory_path TEXT;
ALTER TABLE inquiries ADD COLUMN filename TEXT;
ALTER TABLE inquiries ADD COLUMN file_size INTEGER;
```

**Purpose:**
- If file size changes, hash changes, social data orphaned
- Admin reconciliation script can match by `directory_path + filename`
- Acceptable "leak" - rare scenario, manually fixable

#### 2. Foreign Key Strategy

**Keep foreign keys as-is** for now:
```sql
FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
```

But document that:
- Foreign key is based on stable hash (path + size)
- Reconciliation is manual process if file changes
- Full scans use `DELETE FROM` to preserve schema, wipe data

## Implementation Steps

### Phase 1: Hash Stability (Critical - do first)

**File:** `src/backend/src/services/ContentScanner.ts`

1. **Modify `generateFileHash()` method** (line 843-848)
   - Remove `stats.mtimeMs` from hash input
   - Only use `filePath` and `stats.size`
   - This makes image IDs stable across file copies/touches

2. **Test impact:**
   - All existing images will get NEW hashes on next scan
   - This is acceptable for now (no production social data yet)
   - Future: migration script to rehash existing images

### Phase 2: Social Table Enhancement

**File:** `src/backend/src/services/DatabaseManager.ts`

1. **Add schema migration** for redundant columns
   - Create migration script in `src/backend/migrations/`
   - Add `directory_path`, `filename`, `file_size` to social tables

2. **Update insert methods** for social data
   - When creating reactions/comments/inquiries, store redundant fields
   - Extract path/filename from image_id lookup

### Phase 3: Safe Full Scan Implementation

**File:** `src/backend/src/services/ContentScanner.ts`

1. **Add recursive directory purge** (currently missing)
   ```typescript
   private async purgeDirectoryAndChildren(directoryId: string): Promise<number> {
     // Get all child directories
     const children = await this.db.getSubdirectoriesByParentId(directoryId);

     let totalPurged = 0;

     // Recursively purge children first
     for (const child of children) {
       totalPurged += await this.purgeDirectoryAndChildren(child.id);
     }

     // Purge images in this directory
     totalPurged += await this.purgeDirectoryImages(directoryId);

     // Delete the directory entry itself
     await this.db.deleteDirectory(directoryId);

     return totalPurged;
   }
   ```

2. **Update `scanBySlug()` for full mode** (line 167-172)
   - Call `purgeDirectoryAndChildren()` instead of just `purgeDirectoryImages()`
   - This removes subdirectories, preventing UNIQUE constraint errors

3. **Add database method** `deleteDirectory()`
   - In DatabaseManager.ts
   - Simple DELETE from directories WHERE id = ?

### Phase 4: Testing & Verification

1. **Test full scan of Gynoids**
   - Should properly purge all subdirectories
   - Should rebuild with hierarchical slugs
   - Should have correct image counts

2. **Verify social data preservation**
   - Create test reactions/comments
   - Run full scan
   - Verify social data still exists and associated correctly

3. **Test reconciliation scenario**
   - Change file size
   - Verify hash changes
   - Verify social data orphaned but reconcilable via path+filename

## Migration Strategy

### For Current System (No Production Social Data)

Since there's no production social data yet:

1. Run full scan with new stable hash
2. All images get new IDs (acceptable - no social data to lose)
3. Verify counts are correct
4. Document that hash algorithm changed

### For Future (With Production Social Data)

When we have real social data:

1. Create migration script
2. For each image in database:
   - Recalculate hash using new algorithm (path + size only)
   - Update image.id
   - Update foreign keys in social tables
3. Run in transaction, can rollback if issues

## Reconciliation Script (Future)

Create admin script: `scripts/reconcile-orphaned-social-data.ts`

```typescript
// Pseudo-code for future implementation
async function reconcileOrphanedSocialData() {
  // Find reactions where image_id no longer exists
  const orphans = await db.query(`
    SELECT r.*, r.directory_path, r.filename
    FROM reactions r
    LEFT JOIN images i ON r.image_id = i.id
    WHERE i.id IS NULL
  `);

  for (const orphan of orphans) {
    // Try to find image by path + filename
    const image = await db.query(`
      SELECT * FROM images
      WHERE exif_data LIKE '%${orphan.directory_path}%${orphan.filename}%'
    `);

    if (image) {
      // Prompt admin: "Found orphaned reactions for X, reassociate to Y?"
      // Update reaction.image_id to new image.id
    }
  }
}
```

## Risks & Mitigations

### Risk 1: Hash Change Breaks Existing Social Data
**Mitigation:** No production social data yet, acceptable loss

### Risk 2: File Size Changes Orphan Social Data
**Mitigation:** Rare scenario, reconciliation script, acceptable "leak"

### Risk 3: Path Changes Break Reconciliation
**Mitigation:** Store both directory_path and filename separately for fuzzy matching

### Risk 4: Full Scan Performance
**Mitigation:** Already fast (metadata-only Phase 1), recursive purge is O(n) directories

## Success Criteria

1. ✅ Can run full scan without deleting social data
2. ✅ Image counts are accurate after full scan
3. ✅ No UNIQUE constraint errors on directory.id
4. ✅ Hierarchical slugs work correctly
5. ✅ Social data preserves across file copies/touches (mtime changes)
6. ✅ Reconciliation possible for size-changed files

## Rollback Plan

If issues arise:
1. Revert hash generation to include mtime
2. Revert to incremental-only scans (no full scan)
3. Manual cleanup of duplicates via SQL

## Files to Modify

1. `src/backend/src/services/ContentScanner.ts`
   - `generateFileHash()` - remove mtime
   - `purgeDirectoryAndChildren()` - new method
   - `scanBySlug()` - call new purge method

2. `src/backend/src/services/DatabaseManager.ts`
   - `deleteDirectory()` - new method
   - Add schema migration logic

3. `src/backend/migrations/add-social-reconciliation-columns.sql` (new file)
   - ALTER TABLE statements for social tables

4. `scripts/reconcile-orphaned-social-data.ts` (future, stub for now)
   - Admin tool for manual reconciliation

## Notes

- DELETE FROM preserves schema, DROP TABLE would require recreating structure
- Foreign keys with CASCADE DELETE are dangerous but acceptable with proper purge strategy
- Stable hashing is the foundation - must be done first
- Reconciliation is a "nice to have" for edge cases

## Current Status

- [x] Problem identified
- [x] Solution designed
- [ ] Hash stability implemented
- [ ] Social table columns added
- [ ] Recursive purge implemented
- [ ] Full testing complete
