# Database Validation Tool

## Overview

The database validation tool verifies that your content filesystem is properly synchronized with the backend database. It performs slug-aware matching, recognizing the hierarchical naming convention used for subcollections.

## Features

- **Cross-platform**: Works on Windows and Linux
- **Slug-aware**: Recognizes `parent-child` slug patterns (e.g., `Gynoids/Bugs` → `gynoids-bugs`)
- **Configuration file**: Environment-specific settings
- **Video detection**: Identifies video files and checks if they're properly counted
- **Hierarchical tracking**: Handles nested directory structures
- **Actionable reports**: Provides specific recommendations for fixing issues

## Quick Start

### Prerequisites

1. Backend server must be running
2. Python 3.7+ installed
3. Required Python packages: `requests`

### Installation

```bash
# Install dependencies
pip install requests

# From the backend-api directory
cd D:\Lupo\Source\Portfolio\worktrees\backend-api

# Run the validator
python validate_database_v2.py
```

## Configuration

Edit `validate_config.json` to match your environment:

### Windows Development
```json
{
  "api_base_url": "http://localhost:4000/api",
  "content_root": "E:\\mnt\\lupoportfolio\\content",
  "platform": "windows"
}
```

### Linux Production
```json
{
  "api_base_url": "http://localhost:4000/api",
  "content_root": "/mnt/lupoportfolio/content",
  "platform": "linux"
}
```

## Understanding the Report

### Summary Section

```
SUMMARY:
  Filesystem directories: 22      ← Directories found on disk
  Database directories:   22      ← Collections in database
  Filesystem images:      5144    ← Total images on disk
  Database images:        5303    ← Total images in DB
  Filesystem videos:      14      ← Video files found
  Database videos:        0       ← Videos tracked in DB
```

### Issue Categories

#### 1. Missing DB Entry (ERROR)
**What it means**: Directory exists on filesystem but not in database

**Example**:
```
✗ [new-collection] Directory exists on filesystem but not in database
    filesystem_path: E:\mnt\lupoportfolio\content\new-collection
    image_count: 50
    has_config: True
    note: Run scanner to import this directory
```

**How to fix**: Run the content scanner
```bash
curl -X POST http://localhost:4000/api/admin/scan \
  -H "Content-Type: application/json" \
  -d '{"directories": ["new-collection"]}'
```

#### 2. Orphaned DB Entry (ERROR)
**What it means**: Database has a collection that doesn't exist on filesystem

**Example**:
```
✗ [old-collection] Collection exists in database but not on filesystem
    parent: null
    note: This may indicate a deleted directory
```

**How to fix**:
- Restore the directory if it was accidentally deleted
- Or manually remove the database entry if intentionally deleted

#### 3. Count Mismatch (ERROR/WARNING)
**What it means**: Number of images/videos differs between filesystem and database

**Example**:
```
✗ [posted] Image count mismatch
    filesystem: 2440
    database: 2407
    difference: 33
    note: Re-run scanner to update counts
```

**How to fix**: Re-scan the collection
```bash
curl -X POST http://localhost:4000/api/admin/scan \
  -H "Content-Type: application/json" \
  -d '{"directories": ["posted"]}'
```

**Severity**:
- ERROR: Difference > 5 images
- WARNING: Difference ≤ 5 images (might be normal due to scanning)

#### 4. Video Count Mismatch (WARNING)
**What it means**: Video files exist but aren't being counted

**Example**:
```
⚠ [mixed-collection] Video count mismatch
    filesystem: 14
    database: 0
    difference: 14
    note: Video support may not be enabled
```

**How to fix**: Indicates video support needs to be implemented/enabled in the scanner

#### 5. Config Mismatch (INFO/WARNING)
**What it means**: config.json exists in one location but not the other

**Example**:
```
ℹ [gynoids] config.json exists in database but not on filesystem
    note: Database may have auto-generated config
```

**How to fix**:
- INFO severity: Usually fine, database can auto-generate configs
- WARNING severity: Sync the config.json file

## Slug-Aware Matching

The validator understands your hierarchical slug naming convention:

| Filesystem Path | Expected DB Slug | Matches |
|----------------|------------------|---------|
| `Gynoids/Bugs/` | `gynoids-bugs` | ✓ |
| `Cafe/Coffee/` | `cafe-coffee` | ✓ |
| `couples/RedDancers/` | `couples-reddancers` | ✓ |
| `Gynoids/Seahorse/Best/` | `gynoids-seahorse-best` | ✓ |

This eliminates false positives from the previous version of the validator.

## Common Issues

