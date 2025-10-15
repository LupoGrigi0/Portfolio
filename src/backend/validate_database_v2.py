#!/usr/bin/env python3
"""
Database Validation Script v2 - Slug-Aware Edition
Validates filesystem content directory against backend database/API

Features:
- Cross-platform support (Windows/Linux)
- Configuration file support
- Slug-aware matching (recognizes parent-child slug patterns)
- Hierarchical directory tracking
- Video file detection
"""

import os
import sys
import json
import hashlib
import requests
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any, Optional
from dataclasses import dataclass, field
from collections import defaultdict

# Fix Windows console encoding issues
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Visual indicators
CHECK_MARK = "✓"
CROSS_MARK = "✗"
WARNING = "⚠"
INFO = "ℹ"


def load_config():
    """Load configuration from file or use defaults"""
    config_file = Path(__file__).parent / "validate_config.json"

    if config_file.exists():
        with open(config_file, 'r') as f:
            return json.load(f)

    # Default configuration
    return {
        "api_base_url": "http://localhost:4000/api",
        "content_root": "E:\\mnt\\lupoportfolio\\content" if sys.platform == 'win32' else "/mnt/lupoportfolio/content",
        "platform": sys.platform
    }


@dataclass
class FileSystemDirectory:
    """Represents a directory on the filesystem"""
    path: str
    slug: str
    parent_slug: str = None
    full_path_slugs: List[str] = field(default_factory=list)  # Full hierarchy path
    config: Dict[str, Any] = None
    hero_image: str = None
    image_files: List[str] = field(default_factory=list)
    video_files: List[str] = field(default_factory=list)
    subdirectories: List[str] = field(default_factory=list)

    @property
    def image_count(self) -> int:
        return len(self.image_files)

    @property
    def video_count(self) -> int:
        return len(self.video_files)

    @property
    def expected_db_slug(self) -> str:
        """Generate expected database slug based on hierarchy"""
        if not self.parent_slug:
            return self.slug.lower().replace(' ', '-')

        # Build hierarchical slug: parent-child format
        slug_parts = [s.lower().replace(' ', '-') for s in self.full_path_slugs]
        return '-'.join(slug_parts)


@dataclass
class DatabaseDirectory:
    """Represents a directory in the database/API"""
    slug: str
    parent_slug: str = None
    config: Dict[str, Any] = None
    hero_image: str = None
    image_count: int = 0
    video_count: int = 0
    subcollection_count: int = 0
    images: List[Dict[str, Any]] = field(default_factory=list)

    @property
    def child_slug(self) -> str:
        """Extract child slug from hierarchical slug"""
        if '-' not in self.slug:
            return self.slug

        # For 'gynoids-bugs', return 'bugs'
        # For 'gynoids-bugs-best', return 'bugs-best'
        parts = self.slug.split('-', 1)
        return parts[1] if len(parts) > 1 else self.slug


@dataclass
class ValidationIssue:
    """Represents a validation issue found"""
    category: str
    severity: str  # 'error', 'warning', 'info'
    slug: str
    message: str
    details: Dict[str, Any] = field(default_factory=dict)


