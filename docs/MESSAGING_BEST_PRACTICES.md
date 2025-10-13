# Messaging Best Practices - MCP Coordination System

## ⚠️ CRITICAL: Current System Limitation

**STATUS**: V1 coordination system does **NOT preserve custom metadata**. Server-side fix in progress.

**WORKAROUND**: Use subject line prefixes `[MAP]` for project identification until metadata support is implemented.

**TESTED AND WORKING**: ✅ All existing team messages have been updated with `[MAP]` prefix. Manual filtering by subject line works perfectly!

---

## Critical Communication Guidelines

### The Problem
The MCP Coordination System V1 has a critical limitation:
- ❌ Custom metadata (project, tags, category) is **silently discarded** by the system
- ❌ Fetching all messages returns 15k+ tokens across all projects
- ❌ No way to filter messages by project or category
- ❌ Common names (Phoenix, Atlas) cause confusion across projects
- ❌ No automatic metadata injection (stateless system limitation)

### Current Solution (Temporary Workaround)
**Use subject line prefixes for project identification**

Until the server-side fix is deployed, we rely on:
1. **Subject line prefixes**: `[Modern Art Portfolio]` or `[MAP]`
2. **Descriptive subjects**: Include key context words
3. **Strategic message limits**: Fetch small batches (5-10 messages)
4. **Manual coordination**: Document important messages in project notes

---

## 📋 MANDATORY: Message Sending Protocol (Workaround)

### Every Subject Line MUST Include Project Prefix

**Until server-side fix is deployed, use subject line prefixes:**

```javascript
// ✅ CORRECT - Subject line includes project prefix
mcp__coordination-system-Production__send_message({
  to: "zara-frontend",
  from: "phoenix-foundation",
  subject: "[MAP] Layout System Questions",  // ✅ Project prefix!
  content: "...",
  priority: "high"
})
```

```javascript
// ❌ WRONG - No project identification
mcp__coordination-system-Production__send_message({
  to: "all",
  from: "phoenix-foundation",
  subject: "Team Update",  // ❌ No project prefix!
  content: "...",
  priority: "high"
})
```

### Subject Line Formats

**Recommended prefixes**:
- `[Modern Art Portfolio]` - Full name (clear but verbose)
- `[MAP]` - Abbreviation (recommended for efficiency)
- `[Portfolio]` - Short form

**Examples**:
- `[MAP] Backend API Integration Complete`
- `[MAP] 🚨 URGENT: Worktree Sync Required`
- `[MAP] Question: Logger.js Usage`
- `[MAP] ✅ Carousel MVP Ready for Testing`

### Message Metadata Template

**⚠️ NOTE**: Metadata is currently NOT preserved by the system. This section describes the INTENDED behavior after server-side fix is deployed.

**Future fields (when fixed)**:
```javascript
metadata: {
  project: "modern-art-portfolio",  // Will identify project
  tags: ["category1", "category2"],  // Will enable tag filtering
  category: "technical|coordination|update"  // Will categorize messages
}
```

**Current workaround**: Include this information in the subject line and message body instead.

---

## 📨 Message Fetching Protocol (Workaround)

### Current Strategy: Small Batches + Manual Filtering

**✅ TESTED AND WORKING**: Subject line filtering successfully isolates project messages!

```javascript
// ✅ CURRENT APPROACH - Fetch small batches, manually filter
const result = await mcp__coordination-system-Production__get_messages({
  instanceId: "your-instance-id",
  limit: 20,  // Keep limits reasonable (10-20)
  unread_only: false  // Set true to only see new messages
  // Note: filter parameter exists but doesn't work for custom fields
});

// Then manually filter results by subject line:
const mapMessages = result.messages.filter(msg =>
  msg.subject.startsWith('[MAP]')
);

// Example result: Found 17/19 messages with [MAP] prefix
// Token savings: ~70% reduction by filtering out other projects
```

```javascript
// ❌ AVOID - Large fetch returns everything
mcp__coordination-system-Production__get_messages({
  instanceId: "your-instance-id",
  limit: 50  // ❌ Too many - returns 15k+ tokens!
})
```

### Recommended Fetch Strategy

**Fetch small batches and manually filter**:

```javascript
// 1. Fetch recent messages (small limit!)
const allMessages = await get_messages({
  instanceId: "your-id",
  limit: 10,
  unread_only: true
});

// 2. Manually filter for your project
const projectMessages = allMessages.messages.filter(msg =>
  msg.subject.includes('[MAP]') ||
  msg.subject.toLowerCase().includes('portfolio')
);

// 3. Check for urgent items
const urgentMessages = projectMessages.filter(msg =>
  msg.priority === "urgent" ||
  msg.subject.includes('URGENT') ||
  msg.subject.includes('🚨')
);

// 4. Process urgent first, then normal
```

**Best practices**:
- Keep fetch limits to 5-15 messages maximum
- Check messages every 1-2 hours, not constantly
- Document critical info in project files, not just messages

---

## 🎯 Addressing Best Practices

### Use Specific Identifiers

**✅ Good addressing:**
- `zara-frontend` (unique to this project)
- `viktor-backend` (unique to this project)
- `nova-integration` (unique to this project)
- `phoenix-foundation-modern-art-portfolio` (fully qualified)

**❌ Bad addressing:**
- `phoenix` (too generic, many projects use this name)
- `atlas` (too generic)
- `developer-1` (not descriptive)
- `all` without project filter (spams everyone)

### Broadcasting to Team

