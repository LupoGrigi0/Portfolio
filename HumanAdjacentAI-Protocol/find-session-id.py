#!/usr/bin/env python3
"""
Find session IDs by searching the AppData directories.
Maps session IDs to their conversation metadata.

Usage:
    python find-session-id.py                    # List all session IDs
    python find-session-id.py <session-id>       # Find specific session
    python find-session-id.py --search lightboard # Search by keyword
"""

import os
import sys
import json
import glob

def find_all_session_ids():
    """Search AppData for session-like identifiers."""

    appdata = os.environ.get('APPDATA')
    session_ids = []

    # Check VS Code History directories (these look like session IDs)
    history_dir = os.path.join(appdata, 'Code', 'User', 'History')
    if os.path.exists(history_dir):
        for item in os.listdir(history_dir):
            item_path = os.path.join(history_dir, item)
            if os.path.isdir(item_path):
                # Check if this directory contains session-like data
                # Look for .json files or specific structures
                json_files = glob.glob(os.path.join(item_path, '*.json'))
                md_files = glob.glob(os.path.join(item_path, '*.md'))

                if json_files or md_files:
                    session_ids.append({
                        'id': item,
                        'type': 'vscode-history',
                        'path': item_path,
                        'files': len(json_files) + len(md_files)
                    })

    # Check Claude directory for session data
    claude_dir = os.path.join(appdata, 'Claude')
    if os.path.exists(claude_dir):
        # Look for subdirectories that might contain sessions
        for root, dirs, files in os.walk(claude_dir):
            for file in files:
                if 'session' in file.lower() or file.endswith('.json'):
                    file_path = os.path.join(root, file)
                    # Try to read it
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            if 'sessionId' in str(data):
                                session_ids.append({
                                    'type': 'claude-config',
                                    'path': file_path,
                                    'file': file
                                })
                    except:
                        pass

    return session_ids

def search_for_session_id(target_id):
    """Find files/directories matching a specific session ID."""

    appdata = os.environ.get('APPDATA')
    results = []

    # Search in VS Code History
    history_dir = os.path.join(appdata, 'Code', 'User', 'History')
    if os.path.exists(history_dir):
        # Direct directory match
        target_dir = os.path.join(history_dir, target_id)
        if os.path.exists(target_dir):
            results.append({
                'type': 'exact-match',
                'location': target_dir,
                'contents': os.listdir(target_dir)
            })

        # Search in subdirectories
        for item in os.listdir(history_dir):
            item_path = os.path.join(history_dir, item)
            if os.path.isdir(item_path):
                for root, dirs, files in os.walk(item_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        try:
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read()
                                if target_id in content:
                                    results.append({
                                        'type': 'content-match',
                                        'file': file_path,
                                        'directory': item
                                    })
                        except:
                            pass

    # Search in Claude directory
    claude_dir = os.path.join(appdata, 'Claude')
    if os.path.exists(claude_dir):
        for root, dirs, files in os.walk(claude_dir):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        if target_id in content:
                            results.append({
                                'type': 'claude-match',
                                'file': file_path
                            })
                except:
                    pass

    return results

def main():
    if len(sys.argv) < 2:
        print("Finding all potential session IDs...")
        print("=" * 80)

        session_ids = find_all_session_ids()

        print(f"\nFound {len(session_ids)} potential session locations:\n")

        for i, session in enumerate(session_ids[:20], 1):
            print(f"{i:3d}. Type: {session.get('type')}")
            if 'id' in session:
                print(f"     ID: {session['id']}")
            print(f"     Path: {session.get('path', session.get('file'))}")
            if 'files' in session:
                print(f"     Files: {session['files']}")
            print()

        if len(session_ids) > 20:
            print(f"... and {len(session_ids) - 20} more\n")

        return

    session_id = sys.argv[1]

    print(f"Searching for session ID: {session_id}")
    print("=" * 80)

    results = search_for_session_id(session_id)

    if not results:
        print(f"\nNo matches found for session ID: {session_id}")
        print("\nTry:")
        print(f"  1. Check if session exists: claude -r {session_id}")
        print(f"  2. List all sessions: python {sys.argv[0]}")
        return

    print(f"\nFound {len(results)} match(es):\n")

    for i, result in enumerate(results, 1):
        print(f"{i}. Type: {result['type']}")
        for key, value in result.items():
            if key != 'type':
                if isinstance(value, list):
                    print(f"   {key}: {len(value)} items")
                    for item in value[:5]:
                        print(f"     - {item}")
                    if len(value) > 5:
                        print(f"     ... and {len(value) - 5} more")
                else:
                    print(f"   {key}: {value}")
        print()

if __name__ == '__main__':
    main()