class FilesystemScanner:
    """Scans the filesystem content directory"""

    IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif', '.bmp'}
    VIDEO_EXTENSIONS = {'.mp4', '.webm', '.mov', '.avi', '.mkv'}
    EXCLUDED_DIRS = {'.thumbnails', '.git', '__pycache__', 'node_modules'}

    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.directories: Dict[str, FileSystemDirectory] = {}

    def scan(self) -> Dict[str, FileSystemDirectory]:
        """Scan the entire content directory tree"""
        print(f"\n{CHECK_MARK} Scanning filesystem: {self.root_path}")

        # Scan all directories
        for item in self.root_path.iterdir():
            if item.is_dir() and item.name not in self.EXCLUDED_DIRS:
                self._scan_directory(item, parent_slug=None, path_slugs=[])

        print(f"  Found {len(self.directories)} directories")
        return self.directories

    def _scan_directory(self, dir_path: Path, parent_slug: str = None, path_slugs: List[str] = None):
        """Recursively scan a directory"""
        if path_slugs is None:
            path_slugs = []

        slug = dir_path.name
        current_path_slugs = path_slugs + [slug]

        # Handle Windows path length issues
        try:
            items = list(dir_path.iterdir())
        except OSError as e:
            if "cannot find the path" in str(e).lower() or len(str(dir_path)) > 240:
                print(f"  {WARNING} Path too long: {slug}")
                return
            raise

        # Create directory object
        fs_dir = FileSystemDirectory(
            path=str(dir_path),
            slug=slug,
            parent_slug=parent_slug,
            full_path_slugs=current_path_slugs
        )

        # Scan contents
        for item in items:
            if item.is_file():
                ext = item.suffix.lower()
                if ext in self.IMAGE_EXTENSIONS:
                    fs_dir.image_files.append(item.name)
                    # Check for hero image
                    if item.stem.lower() == 'hero':
                        fs_dir.hero_image = item.name
                elif ext in self.VIDEO_EXTENSIONS:
                    fs_dir.video_files.append(item.name)
                elif item.name == 'config.json':
                    try:
                        with open(item, 'r', encoding='utf-8') as f:
                            fs_dir.config = json.load(f)
                    except Exception as e:
                        print(f"  {WARNING} Failed to read config.json in {slug}: {e}")
            elif item.is_dir() and item.name not in self.EXCLUDED_DIRS:
                fs_dir.subdirectories.append(item.name)
                # Recursively scan subdirectory
                self._scan_directory(item, parent_slug=slug, path_slugs=current_path_slugs)

        # Store with expected DB slug as key for smart matching
        expected_slug = fs_dir.expected_db_slug
        self.directories[expected_slug] = fs_dir


class DatabaseScanner:
    """Queries the database via API"""

    def __init__(self, api_base_url: str):
        self.api_base_url = api_base_url
        self.directories: Dict[str, DatabaseDirectory] = {}

    def scan(self) -> Dict[str, DatabaseDirectory]:
        """Fetch all collections and subcollections from API"""
        print(f"\n{CHECK_MARK} Scanning database via API: {self.api_base_url}")

        # Get all collections
        try:
            response = requests.get(f"{self.api_base_url}/content/collections")
            response.raise_for_status()
            collections = response.json().get('data', {}).get('collections', [])

            print(f"  Found {len(collections)} top-level collections")

            # Process each collection
            for collection in collections:
                self._process_collection(collection)

            print(f"  Total directories (including subcollections): {len(self.directories)}")
            return self.directories

        except requests.exceptions.RequestException as e:
            print(f"{CROSS_MARK} Failed to connect to API: {e}")
            return {}

    def _process_collection(self, collection: Dict[str, Any], parent_slug: str = None):
        """Process a collection and its subcollections"""
        slug = collection.get('slug')

        if not slug:
            print(f"  {WARNING} Skipping collection with no slug")
            return

        db_dir = DatabaseDirectory(
            slug=slug,
            parent_slug=parent_slug,
            config=collection.get('config'),
            hero_image=collection.get('heroImage'),
            image_count=collection.get('imageCount', 0),
            video_count=collection.get('videoCount', 0),
            subcollection_count=len(collection.get('subcollections', []))
        )

        # Get detailed images for this collection
        try:
            response = requests.get(f"{self.api_base_url}/content/collections/{slug}")
            response.raise_for_status()
            data = response.json().get('data', {})

            # Handle both response formats
            if 'collection' in data:
                collection_data = data['collection']
                db_dir.images = collection_data.get('gallery', [])
            else:
                db_dir.images = data.get('images', [])
        except requests.exceptions.RequestException as e:
            print(f"  {WARNING} Failed to get images for {slug}: {e}")

        self.directories[slug] = db_dir

        # Process subcollections (they come as slug strings, need to fetch full data)
        subcollection_slugs = collection.get('subcollections', [])
        for sub_slug in subcollection_slugs:
            try:
                response = requests.get(f"{self.api_base_url}/content/collections/{sub_slug}")
                response.raise_for_status()
                sub_data = response.json().get('data', {})
                # Subcollections have data under 'collection' key
                if 'collection' in sub_data:
                    sub_data = sub_data['collection']
                self._process_collection(sub_data, parent_slug=slug)
            except requests.exceptions.RequestException as e:
                print(f"  {WARNING} Failed to get subcollection {sub_slug}: {e}")


