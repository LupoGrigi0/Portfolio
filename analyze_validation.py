#!/usr/bin/env python3
"""
Analyze validation results to identify false positives
"""

import sys

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Reported as missing from DB (filesystem names)
fs_missing = [
    "Coffee",
    "DarkBeauty",
    "Flowers",
    "Dancing Gynoids",
    "Pirate Couple best",
    "RedDancers",
    "Watercolor",
    "Best",
    "Bugs",
    "Horses",
    "Seahorse",
    "Snakes",
    "wolves n foxes"
]

# Reported as orphaned in DB (database slug names)
db_orphaned = [
    "gynoids-bugs",
    "gynoids-bugs-best",
    "gynoids-horses",
    "gynoids-seahorse",
    "gynoids-seahorse-best",
    "gynoids-snakes",
    "gynoids-wolves-n-foxes",
    "couples-dancing-gynoids",
    "couples-pirate-couple-best",
    "couples-reddancers",
    "couples-watercolor",
    "cafe-coffee",
    "cafe-darkbeauty",
    "cafe-flowers"
]

print("=" * 80)
print("VALIDATION ANALYSIS: Checking for Slug Naming Pattern Mismatch")
print("=" * 80)

print("\nHypothesis: Database uses 'parent-child' slug format,")
print("           Filesystem uses simple directory names")
print("\nChecking if 'orphaned' DB entries match 'missing' filesystem entries...")

# Extract the child part from database slugs
db_child_parts = []
for slug in db_orphaned:
    # Split on the last hyphen to get the child part
    parts = slug.split('-')
    if len(parts) >= 2:
        # Try to match: 'cafe-darkbeauty' -> 'darkbeauty' -> 'DarkBeauty'
        child = '-'.join(parts[1:])  # Everything after first hyphen
        db_child_parts.append((slug, child))

print(f"\nExtracted {len(db_child_parts)} child names from database slugs:\n")
for db_slug, child in db_child_parts:
    print(f"  {db_slug:35} -> {child}")

print(f"\nFilesystem directory names ({len(fs_missing)}):\n")
for name in fs_missing:
    print(f"  {name}")

# Try to match them
print("\n" + "=" * 80)
print("MATCHING RESULTS:")
print("=" * 80)

matches = []
for db_slug, child in db_child_parts:
    # Try case-insensitive and space/hyphen flexible matching
    child_normalized = child.lower().replace('-', ' ')

    for fs_name in fs_missing:
        fs_normalized = fs_name.lower().replace('-', ' ')

        if child_normalized == fs_normalized:
            matches.append((fs_name, db_slug, "EXACT MATCH"))
        elif child_normalized.replace(' ', '') == fs_normalized.replace(' ', ''):
            matches.append((fs_name, db_slug, "MATCH (spacing differs)"))

print(f"\nFound {len(matches)} matches:\n")
for fs_name, db_slug, match_type in matches:
    print(f"  FS: {fs_name:25} <-> DB: {db_slug:35} [{match_type}]")

unmatched_fs = [name for name in fs_missing if not any(name in match[0] for match in matches)]
unmatched_db = [slug for slug in db_orphaned if not any(slug in match[1] for match in matches)]

if unmatched_fs:
    print(f"\nUnmatched filesystem entries ({len(unmatched_fs)}):")
    for name in unmatched_fs:
        print(f"  - {name}")

if unmatched_db:
    print(f"\nUnmatched database entries ({len(unmatched_db)}):")
    for slug in unmatched_db:
        print(f"  - {slug}")

print("\n" + "=" * 80)
print("CONCLUSION:")
print("=" * 80)
if len(matches) == len(fs_missing) == len(db_orphaned):
    print("✓ ALL 'orphaned' and 'missing' entries are actually the SAME directories!")
    print("  The validator found a slug naming convention mismatch.")
    print("  Database uses 'parent-child' slugs, filesystem uses simple names.")
    print("\n  This is NOT an error - it's how subcollections are designed to work.")
elif len(matches) > 0:
    print(f"⚠ PARTIAL MATCH: {len(matches)} pairs match, but there are unmatched entries.")
    print("  Some entries may be genuinely orphaned/missing.")
else:
    print("✗ NO MATCHES: These appear to be genuine orphaned/missing entries.")

print("\n" + "=" * 80)
