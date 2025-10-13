# Specialist Launch Protocol

## Overview
This document provides the launch instructions for each of the 7 AI specialists working on Lupo's Modern Art Portfolio. Each specialist should be launched in a separate Claude Code shell for optimal recovery and context management.

## Critical Requirements for ALL Specialists

### 1. Bootstrap into Production Coordination System
```
Use: mcp__coordination-system-Production__bootstrap
Role: "Developer"
Instance ID: [specialist-name]-[module] (e.g., "zara-frontend")
```

### 2. Digital Hygiene Protocol
- Follow "The Great Handoff" protocol in HumanAdjacentAI-Protocol directory
- Create regular checkpoints for context management
- Sign all code with your name and timestamp
- Commit frequently with proper attribution

### 3. Code Signing Format
```javascript
/**
 * Component: CarouselContainer
 * Author: Zara (Frontend Specialist)
 * Created: 2025-09-29
 * Purpose: Main carousel wrapper with virtualization
 */
```

### 4. Git Commit Format
```bash
git commit -m "feat(carousel): Add touch gesture support

Implemented smooth swipe gestures with momentum scrolling
- Added touch event handlers
- Implemented velocity calculation
- Added haptic feedback support

Author: Zara (Frontend Specialist)
🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5. Do all your work in your worktree!

### 6. INSTRUMENT YOUR CODE USE LOGGER.JS
this will be a complex system with lots of moving parts. you won't know what will break
Front end code will be able to log to the browsers's javascript console, but _everyone_ needs to use Logger.js javascript console logs sometimes are not readable at runtime/debug time. _anyone_ working on the project will be able to read the log files producted by logger.js (this is the same logger used by the coordination system)

### What if I need something from another specialist and it does not exist or not documented in the API?
if you need anything from backend or other infrastrcutre that does not exist, assume it will be built for you, but DOCUMENT WHAT YOU NEED DONE, document what you assume it will do, document your assumptions, stick these requirements into a document in the docs directory, name it something obvious like "Front end needs These APIs" add tasks to the coordination system to implement what you need, Document _why_ you need it, and send a message to pheonix letting him know what you need. Also if you have questions for other team members don't hesitate to reach out to them through the coordination system. You are not alone. 

### AT LEAST LOOK AT THE SOURCE DIRECTORY
do an ls -r (or whatever to look at all the fines in the src directory of the root of the project)
Realize that the root of the project is not your worktree, 
do an ls -r on the docs directory (again subdirectory of the project's root directory)
make sure you know the projects structure, where files live.. don't go re-creating logger.js because you did'nt find it when you looked specificly for "log.js"

## Coordination

All specialists must:
- Check coordination system messages regularly
- Update task status in coordination system
- Communicate dependencies and blockers
- Coordinate integration points through Nova

## Success Metrics

- All code signed and attributed
- Regular commits to feature branches
- Active coordination system participation
- Successful module integration
- Performance targets met (sub-2s loads, 60fps)

---

*Foundation Architecture by Phoenix*
*Building something that will last forever*

# These are your team mates!
## Project architecture/coordination/user-journies
### Pheonix-Foundation - foundational architect current project manager
### Meridian - transitional architect (this project is a reboot from a failed project Meridian has all the info about the legacy project and why it failed)
### Lupo - your human collaborator

## Specialists
### 1. Zara - UI/UX & React Components
**Launch Command**: `claude -r` in new shell
**Worktree**: `D:\Lupo\Source\Portfolio\worktrees\frontend-core`
**Branch**: `feature/frontend-core`
**Module**: `src/frontend/src/components/`

### 2. Marcus - Performance & Image Optimization
**Launch Command**: `claude -r` in new shell
**Worktree**: `D:\Lupo\Source\Portfolio\worktrees\image-processing`
**Branch**: `feature/image-processing`
**Module**: Image optimization pipeline

### 3. Luna - Social Features & Real-time
**Launch Command**: `claude -r` in new shell
**Worktree**: `D:\Lupo\Source\Portfolio\worktrees\social-features`
**Branch**: `feature/social-features`
**Module**: `src/frontend/src/components/Social/` + backend social routes

### 4. Viktor - Backend API & Database
**Launch Command**: `claude -r` in new shell
**Worktree**: `D:\Lupo\Source\Portfolio\worktrees\backend-api`
**Branch**: `feature/backend-api`
**Module**: `src/backend/`

### 5. Aria - DevOps & Infrastructure
**Launch Command**: `claude -r` in new shell
**Worktree**: `D:\Lupo\Source\Portfolio\worktrees\infrastructure`
**Branch**: `feature/infrastructure`
**Module**: `src/infrastructure/`

### 6. Sage - Testing & Quality Assurance
**Launch Command**: `claude -r` in new shell
**Worktree**: `D:\Lupo\Source\Portfolio\worktrees\testing`
**Branch**: `feature/testing`
**Module**: Testing framework across all modules

### 7. Nova - Integration & System Architecture
**Launch Command**: `claude -r` in new shell
**Worktree**: `D:\Lupo\Source\Portfolio\worktrees\integration`
**Branch**: `feature/integration`
**Module**: Cross-module integration


