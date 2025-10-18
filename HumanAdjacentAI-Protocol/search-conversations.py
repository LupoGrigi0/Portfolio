#!/usr/bin/env python3
"""
Search for conversations matching a keyword or pattern.
Returns session IDs and associated project directories.

Usage:
    python search-conversations.py "lightboard"
    python search-conversations.py "kai"
    python search-conversations.py "prism"
"""

import json
import os
import sys
import re

def search_conversations(search_term, case_sensitive=False):
    """Search all conversations for a term, return matching sessions."""

    claude_file = os.path.expanduser('~/.claude.json')

    with open(claude_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    projects = data.get('projects', {})

    # Compile regex for search
    flags = 0 if case_sensitive else re.IGNORECASE
    pattern = re.compile(re.escape(search_term), flags)

    matches = []

    # Search through all projects
    for project_path in sorted(projects.keys()):
        history = projects[project_path].get('history', [])

        for i, session in enumerate(history):
            if isinstance(session, dict):
                display = session.get('display', '')

                if pattern.search(display):
                    matches.append({
                        'project_path': project_path,
                        'session_number': i + 1,
                        'total_in_project': len(history),
                        'display': display,
                        'match_context': get_match_context(display, pattern)
                    })

    return matches

def get_match_context(text, pattern, context_chars=100):
    """Get text around the match for context."""
    match = pattern.search(text)
    if not match:
        return text[:context_chars]

    start = max(0, match.start() - context_chars // 2)
    end = min(len(text), match.end() + context_chars // 2)

    snippet = text[start:end]
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."

    return snippet

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nExample searches:")
        print("  python search-conversations.py lightboard")
        print("  python search-conversations.py 'Kai working'")
        print("  python search-conversations.py prism")
        sys.exit(1)

    search_term = sys.argv[1]
    case_sensitive = '--case-sensitive' in sys.argv

    print(f"Searching for: '{search_term}'")
    if case_sensitive:
        print("(case-sensitive)")
    print("=" * 80)
    print()

    matches = search_conversations(search_term, case_sensitive)

    if not matches:
        print(f"No conversations found matching '{search_term}'")
        return

    print(f"Found {len(matches)} matching conversation(s):\n")

    for match in matches:
        print(f"Project: {match['project_path']}")
        print(f"  Session #{match['session_number']} of {match['total_in_project']}")
        print(f"  Context: {match['match_context']}")
        print(f"\n  To resume:")
        print(f"    cd \"{match['project_path']}\"")
        print(f"    claude -r")
        print(f"    # Then select conversation #{match['session_number']} from the list")
        print()
        print("-" * 80)
        print()

    # Summary
    unique_projects = set(m['project_path'] for m in matches)
    print(f"\nSummary:")
    print(f"  Total matches: {len(matches)}")
    print(f"  Across {len(unique_projects)} project(s)")
    print(f"\nProjects with matches:")
    for project in sorted(unique_projects):
        count = sum(1 for m in matches if m['project_path'] == project)
        print(f"  {project} ({count} matches)")

if __name__ == '__main__':
    main()
