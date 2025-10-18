#!/usr/bin/env python3
"""
List all conversations for a specific project directory.
Shows session IDs and any available metadata.
"""

import json
import os
import sys

def list_project_conversations(project_path):
    """List all conversations for a given project path."""

    claude_file = os.path.expanduser('~/.claude.json')

    with open(claude_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    projects = data.get('projects', {})

    # Try both path formats
    paths_to_try = [
        project_path,
        project_path.replace('/', '\\'),
        project_path.replace('\\', '/')
    ]

    project_data = None
    matched_path = None

    for path in paths_to_try:
        if path in projects:
            project_data = projects[path]
            matched_path = path
            break

    if not project_data:
        print(f"Project not found: {project_path}")
        print("\nAvailable projects:")
        for p in sorted(projects.keys()):
            print(f"  {p}")
        return

    print(f"Project: {matched_path}")
    print(f"=" * 80)

    history = project_data.get('history', [])

    if not history:
        print("\nNo conversations found.")
        return

    print(f"\nTotal conversations: {len(history)}\n")

    # List all sessions with their metadata
    for i, session in enumerate(history, 1):
        if isinstance(session, dict):
            # New format: session is a dict with metadata
            display = session.get('display', 'Untitled')
            session_id = session.get('sessionId', 'unknown')

            # Truncate display text
            display_preview = display[:80] + "..." if len(display) > 80 else display

            print(f"{i:3d}. {display_preview}")
            print(f"      Session ID: {session_id}")

            # Check for keywords that might indicate which Kai this is
            display_lower = display.lower()
            if 'lightboard' in display_lower:
                print(f"      *** LIGHTBOARD MENTION ***")
            if 'kat' in display_lower or 'kai' in display_lower:
                print(f"      *** KAI/KAT MENTION ***")
            if 'prism' in display_lower:
                print(f"      *** PRISM MENTION ***")

        else:
            # Old format: just a string session ID
            print(f"{i:3d}. Session ID: {session}")

    print(f"\n" + "=" * 80)
    print(f"Total: {len(history)} conversations")

    # Look for session storage location
    print("\n\nSearching for session storage...")
    potential_locations = [
        os.path.expanduser('~/.claude/sessions'),
        os.path.expanduser('~/.claude/conversations'),
        os.path.expanduser('~/.local/share/claude'),
        os.path.expanduser('~/AppData/Local/Claude'),
        os.path.expanduser('~/AppData/Roaming/Claude'),
    ]

    for loc in potential_locations:
        if os.path.exists(loc):
            print(f"  Found: {loc}")
            # Try to list contents
            try:
                contents = os.listdir(loc)
                print(f"    Contains {len(contents)} items")
            except:
                pass

if __name__ == '__main__':
    if len(sys.argv) < 2:
        # Default to Portfolio main directory
        project_path = r'D:\Lupo\Source\Portfolio'
    else:
        project_path = sys.argv[1]

    list_project_conversations(project_path)
