# Database Validation Tools

This directory contains tools for validating that the content filesystem is properly synchronized with the backend database.

## Quick Start

```bash
# Install dependencies
pip install requests

# Run validation
python validate_database_v2.py

# Save report
python validate_database_v2.py > validation_report.txt
```

## Files

### Main Tools

- **`validate_database_v2.py`** - ⭐ **USE THIS ONE** - Slug-aware validator with hierarchical support
- **`validate_config.json`** - Configuration file (API URL, content path)
- **`validate_database.py`** - Legacy validator (for reference only)

### Analysis & Documentation

- **`analyze_validation.py`** - Analyzes validation output to identify patterns
- **`VALIDATION_SUMMARY.md`** - Detailed findings and explanations
- **`VALIDATION_README.md`** - This file

### Generated Files

- `validation_report.txt` - Example output (git-ignored)
- `api_collections_raw.json` - API response snapshot (git-ignored)

## What It Does

The validator performs these checks:

1. ✓ **Missing DB Entries**: Directories on disk but not in database
2. ✓ **Orphaned DB Entries**: Database entries without matching directories
3. ✓ **Image Count Mismatches**: Discrepancies between filesystem and database
4. ✓ **Video Count Mismatches**: Video files not properly tracked
5. ✓ **Config Mismatches**: config.json synchronization issues
6. ✓ **Hierarchy Validation**: Parent-child relationships are correct

## Key Features

### Slug-Aware Matching

The validator understands your hierarchical slug pattern:

```
Filesystem          Database Slug        Match
-----------         ---------------      -----
Gynoids/Bugs/    →  gynoids-bugs        ✓
Cafe/Coffee/     →  cafe-coffee         ✓
couples/RedDancers/ → couples-reddancers ✓
```

This eliminates false positives from treating these as different collections.

## Configuration

Edit `validate_config.json` for your environment:

**Windows Development**:
```json
{
  "api_base_url": "http://localhost:4000/api",
  "content_root": "E:\\mnt\\lupoportfolio\\content"
}
```

**Linux Production**:
```json
{
  "api_base_url": "http://localhost:4000/api",
  "content_root": "/mnt/lupoportfolio/content"
}
```

## When to Run

- After adding new content directories
- After running the scanner
- Before deploying to production
- When debugging count discrepancies
- During migration to new server

## Understanding Output

### Example Output

```
✓ Scanning filesystem: E:\mnt\lupoportfolio\content
  Found 22 directories

✓ Scanning database via API: http://localhost:4000/api
  Found 22 directories

✓ Building slug-aware mappings...
  Matched 22 of 22 filesystem directories

SUMMARY:
  Filesystem directories: 22
  Database directories:   22
  Filesystem images:      5144
  Database images:        5303
  Filesystem videos:      14
  Database videos:        0

  Total issues found:     13
    ✗ Errors:   9       ← High priority - fix these
    ⚠ Warnings: 2       ← Medium priority
    ℹ Info:     2       ← Low priority - informational
```

### Issue Severity

- **✗ Errors**: Must be fixed (missing collections, large count mismatches)
- **⚠ Warnings**: Should be reviewed (minor discrepancies, video support)
- **ℹ Info**: Informational only (auto-generated configs)

## Common Fixes

### Missing DB Entry
```bash
# Scan the missing directory
curl -X POST http://localhost:4000/api/admin/scan \
  -H "Content-Type: application/json" \
  -d '{"directories": ["directory-name"]}'
```

### Count Mismatch
```bash
# Re-scan to update counts
curl -X POST http://localhost:4000/api/admin/scan \
  -H "Content-Type: application/json"
```

### Video Count Mismatch
This indicates video support isn't fully implemented yet. Videos are being detected but not properly counted in the database. This is a known issue being worked on.

## Platform Differences

### Windows
- Path length limit: 260 characters
- Path separators: `\` (auto-converted by Python)
- Unicode console support: Limited (handled by script)

### Linux (Production)
- No path length limit ✓
- Path separators: `/`
- Full Unicode support ✓
- Case-sensitive filesystem

**The validator handles these differences automatically.**

## Integration

### Pre-Deployment Check

```bash
#!/bin/bash
python validate_database_v2.py | grep -q "✗"
if [ $? -eq 0 ]; then
    echo "Validation failed!"
    exit 1
fi
echo "Validation passed ✓"
```

### CI/CD Pipeline

```yaml
# .github/workflows/validate.yml
- name: Validate Database
  run: |
    pip install requests
    python validate_database_v2.py > report.txt
    cat report.txt
```

## Debugging

### Focus on One Collection

```bash
# Check filesystem
ls "E:\mnt\lupoportfolio\content\posted" | wc -l

# Check database
curl http://localhost:4000/api/content/collections/posted | jq '.data.imageCount'
```

### Enable Verbose Output

Redirect both stdout and stderr:

```bash
python validate_database_v2.py 2>&1 | tee validation_debug.log
```

## Known Issues

1. **Double-counting in Gynoids subcollections**: Images appear to be counted in both parent and child. Under investigation.

2. **Video support incomplete**: Videos are detected on filesystem but database shows 0. Video support is in development.

3. **Windows path length**: Some files with very long names (300+ chars) can't be processed on Windows. Works fine on Linux.

## Full Documentation

See `/docs/VALIDATION_TOOL.md` for complete documentation including:
- Detailed troubleshooting guide
- API reference
- Migration procedures
- Best practices

## Questions?

1. Check the validation report details
2. Review `VALIDATION_SUMMARY.md` for findings
3. Consult `/docs/VALIDATION_TOOL.md` for full docs
4. Check backend logs in `src/backend/logs/`
