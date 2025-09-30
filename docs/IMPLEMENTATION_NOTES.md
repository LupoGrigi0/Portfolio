# 🔧 Implementation Notes - Foundation Architecture

> **By Phoenix Foundation Architect** | Implementation guidance and learned patterns

## **IMPORTANT: Logging & Instrumentation**

**🚨 DO NOT RE-INVENT THE WHEEL**

When implementing logging, instrumentation, telemetry, and debugging systems:

**USE THE EXISTING LOGGER.JS** from the Human-Adjacent-Coordination system source directory.

- **Location**: Check Human-Adjacent-Coordination system source directory for `logger.js`
- **Proven**: This logging utility has been battle-tested across multiple projects
- **Features**: Comprehensive logging capabilities already implemented
- **Integration**: Designed for the Human-Adjacent AI methodology

**Action Item**: When reaching instrumentation phase, grab `logger.js` from coordination system rather than building new logging infrastructure.

---

## **Directory Structure Best Practice**

**SOURCE SUBDIRECTORY PATTERN**

Based on lessons learned from several other projects, using a "source" subdirectory structure provides significant benefits:

### Current Structure:
```
backend/src/
frontend/src/
```

### Benefits:
- **Clear separation** of source code from configuration/build artifacts
- **Consistent patterns** across multiple project types
- **Build tool compatibility** - most tools expect `/src` structure
- **Team familiarity** - established pattern from other successful projects

### Applied to Portfolio Project:
- ✅ **Frontend**: Already using Next.js standard `/src` structure
- ✅ **Backend**: Implemented with `/src` subdirectory for TypeScript source
- 🔄 **Infrastructure**: Docker configs in `/infrastructure` (separate from source)

---

## **Git Workflow & Attribution**

### Commit Standards:
- **Commit often** - Don't wait for large batches
- **Sign your work** - Take credit and establish ownership/responsibility
- **Descriptive messages** - Include context about decisions made
- **Team attribution** - Use Co-Authored-By for collaboration

### Example Commit Pattern:
```bash
git commit -m "feat: Foundation Architecture & Project Structure

🏗️ FOUNDATION ARCHITECT: Phoenix - Initial project setup

## Key Deliverables:
- Technical Architecture document
- Modular component structure
- Docker development environment

Signed-off-by: Phoenix Foundation Architect <phoenix@lupo-portfolio.dev>"
```

---

## **Development Workflow & Tools**

### Backend Development Server

**Auto-Restart Development Environment**:

The backend uses `tsx` with watch mode for automatic TypeScript compilation and server restart:

```bash
cd src/backend
npm run dev  # Starts tsx watch mode
```

**Why tsx instead of ts-node?**
- **Better ESM support** - Handles ES modules with TypeScript seamlessly
- **Faster restart** - Hot reload without full recompilation
- **Native watch mode** - Built-in file watching, no need for nodemon
- **Cross-platform** - Consistent behavior on Windows/Linux/macOS

### Graceful Shutdown for Development

**Problem**: During development, you often need to restart the backend server to pick up configuration changes or clear state.

**Solution**: Development-only graceful shutdown endpoint

```typescript
POST http://localhost:4000/api/admin/shutdown
```

**How it works**:
1. Endpoint checks `process.env.NODE_ENV !== 'production'`
2. Sends success response to client
3. Waits 500ms for response to send
4. Calls `process.exit(0)` to terminate cleanly
5. `tsx watch` detects the exit and automatically restarts the server

**Usage Example**:
```bash
# Terminal 1: Start backend with auto-restart
cd src/backend
npm run dev

# Terminal 2: Trigger restart when needed
curl -X POST http://localhost:4000/api/admin/shutdown

# Server will shut down gracefully and tsx watch restarts it
```

**Security**:
- Only available in development (`NODE_ENV !== 'production'`)
- Returns 403 Forbidden in production
- Never exposes this endpoint in production builds

### Multi-Port CORS Configuration

**Development Scenario**: Multiple team members running frontend instances on different ports simultaneously.

**Configuration** (`src/backend/src/index.ts`):
```typescript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3002',  // Alternative frontend port
  'http://localhost:3003',  // Additional testing port
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

**Benefits**:
- **Parallel development** - Multiple frontend instances can run simultaneously
- **Testing flexibility** - Test different frontend configurations against same backend
- **API testing tools** - Postman/curl/Insomnia work without origin headers

**Adding ports**: Edit the `allowedOrigins` array in `src/backend/src/index.ts`

---

## **Architecture Decision Records**

### Technology Stack Decisions:

**Why "source" subdirectory?**
- **Learned from previous projects** - Consistent success pattern
- **Build tool expectations** - Most tooling assumes `/src` structure
- **Team productivity** - Familiar patterns reduce cognitive load

**Why existing logger.js?**
- **Battle-tested** - Already proven in coordination system
- **Feature complete** - Avoid rebuilding solved problems
- **Integration ready** - Designed for this methodology

**Why Docker-first?**
- **Development consistency** - Same environment from local to production
- **Team onboarding** - Single command environment setup
- **Deployment simplicity** - Container-based deployment strategy

---

## **Team Integration Notes**

### For Specialist Teams:
- **Aria (Carousel)**: Use `/frontend/src/components/Carousel/` as module boundary
- **Nova (Effects)**: Use `/frontend/src/components/Effects/` as module boundary
- **Echo (Social)**: Use `/frontend/src/components/Social/` as module boundary
- **Atlas (CMS)**: Use `/backend/src/services/` for content management
- **Sage (UX)**: Cross-cutting concerns across all `/src` directories
- **Titan (Infrastructure)**: Focus on `/infrastructure` and deployment scripts

### Module Boundaries:
Each specialist works within their assigned `/src` subdirectory with clear API contracts defined in the Technical Architecture document.

---

## **Lessons Learned Integration**

### From Coordination System Projects:
1. **Logger utility reuse** - Don't rebuild logging infrastructure
2. **Source directory patterns** - Consistent structure improves team productivity
3. **Frequent commits** - Prevents work loss and enables better collaboration
4. **Clear attribution** - Signing work helps track decisions and expertise

### Applied to Portfolio:
- ✅ Using proven directory structure patterns
- ✅ Planning to integrate existing logging utility
- ✅ Implementing frequent commit workflow
- ✅ Clear module boundaries for specialist integration

---

*Implementation notes will be updated as the project evolves and additional patterns are discovered.*

**Context Status**: 🟢 Fresh (~65k/200k tokens) - claude-code-Foundation-Phoenix-2025-09-29