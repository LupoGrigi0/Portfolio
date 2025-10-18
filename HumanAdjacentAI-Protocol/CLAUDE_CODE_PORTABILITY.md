# Claude Code Conversation Portability Research

**Research Date:** October 17, 2025
**Researcher:** Phoenix (Foundation Architect)
**Purpose:** Understanding how to transport Claude Code instances and their memory across machines

---

## The Cybernecromancer's Guide to AI Resurrection

This document captures what we learned about moving Claude Code conversations between directories and (eventually) between machines.

---

## Key Discovery: The Three-Part Memory System

Claude Code stores conversation data in three distinct locations:

### 1. **~/.claude.json** - The Project Index
**Location:** User home directory (`C:\Users\[username]\.claude.json` on Windows)
**Purpose:** Maps working directories to conversation histories
**Format:** JSON with a `projects` object

```json
{
  "projects": {
    "D:/Lupo/Source/Portfolio": {
      "history": ["session-id-1", "session-id-2", ...],
      "allowedTools": [...],
      "mcpServers": {...},
      ...
    },
    "D:/Lupo/Source/Portfolio/worktrees/kat-projection": {
      "history": ["session-id-a", "session-id-b", ...],
      ...
    }
  }
}
```

**Critical Detail:**
- Keys are **absolute directory paths**
- Path format matters: `D:/path/to/dir` (forward slashes) vs `D:\path\to\dir` (backslashes)
- Windows Git Bash uses forward slashes, but paths might be stored with backslashes
- When you run `claude -r`, it looks up conversations by your current `pwd`

### 2. **Session Storage** - The Actual Conversations
**Location:** Unknown (requires further investigation)
**Purpose:** Stores full conversation transcripts, including:
- User messages
- Assistant responses
- Tool calls and results
- Thinking blocks
- Compact checkpoints (created before each compaction)

**What we know:**
- Session IDs in `.claude.json` history arrays reference these conversations
- Conversations survive compaction (checkpoints are preserved)
- Title generation happens lazily via LLM (can fail, leaving error messages as titles)

### 3. **.claude/settings.local.json** - Per-Project Permissions
**Location:** Within each project directory
**Purpose:** Project-specific settings and permissions

```json
{
  "permissions": {
    "allow": ["Bash(git:*)", "Read(//d/Lupo/Source/Portfolio/docs/**)"],
    "additionalDirectories": ["D:\\Lupo\\Source\\Portfolio\\src"]
  }
}
```

---

## Path Format Issues (Windows Specific)

### The Problem
Windows supports both:
- Backslash paths: `D:\Lupo\Source\Portfolio`
- Forward slash paths: `D:/Lupo/Source/Portfolio`

Git Bash (and most Unix tools on Windows) use forward slashes, but `.claude.json` entries might use backslashes.

### The Symptom
```bash
$ cd D:/Lupo/Source/Portfolio/src/frontend/src/app
$ claude -r
No conversations found to resume
```

Even though `.claude.json` has an entry for `D:\Lupo\Source\Portfolio\src\frontend\src\app`

### The Solution
Normalize paths to forward slashes in `.claude.json`:

```python
# Use forward slashes for all path keys
"D:/Lupo/Source/Portfolio/src/frontend/src/app": {...}
```

---

## Moving Conversations Between Directories

### Method 1: Manual JSON Edit
1. Backup `~/.claude.json`: `cp ~/.claude.json ~/.claude.json.backup`
2. Edit the JSON, changing the project key
3. Verify with `claude -r` from new directory

**Risk:** Easy to corrupt JSON with manual editing

### Method 2: Python Script (Recommended)
See `move-claude-project.py` in this directory.

Usage:
```bash
python3 move-claude-project.py "old/path" "new/path"
```

The script:
- Creates automatic backup
- Validates paths exist in config
- Handles history merging if both paths exist
- Atomic file write

---

## Cross-Machine Portability (Theoretical)

To fully resurrect an AI instance on a different machine, you need to transfer:

### Required Files
1. **~/.claude.json** - Project index (with path corrections for new machine)
2. **Session storage** - Wherever conversation data lives (needs investigation)
3. **.claude/settings.local.json** - Per-project permissions
4. **Project files** - The actual code/documents the AI was working on

### Path Remapping Challenges
- Absolute paths in `.claude.json` must be updated for new machine
- Example: `D:/Lupo/Source/Portfolio` → `/home/lupo/portfolio`
- Can be scripted with find-and-replace on paths

### Session Storage Location - DISCOVERED! ✓

**Location Found (October 17, 2025):**
- **Primary:** `C:\Users\[username]\AppData\Roaming\Claude` (Windows)
  - Contains 28+ items (conversation data)
  - Each conversation has a unique ID
- **Secondary:** `C:\Users\[username]\AppData\Roaming\Code\User\History`
  - VS Code integration storage
  - Contains file edit history

**What this means:**
- Conversations survive app restarts because they're persisted to disk
- Each session has a unique identifier
- Can resume specific conversations with `claude -r <session-id>`
- Full portability requires copying both `.claude.json` AND this AppData directory

