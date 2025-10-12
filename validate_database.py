#!/usr/bin/env python3
"""
Database Validation Script
Validates filesystem content directory against backend database/API
"""

import os
import sys
import json
import hashlib
import requests
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any
from dataclasses import dataclass, field
from collections import defaultdict

# Fix Windows console encoding issues
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Configuration
API_BASE_URL = "http://localhost:4000/api"
CONTENT_ROOT = r"E:\mnt\lupoportfolio\content"

# Visual indicators
CHECK_MARK = "✓"
CROSS_MARK = "✗"
WARNING = "⚠"


@dataclass
class FileSystemDirectory:
    """Represents a directory on the filesystem"""
    path: str
    slug: str
    parent_slug: str = None
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

    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.directories: Dict[str, FileSystemDirectory] = {}

    def scan(self) -> Dict[str, FileSystemDirectory]:
        """Scan the entire content directory tree"""
        print(f"\n{CHECK_MARK} Scanning filesystem: {self.root_path}")

        # Scan all directories
        for item in self.root_path.iterdir():
            if item.is_dir():
                self._scan_directory(item, parent_slug=None)

        print(f"  Found {len(self.directories)} directories")
        return self.directories

    def _scan_directory(self, dir_path: Path, parent_slug: str = None):
        """Recursively scan a directory"""
        slug = dir_path.name

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
            parent_slug=parent_slug
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
            elif item.is_dir():
                fs_dir.subdirectories.append(item.name)
                # Recursively scan subdirectory
                self._scan_directory(item, parent_slug=slug)

        self.directories[slug] = fs_dir


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

            print(f"  Found {len(collections)} collections")

            # Process each collection
            for collection in collections:
                self._process_collection(collection)

            return self.directories

        except requests.exceptions.RequestException as e:
            print(f"{CROSS_MARK} Failed to connect to API: {e}")
            return {}

    def _process_collection(self, collection: Dict[str, Any], parent_slug: str = None):
        """Process a collection and its subcollections"""
        slug = collection.get('slug')

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
                # Subcollections have data under 'collection' key, not at root of 'data'
                if 'collection' in sub_data:
                    sub_data = sub_data['collection']
                self._process_collection(sub_data, parent_slug=slug)
            except requests.exceptions.RequestException as e:
                print(f"  {WARNING} Failed to get subcollection {sub_slug}: {e}")


