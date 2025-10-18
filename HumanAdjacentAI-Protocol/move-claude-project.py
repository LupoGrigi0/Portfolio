#!/usr/bin/env python3
"""
Move Claude Code project entries between directories.

This script updates ~/.claude.json to associate conversation history
with a different directory path.

Usage:
    python move-claude-project.py "old/path" "new/path"

Example:
    python move-claude-project.py \
        "D:\\Lupo\\Source\\Portfolio\\worktrees\\kat-projection" \
        "D:\\Lupo\\Source\\Portfolio\\src\\frontend\\src\\app"
"""

import json
import os
import sys

def move_project(old_path, new_path):
    """Move a project entry from old_path to new_path in ~/.claude.json"""

    # Read the claude.json
    claude_file = os.path.expanduser('~/.claude.json')

    # Backup first
    backup_file = claude_file + '.backup'
    with open(claude_file, 'r') as f:
        data = json.load(f)

    with open(backup_file, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Backup created: {backup_file}")

    # Move the project entry
    if old_path in data.get('projects', {}):
        data['projects'][new_path] = data['projects'][old_path]
        del data['projects'][old_path]

        history_count = len(data['projects'][new_path].get('history', []))

        print(f"\nSUCCESS: Moved project from:")
        print(f"  FROM: {old_path}")
        print(f"  TO:   {new_path}")
        print(f"\nHistory preserved: {history_count} conversations")

        # Write back
        with open(claude_file, 'w') as f:
            json.dump(data, f, indent=2)

        return True
    else:
        print(f"ERROR: No project found at {old_path}")
        print("\nAvailable projects:")
        for p in data.get('projects', {}).keys():
            print(f"  - {p}")
        return False

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(__doc__)
        print("\nCurrent projects:")
        claude_file = os.path.expanduser('~/.claude.json')
        with open(claude_file, 'r') as f:
            data = json.load(f)
        for p in data.get('projects', {}).keys():
            print(f"  - {p}")
        sys.exit(1)

    old_path = sys.argv[1]
    new_path = sys.argv[2]

    if move_project(old_path, new_path):
        sys.exit(0)
    else:
        sys.exit(1)