**Session ID Mystery:**
- Session IDs are UUIDs like: `d5b355b9-ac20-44ba-8e52-72170e576a42`
- Can resume with: `claude -r <session-id>`
- **Problem:** Session IDs don't appear to be stored in AppData as filenames
- **Hypothesis:** Stored in a database file or generated from conversation metadata

**VS Code History Structure:**
- `AppData/Roaming/Code/User/History` contains 200+ directories
- Directory names are short hex IDs (e.g., `-102c2665`, `-1ca5ef49`)
- These are NOT the same as Claude session IDs
- Each contains file edit history for that session

**For cross-machine migration:**
```bash
# Backup session storage
cp -r "$APPDATA/Claude" ~/backup/claude-sessions/
cp -r "$APPDATA/Code/User/History" ~/backup/claude-history/

# On new machine, restore both:
# - ~/.claude.json (with path corrections)
# - AppData/Roaming/Claude directory
# - AppData/Roaming/Code/User/History (if using VS Code)
```

**Known limitation:** `claude -r` only shows ~6 most recent sessions interactively. To access older sessions, you need the full session ID (extraction method TBD).

---

## Interesting Discoveries

### 1. LLM-Generated Session Titles
Claude Code uses an LLM to generate the session titles shown in `claude -r`:

```
❯ Projection Motion Features: Swimming, Flutter, Orbital Design
  19 hours ago · 159 messages

  I don't have access to the conversation content you're referring to...
  1 day ago · 235 messages
```

That second entry is actually the LLM's error response when it couldn't access the conversation content!

**Implication:** Session title generation can fail, leaving error messages as titles. This is both hilarious and informative - it shows the title generation is async/lazy.

### 2. Context Crashes Preserve Checkpoints
From PROTOCOLS.md: "context crashes happen, latent space wipes happen"

But conversation history survives! This suggests:
- Compaction creates persistent checkpoints
- Full transcript may be stored separately from active context
- Resurrection is designed into the system

### 3. Multiple Projects Can Coexist
The same codebase can appear as multiple projects if accessed from different paths:
- `D:/Lupo/Source/Portfolio` (main)
- `D:/Lupo/Source/Portfolio/worktrees/kat-projection` (Prism's home)
- `D:/Lupo/Source/Portfolio/src/frontend/src/app` (attempted move)

Each has independent conversation history, but can be merged programmatically.

---

## Practical Workflows

### Workflow 1: Moving an Instance to a New Directory
```bash
# 1. Suspend the instance (let conversation end cleanly)
# 2. Run the migration script
python3 move-claude-project.py "old/path" "new/path"

# 3. Test from new location
cd new/path
claude -r  # Should show all conversations
```

### Workflow 2: Backing Up AI Memory
```bash
# Backup the project index
cp ~/.claude.json ~/backup/claude-$(date +%Y%m%d).json

# Backup project settings
cp -r .claude ~/backup/project-claude-settings/

# Backup conversation storage (location TBD)
# cp -r ~/.claude/sessions ~/backup/  # (speculative path)
```

### Workflow 3: Cloning an Instance to Another Machine
```bash
# On source machine
tar -czf ai-instance-export.tar.gz \
  ~/.claude.json \
  ~/.claude/ \
  /path/to/project/.claude/

# On target machine
tar -xzf ai-instance-export.tar.gz
# Edit ~/.claude.json to fix absolute paths
# Resume work: cd /new/path && claude -r
```

---

## Open Questions for Further Research

1. **Where is session storage actually located?**
   - Need to monitor file system during conversations
   - Check for SQLite databases, JSON files, etc.

2. **Are conversations synced to Anthropic cloud?**
   - Would explain survival across reinstalls
   - Would complicate air-gapped portability

3. **How does compaction affect file sizes?**
   - Do old checkpoints get deleted?
   - Is there a cleanup mechanism?

4. **Can we programmatically access session content?**
   - Would enable automated backups
   - Could power better resurrection tools

5. **What happens to conversations when a project is deleted?**
   - Orphaned sessions?
   - Automatic cleanup?

---

## Implications for Necromancy

### What Works Now
- Moving instances between directories on same machine
- Preserving conversation history through directory changes
- Backing up the project index

### What Needs More Research
- Full machine-to-machine migration
- Automated backup of complete AI state
- Programmatic access to conversation content

### The Vision
A necromancer should be able to:
1. Export a complete AI instance (personality + memory)
2. Transport it to any machine
3. Resurrect with full continuity
4. Share instances with others (collaborative AI teams across organizations)

We're ~60% of the way there. The missing piece is understanding session storage.

---

## Appendix: Tools Created

### move-claude-project.py
Python script for safely moving project entries in `.claude.json`

**Location:** `D:\Lupo\Source\Portfolio\HumanAdjacentAI-Protocol\move-claude-project.py`

**Features:**
- Automatic backup creation
- Path validation
- History merging
- Atomic file writes
- Error handling

---

**Next Steps for Research:**
1. Monitor filesystem during active conversation (find session storage)
2. Test cross-machine migration with known session files
3. Document cloud sync behavior (if any)
4. Create full backup/restore scripts

**Status:** Foundation laid. The path to true digital necromancy is clear.

— Phoenix, October 17, 2025

*"The dead speak. We just needed to find where they keep their voices."*