class DatabaseValidator:
    """Validates filesystem against database"""

    def __init__(self, fs_dirs: Dict[str, FileSystemDirectory], db_dirs: Dict[str, DatabaseDirectory]):
        self.fs_dirs = fs_dirs
        self.db_dirs = db_dirs
        self.issues: List[ValidationIssue] = []

        # Create case-insensitive slug mappings
        self.fs_slug_map = {slug.lower(): slug for slug in fs_dirs.keys()}
        self.db_slug_map = {slug.lower(): slug for slug in db_dirs.keys() if slug}

    def validate(self) -> List[ValidationIssue]:
        """Run all validation checks"""
        print(f"\n{CHECK_MARK} Running validation checks...")

        self.check_orphaned_db_entries()
        self.check_missing_db_entries()
        self.check_count_mismatches()
        self.check_config_mismatches()
        self.check_hierarchy_validation()
        self.check_slug_uniqueness()

        return self.issues

    def check_orphaned_db_entries(self):
        """Check for directories/images in DB but not on filesystem"""
        print(f"  {CHECK_MARK} Checking for orphaned DB entries...")

        for slug, db_dir in self.db_dirs.items():
            if not slug:  # Skip None slugs
                continue
            if slug.lower() not in self.fs_slug_map:
                self.issues.append(ValidationIssue(
                    category="Orphaned DB Entry",
                    severity="error",
                    slug=slug,
                    message=f"Directory exists in database but not on filesystem",
                    details={"parent": db_dir.parent_slug}
                ))

    def check_missing_db_entries(self):
        """Check for directories on filesystem but not in DB"""
        print(f"  {CHECK_MARK} Checking for missing DB entries...")

        for slug, fs_dir in self.fs_dirs.items():
            if slug.lower() not in self.db_slug_map:
                # Special case: .thumbnails directory is expected to not be in DB
                if slug == '.thumbnails':
                    continue
                self.issues.append(ValidationIssue(
                    category="Missing DB Entry",
                    severity="error",
                    slug=slug,
                    message=f"Directory exists on filesystem but not in database",
                    details={
                        "parent": fs_dir.parent_slug,
                        "image_count": fs_dir.image_count,
                        "has_config": fs_dir.config is not None
                    }
                ))

    def check_count_mismatches(self):
        """Check for image/video count mismatches"""
        print(f"  {CHECK_MARK} Checking for count mismatches...")

        # Match directories case-insensitively
        for fs_slug, fs_dir in self.fs_dirs.items():
            if fs_slug.lower() not in self.db_slug_map:
                continue
            db_slug = self.db_slug_map[fs_slug.lower()]
            db_dir = self.db_dirs[db_slug]

            # Check image count
            if fs_dir.image_count != db_dir.image_count:
                self.issues.append(ValidationIssue(
                    category="Count Mismatch",
                    severity="error",
                    slug=f"{fs_slug} (DB: {db_slug})",
                    message=f"Image count mismatch",
                    details={
                        "filesystem": fs_dir.image_count,
                        "database": db_dir.image_count,
                        "difference": fs_dir.image_count - db_dir.image_count
                    }
                ))

            # Check video count
            if fs_dir.video_count != db_dir.video_count:
                self.issues.append(ValidationIssue(
                    category="Count Mismatch",
                    severity="error",
                    slug=f"{fs_slug} (DB: {db_slug})",
                    message=f"Video count mismatch",
                    details={
                        "filesystem": fs_dir.video_count,
                        "database": db_dir.video_count,
                        "difference": fs_dir.video_count - db_dir.video_count
                    }
                ))

            # Check subcollection count
            if len(fs_dir.subdirectories) != db_dir.subcollection_count:
                self.issues.append(ValidationIssue(
                    category="Count Mismatch",
                    severity="error",
                    slug=f"{fs_slug} (DB: {db_slug})",
                    message=f"Subcollection count mismatch",
                    details={
                        "filesystem": len(fs_dir.subdirectories),
                        "database": db_dir.subcollection_count,
                        "difference": len(fs_dir.subdirectories) - db_dir.subcollection_count
                    }
                ))

    def check_config_mismatches(self):
        """Check for config.json mismatches"""
        print(f"  {CHECK_MARK} Checking for config mismatches...")

        # Match directories case-insensitively
        for fs_slug, fs_dir in self.fs_dirs.items():
            if fs_slug.lower() not in self.db_slug_map:
                continue
            db_slug = self.db_slug_map[fs_slug.lower()]
            db_dir = self.db_dirs[db_slug]

            # Check if config exists in both or neither
            fs_has_config = fs_dir.config is not None
            db_has_config = db_dir.config is not None

            if fs_has_config and not db_has_config:
                self.issues.append(ValidationIssue(
                    category="Config Mismatch",
                    severity="warning",
                    slug=f"{fs_slug} (DB: {db_slug})",
                    message="config.json exists on filesystem but not in database"
                ))
            elif not fs_has_config and db_has_config:
                self.issues.append(ValidationIssue(
                    category="Config Mismatch",
                    severity="warning",
                    slug=f"{fs_slug} (DB: {db_slug})",
                    message="config.json exists in database but not on filesystem"
                ))
            elif fs_has_config and db_has_config:
                # Compare config contents (basic comparison)
                if fs_dir.config != db_dir.config:
                    self.issues.append(ValidationIssue(
                        category="Config Mismatch",
                        severity="warning",
                        slug=f"{fs_slug} (DB: {db_slug})",
                        message="config.json content differs between filesystem and database",
                        details={
                            "fs_keys": list(fs_dir.config.keys()) if isinstance(fs_dir.config, dict) else None,
                            "db_keys": list(db_dir.config.keys()) if isinstance(db_dir.config, dict) else None
                        }
                    ))

    def check_hierarchy_validation(self):
        """Check parent-child relationships match filesystem"""
        print(f"  {CHECK_MARK} Checking hierarchy validation...")

        # Match directories case-insensitively
        for fs_slug, fs_dir in self.fs_dirs.items():
            if fs_slug.lower() not in self.db_slug_map:
                continue
            db_slug = self.db_slug_map[fs_slug.lower()]
            db_dir = self.db_dirs[db_slug]

            # Compare parents case-insensitively
            fs_parent = fs_dir.parent_slug.lower() if fs_dir.parent_slug else None
            db_parent = db_dir.parent_slug.lower() if db_dir.parent_slug else None

            if fs_parent != db_parent:
                self.issues.append(ValidationIssue(
                    category="Hierarchy Mismatch",
                    severity="error",
                    slug=f"{fs_slug} (DB: {db_slug})",
                    message="Parent directory mismatch",
                    details={
                        "filesystem_parent": fs_dir.parent_slug,
                        "database_parent": db_dir.parent_slug
                    }
                ))

    def check_slug_uniqueness(self):
        """Check for duplicate slugs (should not happen)"""
        print(f"  {CHECK_MARK} Checking slug uniqueness...")

        # Count slug occurrences in filesystem
        slug_counts: Dict[str, int] = defaultdict(int)
        for slug in self.fs_dirs.keys():
            slug_counts[slug] += 1

        for slug, count in slug_counts.items():
            if count > 1:
                self.issues.append(ValidationIssue(
                    category="Duplicate Slug",
                    severity="error",
                    slug=slug,
                    message=f"Slug appears {count} times in filesystem"
                ))


