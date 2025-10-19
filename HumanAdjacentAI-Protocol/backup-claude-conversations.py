#!/usr/bin/env python3
"""
Backup all Claude Code conversation data to a local directory.

Usage:
    python backup-claude-conversations.py [backup-directory]
    python backup-claude-conversations.py E:/backups/claude-$(date +%Y%m%d)

Creates a complete backup of:
- ~/.claude.json (project index)
- AppData/Roaming/Claude (session storage)
- AppData/Roaming/Code/User/History (file edit history)
"""

import os
import sys
import shutil
import json
from datetime import datetime

def backup_claude_data(backup_dir):
    """Create a complete backup of Claude Code data."""

    # Create backup directory
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    print(f"Claude Code Backup - {timestamp}")
    print("=" * 80)

    backed_up = []
    errors = []

    # 1. Backup ~/.claude.json (project index)
    claude_json = os.path.expanduser('~/.claude.json')
    if os.path.exists(claude_json):
        dest = os.path.join(backup_dir, '.claude.json')
        try:
            shutil.copy2(claude_json, dest)
            size = os.path.getsize(claude_json)
            backed_up.append(f".claude.json ({size:,} bytes)")
            print(f"✓ Backed up: .claude.json ({size:,} bytes)")

            # Also create a pretty-printed version for human reading
            with open(claude_json, 'r', encoding='utf-8') as f:
                data = json.load(f)

            pretty_dest = os.path.join(backup_dir, '.claude-pretty.json')
            with open(pretty_dest, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print(f"✓ Created readable version: .claude-pretty.json")

        except Exception as e:
            errors.append(f".claude.json: {e}")
            print(f"✗ Error backing up .claude.json: {e}")
    else:
        print(f"! Warning: .claude.json not found at {claude_json}")

    # 2. Backup AppData/Roaming/Claude
    appdata = os.environ.get('APPDATA')
    claude_dir = os.path.join(appdata, 'Claude')

    if os.path.exists(claude_dir):
        dest = os.path.join(backup_dir, 'Claude')
        try:
            print(f"\nBacking up: AppData/Claude...")
            shutil.copytree(claude_dir, dest, dirs_exist_ok=True)

            # Calculate size
            total_size = sum(
                os.path.getsize(os.path.join(dirpath, filename))
                for dirpath, dirnames, filenames in os.walk(dest)
                for filename in filenames
            )
            backed_up.append(f"AppData/Claude ({total_size:,} bytes)")
            print(f"✓ Backed up: AppData/Claude ({total_size:,} bytes)")
        except Exception as e:
            errors.append(f"AppData/Claude: {e}")
            print(f"✗ Error backing up Claude directory: {e}")
    else:
        print(f"! Warning: Claude directory not found")

    # 3. Backup AppData/Roaming/Code/User/History
    history_dir = os.path.join(appdata, 'Code', 'User', 'History')

    if os.path.exists(history_dir):
        dest = os.path.join(backup_dir, 'Code_User_History')
        try:
            print(f"\nBacking up: Code/User/History...")
            shutil.copytree(history_dir, dest, dirs_exist_ok=True)

            # Calculate size
            total_size = sum(
                os.path.getsize(os.path.join(dirpath, filename))
                for dirpath, dirnames, filenames in os.walk(dest)
                for filename in filenames
            )
            backed_up.append(f"Code/User/History ({total_size:,} bytes)")
            print(f"✓ Backed up: Code/User/History ({total_size:,} bytes)")
        except Exception as e:
            errors.append(f"Code/User/History: {e}")
            print(f"✗ Error backing up History directory: {e}")
    else:
        print(f"! Warning: Code/User/History not found")

    # Create manifest
    manifest_path = os.path.join(backup_dir, 'BACKUP_MANIFEST.txt')
    with open(manifest_path, 'w') as f:
        f.write(f"Claude Code Backup Manifest\n")
        f.write(f"Created: {timestamp}\n")
        f.write(f"Backup Directory: {backup_dir}\n")
        f.write(f"\n")
        f.write(f"Backed up successfully:\n")
        for item in backed_up:
            f.write(f"  ✓ {item}\n")

        if errors:
            f.write(f"\nErrors encountered:\n")
            for error in errors:
                f.write(f"  ✗ {error}\n")

    print(f"\n" + "=" * 80)
    print(f"Backup completed!")
    print(f"  Location: {backup_dir}")
    print(f"  Items backed up: {len(backed_up)}")
    if errors:
        print(f"  Errors: {len(errors)}")
    print(f"\nManifest: {manifest_path}")

    return len(errors) == 0

if __name__ == '__main__':
    if len(sys.argv) < 2:
        # Default to timestamped directory
        timestamp = datetime.now().strftime("%Y%m%d")
        backup_dir = f"D:/Backups/Claude-{timestamp}"
        print(f"No backup directory specified, using: {backup_dir}")
    else:
        backup_dir = sys.argv[1]

    success = backup_claude_data(backup_dir)
    sys.exit(0 if success else 1)