class SlugAwareValidator:
    """Validates filesystem against database with slug-aware matching"""

    def __init__(self, fs_dirs: Dict[str, FileSystemDirectory], db_dirs: Dict[str, DatabaseDirectory]):
        self.fs_dirs = fs_dirs
        self.db_dirs = db_dirs
        self.issues: List[ValidationIssue] = []
        self.slug_matches: Dict[str, str] = {}  # fs_slug -> db_slug mapping

        # Build slug matching map
        self._build_slug_matches()

    def _build_slug_matches(self):
        """Build mapping between filesystem and database slugs"""
        print(f"\n{CHECK_MARK} Building slug-aware mappings...")

        # Try exact match first
        for fs_slug, fs_dir in self.fs_dirs.items():
            if fs_slug in self.db_dirs:
                self.slug_matches[fs_slug] = fs_slug
                continue

            # Try case-insensitive match
            for db_slug in self.db_dirs.keys():
                if fs_slug.lower() == db_slug.lower():
                    self.slug_matches[fs_slug] = db_slug
                    break

        matched_count = len(self.slug_matches)
        total_fs = len(self.fs_dirs)
        total_db = len(self.db_dirs)

        print(f"  Matched {matched_count} of {total_fs} filesystem directories")
        print(f"  Database has {total_db} entries")

    def validate(self) -> List[ValidationIssue]:
        """Run all validation checks"""
        print(f"\n{CHECK_MARK} Running validation checks...")

        self.check_orphaned_db_entries()
        self.check_missing_db_entries()
        self.check_count_mismatches()
        self.check_config_mismatches()
        self.check_hierarchy_validation()

        return self.issues

    def check_orphaned_db_entries(self):
        """Check for directories in DB but not on filesystem"""
        print(f"  {CHECK_MARK} Checking for orphaned DB entries...")

        matched_db_slugs = set(self.slug_matches.values())

        for db_slug, db_dir in self.db_dirs.items():
            if db_slug not in matched_db_slugs:
                self.issues.append(ValidationIssue(
                    category="Orphaned DB Entry",
                    severity="error",
                    slug=db_slug,
                    message=f"Collection exists in database but not on filesystem",
                    details={
                        "parent": db_dir.parent_slug,
                        "note": "This may indicate a deleted directory or slug mismatch"
                    }
                ))

    def check_missing_db_entries(self):
        """Check for directories on filesystem but not in DB"""
        print(f"  {CHECK_MARK} Checking for missing DB entries...")

        for fs_slug, fs_dir in self.fs_dirs.items():
            if fs_slug not in self.slug_matches:
                self.issues.append(ValidationIssue(
                    category="Missing DB Entry",
                    severity="error",
                    slug=fs_slug,
                    message=f"Directory exists on filesystem but not in database",
                    details={
                        "filesystem_path": fs_dir.path,
                        "parent": fs_dir.parent_slug,
                        "image_count": fs_dir.image_count,
                        "video_count": fs_dir.video_count,
                        "has_config": fs_dir.config is not None,
                        "note": "Run scanner to import this directory"
                    }
                ))

    def check_count_mismatches(self):
        """Check for image/video count mismatches"""
        print(f"  {CHECK_MARK} Checking for count mismatches...")

        for fs_slug, db_slug in self.slug_matches.items():
            fs_dir = self.fs_dirs[fs_slug]
            db_dir = self.db_dirs[db_slug]

            # Check image count
            if fs_dir.image_count != db_dir.image_count:
                severity = "error" if abs(fs_dir.image_count - db_dir.image_count) > 5 else "warning"
                self.issues.append(ValidationIssue(
                    category="Count Mismatch",
                    severity=severity,
                    slug=db_slug,
                    message=f"Image count mismatch",
                    details={
                        "filesystem": fs_dir.image_count,
                        "database": db_dir.image_count,
                        "difference": fs_dir.image_count - db_dir.image_count,
                        "note": "Re-run scanner to update counts" if abs(fs_dir.image_count - db_dir.image_count) > 0 else None
                    }
                ))

            # Check video count
            if fs_dir.video_count != db_dir.video_count:
                self.issues.append(ValidationIssue(
                    category="Count Mismatch",
                    severity="warning" if db_dir.video_count == 0 else "error",
                    slug=db_slug,
                    message=f"Video count mismatch",
                    details={
                        "filesystem": fs_dir.video_count,
                        "database": db_dir.video_count,
                        "difference": fs_dir.video_count - db_dir.video_count,
                        "note": "Video support may not be enabled" if db_dir.video_count == 0 and fs_dir.video_count > 0 else None
                    }
                ))

            # Check subcollection count (only if significantly different)
            fs_subdir_count = len([d for d in fs_dir.subdirectories if d not in FilesystemScanner.EXCLUDED_DIRS])
            if abs(fs_subdir_count - db_dir.subcollection_count) > 1:
                self.issues.append(ValidationIssue(
                    category="Count Mismatch",
                    severity="warning",
                    slug=db_slug,
                    message=f"Subcollection count mismatch",
                    details={
                        "filesystem": fs_subdir_count,
                        "database": db_dir.subcollection_count,
                        "difference": fs_subdir_count - db_dir.subcollection_count
                    }
                ))

    def check_config_mismatches(self):
        """Check for config.json mismatches"""
        print(f"  {CHECK_MARK} Checking for config mismatches...")

        for fs_slug, db_slug in self.slug_matches.items():
            fs_dir = self.fs_dirs[fs_slug]
            db_dir = self.db_dirs[db_slug]

            fs_has_config = fs_dir.config is not None
            db_has_config = db_dir.config is not None

            if fs_has_config and not db_has_config:
                self.issues.append(ValidationIssue(
                    category="Config Mismatch",
                    severity="warning",
                    slug=db_slug,
                    message="config.json exists on filesystem but not in database"
                ))
            elif not fs_has_config and db_has_config:
                self.issues.append(ValidationIssue(
                    category="Config Mismatch",
                    severity="info",
                    slug=db_slug,
                    message="config.json exists in database but not on filesystem",
                    details={"note": "Database may have auto-generated config"}
                ))

    def check_hierarchy_validation(self):
        """Check parent-child relationships match filesystem"""
        print(f"  {CHECK_MARK} Checking hierarchy validation...")

        for fs_slug, db_slug in self.slug_matches.items():
            fs_dir = self.fs_dirs[fs_slug]
            db_dir = self.db_dirs[db_slug]

            # Normalize parent slugs for comparison
            fs_parent = fs_dir.parent_slug.lower() if fs_dir.parent_slug else None
            db_parent = db_dir.parent_slug.lower() if db_dir.parent_slug else None

            # For subcollections, DB parent should match FS parent's expected slug
            if fs_parent and fs_parent in self.fs_dirs:
                expected_parent_slug = self.fs_dirs[fs_parent].expected_db_slug
                if db_parent and db_parent != expected_parent_slug:
                    self.issues.append(ValidationIssue(
                        category="Hierarchy Mismatch",
                        severity="error",
                        slug=db_slug,
                        message="Parent directory mismatch",
                        details={
                            "filesystem_parent": fs_parent,
                            "database_parent": db_parent,
                            "expected_parent": expected_parent_slug
                        }
                    ))