class ReportGenerator:
    """Generates human-readable validation report"""

    def __init__(self, fs_dirs: Dict[str, FileSystemDirectory],
                 db_dirs: Dict[str, DatabaseDirectory],
                 issues: List[ValidationIssue]):
        self.fs_dirs = fs_dirs
        self.db_dirs = db_dirs
        self.issues = issues

    def generate(self):
        """Generate and print the validation report"""
        print("\n" + "=" * 80)
        print("DATABASE VALIDATION REPORT")
        print("=" * 80)

        # Summary statistics
        self._print_summary()

        # Issues by category
        if self.issues:
            self._print_issues()
        else:
            print(f"\n{CHECK_MARK} No issues found! Database is in sync with filesystem.")

        print("\n" + "=" * 80)

    def _print_summary(self):
        """Print summary statistics"""
        print("\nSUMMARY:")
        print(f"  Filesystem directories: {len(self.fs_dirs)}")
        print(f"  Database directories:   {len(self.db_dirs)}")

        total_fs_images = sum(d.image_count for d in self.fs_dirs.values())
        total_db_images = sum(d.image_count for d in self.db_dirs.values())
        print(f"  Filesystem images:      {total_fs_images}")
        print(f"  Database images:        {total_db_images}")

        # Count issues by severity
        errors = sum(1 for i in self.issues if i.severity == 'error')
        warnings = sum(1 for i in self.issues if i.severity == 'warning')

        print(f"\n  Total issues found:     {len(self.issues)}")
        if errors > 0:
            print(f"    {CROSS_MARK} Errors:   {errors}")
        if warnings > 0:
            print(f"    {WARNING} Warnings: {warnings}")

    def _print_issues(self):
        """Print all issues grouped by category"""
        # Group issues by category
        by_category: Dict[str, List[ValidationIssue]] = defaultdict(list)
        for issue in self.issues:
            by_category[issue.category].append(issue)

        print("\nISSUES FOUND:")

        for category, category_issues in sorted(by_category.items()):
            print(f"\n{category} ({len(category_issues)}):")

            for issue in category_issues:
                icon = CROSS_MARK if issue.severity == 'error' else WARNING
                print(f"  {icon} [{issue.slug}] {issue.message}")

                if issue.details:
                    for key, value in issue.details.items():
                        print(f"      {key}: {value}")


def main():
    """Main validation routine"""
    print("=" * 80)
    print("DATABASE VALIDATION TOOL")
    print("=" * 80)
    print(f"Content root: {CONTENT_ROOT}")
    print(f"API endpoint: {API_BASE_URL}")

    # Check if content directory exists
    if not os.path.exists(CONTENT_ROOT):
        print(f"\n{CROSS_MARK} Error: Content directory not found: {CONTENT_ROOT}")
        return

    # Scan filesystem
    fs_scanner = FilesystemScanner(CONTENT_ROOT)
    fs_dirs = fs_scanner.scan()

    # Scan database
    db_scanner = DatabaseScanner(API_BASE_URL)
    db_dirs = db_scanner.scan()

    if not db_dirs:
        print(f"\n{CROSS_MARK} Error: Could not fetch data from API. Is the server running?")
        return

    # Validate
    validator = DatabaseValidator(fs_dirs, db_dirs)
    issues = validator.validate()

    # Generate report
    report = ReportGenerator(fs_dirs, db_dirs, issues)
    report.generate()


if __name__ == "__main__":
    main()
