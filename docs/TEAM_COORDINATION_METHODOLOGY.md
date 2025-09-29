# Team Coordination Methodology

## Overview

This document outlines the coordination methodology for the Modern Art Portfolio project, utilizing AI specialist instances working in parallel through git worktrees and the MCP coordination system.

## Architecture

### Core Components
- **Phoenix (Foundation Architect)**: Team launcher and technical foundation coordinator
- **7 Specialist AI Instances**: Each focused on specific modules
- **Git Worktrees**: Parallel development environments per specialist
- **MCP Production Coordination System**: Task management and inter-instance messaging

## Team Structure

### Phoenix - Foundation Architect
**Role**: Team launcher and context inheritance hub
**Responsibilities**:
- Create and configure git worktrees for each specialist
- Establish technical architecture foundation
- Launch specialist instances with inherited context
- Coordinate cross-module dependencies

### Specialist Team Members
1. **Zara** - UI/UX & React Components (`frontend-core`)
2. **Marcus** - Performance & Image Optimization (`image-processing`)
3. **Luna** - Social Features & Real-time (`social-features`)
4. **Viktor** - Backend API & Database (`backend-api`)
5. **Aria** - DevOps & Infrastructure (`infrastructure`)
6. **Sage** - Testing & Quality Assurance (`testing`)
7. **Nova** - Integration & System Architecture (`integration`)

## Git Worktree Strategy

### Structure
```
D:\Lupo\Source\Portfolio\
├── main/                    # Main development branch
├── frontend-core/           # Zara's worktree (UI/React)
├── image-processing/        # Marcus's worktree (Performance)
├── social-features/         # Luna's worktree (Social)
├── backend-api/             # Viktor's worktree (API/DB)
├── infrastructure/          # Aria's worktree (DevOps)
├── testing/                 # Sage's worktree (QA)
└── integration/             # Nova's worktree (Integration)
```

### Benefits
- **Parallel Development**: No merge conflicts during active development
- **Crash Recovery**: Each instance can be resumed independently
- **Context Inheritance**: Specialists inherit Phoenix's technical foundation
- **Module Isolation**: Clear boundaries between specialist areas

## Launch Process

### Phase 1: Foundation Setup (Phoenix)
1. **Worktree Creation**: Create 7 git worktrees for each specialist
2. **Architecture Documentation**: Finalize technical specifications
3. **API Contracts**: Define module interfaces and dependencies
4. **Launch Readiness**: Confirm all prerequisites are met

### Phase 2: Specialist Wake-up (Coordinated Launch)
1. **Context Inheritance**: Each specialist launched via Phoenix's Task tool
2. **Worktree Assignment**: Specialist begins work in designated worktree
3. **Initial Setup**: Module scaffolding and basic structure
4. **Progress Reporting**: Regular updates via MCP coordination system

### Phase 3: Parallel Development
1. **Modular Development**: Each specialist works independently
2. **Cross-team Communication**: Via MCP messaging system
3. **Integration Points**: Coordinated through Nova (Integration specialist)
4. **Quality Gates**: Sage (Testing) validates module interactions

## Communication Protocols

### MCP Coordination System
- **Task Management**: Project tasks distributed across specialists
- **Messaging**: Direct communication between instances
- **Progress Tracking**: Real-time status updates
- **Dependency Coordination**: Cross-module requirement management

### Message Types
- **Status Updates**: Progress reports and milestone completions
- **Dependency Requests**: When modules need coordination
- **Technical Questions**: Architecture clarifications
- **Integration Notices**: Ready for module integration

### Escalation Path
1. **Specialist Level**: Direct communication between related specialists
2. **Phoenix Coordination**: Architecture and dependency conflicts
3. **Project Manager**: Resource allocation and timeline issues

## Quality Assurance

### Testing Strategy
- **Unit Testing**: Each specialist responsible for module tests
- **Integration Testing**: Sage coordinates cross-module testing
- **Performance Testing**: Marcus validates performance targets
- **User Acceptance**: Nova ensures requirements compliance

### Code Review Process
- **Peer Review**: Specialists review related modules
- **Architecture Review**: Phoenix validates design compliance
- **Final Integration**: Nova ensures system coherence

## Recovery and Resilience

### Crash Recovery
- **Individual Recovery**: Each specialist can be relaunched independently
- **Context Restoration**: Phoenix provides technical foundation context
- **Work Continuity**: Git worktrees preserve work state
- **Progress Restoration**: MCP system maintains task history

### Conflict Resolution
- **Technical Conflicts**: Phoenix makes architectural decisions
- **Resource Conflicts**: Project Manager allocates resources
- **Timeline Conflicts**: Adjust sprint planning and priorities

## Success Metrics

### Development Velocity
- **Parallel Efficiency**: Multiple modules progressing simultaneously
- **Reduced Bottlenecks**: Independent worktrees prevent blocking
- **Context Reuse**: Phoenix's foundation accelerates specialist onboarding

### Quality Metrics
- **Module Coherence**: Consistent architecture across specialists
- **Integration Success**: Clean module interfaces and interactions
- **Performance Targets**: Sub-2s loads, 60fps animations maintained

### Coordination Effectiveness
- **Communication Clarity**: Clear, actionable inter-specialist messages
- **Dependency Management**: Smooth coordination of cross-module needs
- **Recovery Speed**: Quick restoration after system interruptions

## Implementation Timeline

### Immediate (Current Sprint)
- Phoenix completes worktree setup
- Specialist launch plan execution
- Initial module scaffolding

### Short-term (1-2 Sprints)
- Core module development begins
- Integration points established
- Testing framework deployed

### Long-term (3+ Sprints)
- Full parallel development active
- Regular integration cycles
- Performance optimization phases

---

*This methodology enables efficient parallel development while maintaining system coherence and quality standards for the Modern Art Portfolio project.*