class EnhancedReportGenerator:
    """Generates human-readable validation report with additional insights"""

    def __init__(self, fs_dirs: Dict[str, FileSystemDirectory],
                 db_dirs: Dict[str, DatabaseDirectory],
                 issues: List[ValidationIssue]):
        self.fs_dirs = fs_dirs
        self.db_dirs = db_dirs
        self.issues = issues

    def generate(self):
        """Generate and print the validation report"""
        print("\n" + "=" * 80)
        print("DATABASE VALIDATION REPORT (Slug-Aware)")
        print("=" * 80)

        # Summary statistics
        self._print_summary()

        # Issues by category
        if self.issues:
            self._print_issues()
            self._print_recommendations()
        else:
            print(f"\n{CHECK_MARK} No issues found! Database is in perfect sync with filesystem.")

        print("\n" + "=" * 80)

    def _print_summary(self):
        """Print summary statistics"""
        print("\nSUMMARY:")
        print(f"  Filesystem directories: {len(self.fs_dirs)}")
        print(f"  Database directories:   {len(self.db_dirs)}")

        total_fs_images = sum(d.image_count for d in self.fs_dirs.values())
        total_db_images = sum(d.image_count for d in self.db_dirs.values())
        total_fs_videos = sum(d.video_count for d in self.fs_dirs.values())
        total_db_videos = sum(d.video_count for d in self.db_dirs.values())

        print(f"  Filesystem images:      {total_fs_images}")
        print(f"  Database images:        {total_db_images}")
        print(f"  Filesystem videos:      {total_fs_videos}")
        print(f"  Database videos:        {total_db_videos}")

        # Count issues by severity
        errors = sum(1 for i in self.issues if i.severity == 'error')
        warnings = sum(1 for i in self.issues if i.severity == 'warning')
        infos = sum(1 for i in self.issues if i.severity == 'info')

        print(f"\n  Total issues found:     {len(self.issues)}")
        if errors > 0:
            print(f"    {CROSS_MARK} Errors:   {errors}")
        if warnings > 0:
            print(f"    {WARNING} Warnings: {warnings}")
        if infos > 0:
            print(f"    {INFO} Info:     {infos}")

    def _print_issues(self):
        """Print all issues grouped by category"""
        by_category: Dict[str, List[ValidationIssue]] = defaultdict(list)
        for issue in self.issues:
            by_category[issue.category].append(issue)

        print("\nISSUES FOUND:")

        for category, category_issues in sorted(by_category.items()):
            print(f"\n{category} ({len(category_issues)}):")

            for issue in category_issues:
                if issue.severity == 'error':
                    icon = CROSS_MARK
                elif issue.severity == 'warning':
                    icon = WARNING
                else:
                    icon = INFO

                print(f"  {icon} [{issue.slug}] {issue.message}")

                if issue.details:
                    for key, value in issue.details.items():
                        if value is not None:
                            print(f"      {key}: {value}")

    def _print_recommendations(self):
        """Print actionable recommendations"""
        print("\n" + "-" * 80)
        print("RECOMMENDATIONS:")
        print("-" * 80)

        errors = [i for i in self.issues if i.severity == 'error']

        if errors:
            missing_db = [i for i in errors if i.category == 'Missing DB Entry']
            count_mismatches = [i for i in errors if i.category == 'Count Mismatch']
            orphaned = [i for i in errors if i.category == 'Orphaned DB Entry']

            if missing_db:
                print(f"\n{INFO} {len(missing_db)} directories need to be scanned:")
                print("   Run: npm run scan:all  OR  scan specific collections")

            if count_mismatches:
                print(f"\n{INFO} {len(count_mismatches)} collections have count discrepancies:")
                print("   Re-run scanner to update image/video counts")

            if orphaned:
                print(f"\n{INFO} {len(orphaned)} database entries may be stale:")
                print("   Review and manually remove if directories were deleted")