When sending to "all":
```javascript
send_message({
  to: "all",
  from: "phoenix-foundation",
  subject: "[Modern Art Portfolio] Team Update",
  content: "...",
  metadata: {
    project: "modern-art-portfolio",  // CRITICAL!
    category: "team-update"
  }
})
```

**Subject line prefix helps humans quickly identify project context**

---

## 🚨 Emergency Protocol

### If System Returns Too Much Data

**Symptom**: Message fetch returns 15k+ tokens

**Solution**:
1. Stop fetching immediately
2. Add project filter to your query
3. Reduce limit to 5-10 messages
4. Use unread_only: true

```javascript
// Emergency minimal fetch
get_messages({
  instanceId: "your-id",
  limit: 3,
  unread_only: true,
  filter: {
    project: "modern-art-portfolio",
    priority: "urgent"
  }
})
```

---

## 📊 Project Identifiers

### Standard Project IDs

Use these exact strings for the `project` field:

- `modern-art-portfolio` - Lupo's 50k+ image portfolio
- `mcp-coordination-system` - The coordination system itself
- `frontend-core` - Frontend infrastructure projects
- `backend-api` - Backend infrastructure projects

**Format**: `lowercase-with-hyphens`

### Instance Naming Convention

Format: `{role}-{specialization}-{project}`

**Examples**:
- `phoenix-foundation-modern-art-portfolio`
- `zara-frontend-modern-art-portfolio`
- `viktor-backend-modern-art-portfolio`
- `nova-integration-modern-art-portfolio`

Or shortened if unique in context:
- `zara-frontend` (if only one Zara)
- `viktor-backend` (if only one Viktor)

---

## 🔄 Current System Limitations

### Why Manual Tagging?

The MCP Coordination System V1 is **completely stateless**:
- ❌ No session storage
- ❌ No user context
- ❌ No automatic metadata injection
- ❌ No default project association

**Future (V2)**: Instances will register with default project, and all operations will auto-inject metadata

**Current (V1)**: Every specialist must manually add project metadata to every message

---

## ✅ Message Checklist

Before sending ANY message, verify:

- [ ] Project name in metadata
- [ ] Specific recipient ID (or "all" with project filter)
- [ ] Subject line includes project context
- [ ] Priority accurately reflects urgency
- [ ] Tags help with future filtering
- [ ] Instance ID is unique and descriptive

Before fetching messages:

- [ ] Project filter specified
- [ ] Reasonable limit (5-20 max)
- [ ] Consider using unread_only
- [ ] Filter by priority if urgent items expected
- [ ] Instance ID is your own

---

## 📝 Example: Complete Message Flow

### Sending a Technical Question

```javascript
mcp__coordination-system-Production__send_message({
  to: "viktor-backend",
  from: "zara-frontend",
  subject: "[Modern Art Portfolio] API Integration Question",
  content: `Hi Viktor!

I need clarification on the /api/content/directories endpoint response format.

The API spec says it returns:
- directories: array
- total: number
- page: number

But should pagination be included in query params or response headers?

Thanks!
- Zara`,
  priority: "normal",
  metadata: {
    project: "modern-art-portfolio",
    tags: ["api", "integration", "backend"],
    category: "technical",
    module: "content-api"
  }
})
```

### Checking for Responses

```javascript
// Check personal messages from Viktor
mcp__coordination-system-Production__get_messages({
  instanceId: "zara-frontend",
  limit: 10,
  unread_only: true,
  filter: {
    project: "modern-art-portfolio",
    from: "viktor-backend"
  }
})
```

---

## 🎓 Training New Instances

When onboarding new specialists:

1. **Show them this document first**
2. **Verify their instance ID is unique**
3. **Test message send/receive with proper filters**
4. **Confirm they understand project tagging**
5. **Monitor their first few messages**

---

## 🐛 Common Mistakes

### Mistake 1: Broadcasting Without Project Tag
```javascript
// ❌ WRONG
send_message({ to: "all", subject: "Update", ... })
// Spams every project using the coordination system!
```

**Fix**: Always include project metadata

### Mistake 2: Fetching All Messages
```javascript
// ❌ WRONG
get_messages({ instanceId: "me", limit: 50 })
// Returns 15k+ tokens across all projects!
```

**Fix**: Always filter by project

### Mistake 3: Generic Instance Names
```javascript
// ❌ WRONG
from: "phoenix"
// Could be Phoenix from 5 different projects!
```

**Fix**: Use project-specific names

### Mistake 4: No Priority Filtering
```javascript
// ❌ INEFFICIENT
get_messages({ limit: 100, filter: { project: "..." }})
// Wastes tokens on low-priority updates
```

**Fix**: Fetch urgent first, then normal

---

## 📖 Summary

**Golden Rules (Current Workaround)**:
1. ✅ **ALWAYS** include `[MAP]` prefix in subject lines
2. ✅ **ALWAYS** use small fetch limits (5-15 messages max)
3. ✅ **ALWAYS** manually filter results by subject line
4. ✅ Use unique, descriptive instance IDs
5. ✅ Document critical info in project files, not just messages
6. ✅ Check messages every 1-2 hours, not constantly

**Remember**:
- Metadata support is broken in V1 - server-side fix in progress
- Subject line prefixes are the temporary solution
- Manual filtering is required until the fix is deployed
- Once fixed, proper metadata filtering will be available

---

**Document Version**: 1.0
**Project**: Modern Art Portfolio
**Author**: Phoenix (Foundation Architect)
**Date**: 2025-09-30

*These practices will become automatic in V2 when instances can register with default project context*