### Issue: "Content directory not found"

**Problem**:
```
✗ Error: Content directory not found: E:\mnt\lupoportfolio\content
```

**Solution**: Update `validate_config.json` with the correct path

### Issue: "Could not fetch data from API"

**Problem**:
```
✗ Error: Could not fetch data from API. Is the server running?
```

**Solution**:
1. Start the backend server: `npm start`
2. Verify it's running: `curl http://localhost:4000/api/health`
3. Check the API URL in `validate_config.json`

### Issue: Path too long (Windows)

**Problem**:
```
⚠ Path too long: some-very-long-directory-name
```

**Solution**: This is a Windows limitation (260 char path limit). Options:
1. Enable long path support in Windows
2. Move content closer to drive root
3. Deploy to Linux (no path length limit)

### Issue: Double-counting images

**Problem**: Database shows 2x the actual image count

**Cause**: Images may be counted in both parent and child collections

**Solution**: Check your scanner logic for proper parent/child image attribution

## Migration to Linux/Production

### Changes Needed

1. **Update config file**:
   ```json
   {
     "content_root": "/mnt/lupoportfolio/content",
     "api_base_url": "https://your-production-domain.com/api"
   }
   ```

2. **Path separators**: Automatically handled by Python's `Path` library

3. **File permissions**: Ensure read access to content directory
   ```bash
   chmod -R 755 /mnt/lupoportfolio/content
   ```

### Benefits on Linux

- No path length limitations
- Better Unicode filename support
- Case-sensitive filesystem (helps catch slug issues)
- Native UTF-8 console support

## Automated Checks

### Pre-Deployment Validation

Add to your deployment pipeline:

```bash
#!/bin/bash
# validate-before-deploy.sh

echo "Running database validation..."
python validate_database_v2.py > validation_report.txt

# Check for errors
if grep -q "✗" validation_report.txt; then
    echo "❌ Validation failed! Check validation_report.txt"
    exit 1
fi

echo "✅ Validation passed"
```

### Post-Migration Validation

After adding new collections:

```bash
# 1. Add new content directories
cp -r /new/content/* /mnt/lupoportfolio/content/

# 2. Scan new content
curl -X POST http://localhost:4000/api/admin/scan \
  -H "Content-Type: application/json"

# 3. Validate
python validate_database_v2.py

# 4. Review report for any issues
```

## File Reference

### Files in Backend API Directory

- `validate_database_v2.py` - Main slug-aware validator (USE THIS)
- `validate_database.py` - Original validator (legacy)
- `validate_config.json` - Configuration file
- `analyze_validation.py` - Analysis tool for debugging
- `VALIDATION_SUMMARY.md` - Detailed findings from validation

### Log Files

Validation reports are printed to stdout. To save:

```bash
python validate_database_v2.py > reports/validation_$(date +%Y%m%d).txt
```

## API Reference

The validator uses these backend endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/content/collections` | Fetch all top-level collections |
| `GET /api/content/collections/:slug` | Fetch specific collection details |

## Troubleshooting

### Enable Debug Mode

Add verbose output by modifying the script:

```python
# At the top of validate_database_v2.py
DEBUG = True  # Add this line

# Then use it throughout
if DEBUG:
    print(f"DEBUG: Processing {slug}")
```

### Compare Specific Collection

To focus on one collection:

```bash
# Check filesystem
ls -la "E:\mnt\lupoportfolio\content\posted" | wc -l

# Check database
curl http://localhost:4000/api/content/collections/posted | jq '.data.imageCount'
```

### Manual Database Query

If you need to inspect the database directly:

```bash
sqlite3 src/backend/data/portfolio.sqlite

# Check collections
SELECT slug, image_count, video_count FROM directories;

# Check images in a collection
SELECT COUNT(*) FROM images WHERE directory_id = 'DIRECTORY_ID_HERE';
```

## Best Practices

1. **Run regularly**: Validate after:
   - Adding new content directories
   - Running the scanner
   - Before production deployment
   - After filesystem changes

2. **Keep reports**: Save validation reports with timestamps for tracking

3. **Address errors first**: Focus on ERROR severity issues before warnings

4. **Review video counts**: Until video support is fully implemented, expect warnings

5. **Test on staging**: Validate in staging environment before production

## Support

For issues or questions:
- Check the validation report details section
- Review backend scanner logs in `src/backend/logs/`
- Consult `VALIDATION_SUMMARY.md` for known issues

## Version History

- **v2 (Current)**: Slug-aware matching, hierarchical support, cross-platform
- **v1**: Basic validation with case-insensitive matching