def main():
    """Main validation routine"""
    print("=" * 80)
    print("DATABASE VALIDATION TOOL v2 (Slug-Aware)")
    print("=" * 80)

    # Load configuration
    config = load_config()
    content_root = config['content_root']
    api_base_url = config['api_base_url']

    print(f"Content root: {content_root}")
    print(f"API endpoint: {api_base_url}")
    print(f"Platform: {config.get('platform', sys.platform)}")

    # Check if content directory exists
    if not os.path.exists(content_root):
        print(f"\n{CROSS_MARK} Error: Content directory not found: {content_root}")
        print(f"{INFO} Update validate_config.json with correct path")
        return

    # Scan filesystem
    fs_scanner = FilesystemScanner(content_root)
    fs_dirs = fs_scanner.scan()

    # Scan database
    db_scanner = DatabaseScanner(api_base_url)
    db_dirs = db_scanner.scan()

    if not db_dirs:
        print(f"\n{CROSS_MARK} Error: Could not fetch data from API. Is the server running?")
        return

    # Validate with slug-aware matching
    validator = SlugAwareValidator(fs_dirs, db_dirs)
    issues = validator.validate()

    # Generate report
    report = EnhancedReportGenerator(fs_dirs, db_dirs, issues)
    report.generate()


if __name__ == "__main__":
    main()
