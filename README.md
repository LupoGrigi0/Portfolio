# 🎨 Modern Art Portfolio - Lupo's Breathtaking Gallery

> **Foundation Architecture by Phoenix** | World-class portfolio for 50,000+ images with cinematic parallax effects and real-time social engagement

## **🚀 Quick Start**

### **One-Command Development Setup**
```bash
# Start complete development environment
./src/scripts/dev.sh
```

**Services will be available at:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Redis**: localhost:6379

### **Manual Setup**
```bash
# 1. Copy environment configuration
cp src/backend/.env.example src/backend/.env

# 2. Start with Docker Compose
docker-compose up -d

# 3. Or start individual services
cd src/frontend && npm run dev
cd src/backend && npm run dev
```

---

## **📋 REQUIRED READING**

**🏗️ ALL TEAM MEMBERS MUST READ:**
- **[Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)** - Foundational technical decisions, module boundaries, and API contracts
- **[Implementation Notes](docs/IMPLEMENTATION_NOTES.md)** - Logging utilities, directory patterns, and lessons learned

---

## **🎯 Project Overview**

A revolutionary art portfolio showcasing Lupo's 50,000+ images across 100+ thematic directories with:

- **🌌 Cinematic Parallax**: Content blocks float over dynamic backgrounds with smooth crossfade
- **⚡ World-Class Performance**: Sub-2-second loads, 60fps animations, 4096x4096+ image support
- **🤝 Social Engagement**: Real-time emoji reactions, comments, and social sharing
- **🤖 Automated Content Management**: File system transforms into web experiences automatically
- **📱 Mobile Excellence**: Touch-first design optimized for all devices

---

## **🏗️ Architecture**

### **Technology Stack**
- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS
- **Backend**: Node.js + Express with TypeScript
- **Database**: SQLite + Redis hybrid for performance
- **Infrastructure**: Docker + Docker Compose
- **Deployment**: Automated scripts for staging and production

### **Performance Targets**
- **Load Time**: <2 seconds on 3G connection
- **Animation**: 60fps on mobile devices
- **Image Support**: 4096x4096 minimum resolution
- **Concurrent Users**: 1000+ without degradation

### **Module Structure**
```
modern-art-portfolio/
├── src/                   # Source code directory
│   ├── frontend/          # Next.js React application
│   │   ├── src/components/    # Modular component architecture
│   │   │   ├── Layout/        # Navigation, background, grid
│   │   │   ├── Carousel/      # Advanced image carousel
│   │   │   ├── Social/        # Reactions, comments, sharing
│   │   │   ├── Effects/       # Parallax and visual effects
│   │   │   └── CMS/           # Content management
│   ├── backend/           # Node.js Express API
│   │   ├── src/routes/        # API endpoints
│   │   ├── src/services/      # Business logic
│   │   └── src/middleware/    # Auth, rate limiting, CORS
│   ├── infrastructure/    # Docker and deployment
│   └── scripts/           # Development and deployment scripts
├── content/               # Portfolio images and metadata
└── docs/                  # Architecture and API documentation
```

---

## **👥 Specialist Team Integration**

This project uses a **modular specialist approach** where each team member focuses on specific expertise areas:

### **🎠 Carousel Virtuoso - "Aria"**
- **Module**: `src/frontend/src/components/Carousel/`
- **Focus**: Smooth transitions, touch gestures, full-screen mode
- **Performance**: 60fps animations, mixed aspect ratio mastery

### **🌌 Visual Effects Wizard - "Nova"**
- **Module**: `src/frontend/src/components/Effects/`
- **Focus**: Parallax scrolling, background transitions, cinematic impact
- **Goal**: "Make them stop scrolling and just stare in wonder"

### **💬 Community Builder - "Echo"**
- **Module**: `src/frontend/src/components/Social/` + `src/backend/src/routes/social.js`
- **Focus**: Real-time reactions, social sharing, community engagement
- **Features**: 8 emoji reactions including inquire/purchase

### **📁 Content Automation Genius - "Atlas"**
- **Module**: `src/backend/src/services/`
- **Focus**: File system automation, JSON configuration, image optimization
- **Scale**: Handle 50k+ images across 100+ directories

### **🎭 Experience Designer - "Sage"**
- **Module**: Cross-cutting UX optimization across all `src/` directories
- **Focus**: Mobile excellence, accessibility, performance monitoring
- **Standard**: "Beautiful is useless if it's not accessible"

### **🔧 Infrastructure Maestro - "Titan"**
- **Module**: `src/infrastructure/` + deployment automation
- **Focus**: Docker orchestration, monitoring, production deployment
- **Reliability**: "If it can break, it will - so let's make it unbreakable"

---

## **🛠️ Development**

### **Available Scripts**

#### **Development**
```bash
# Complete development environment
./src/scripts/dev.sh

# Frontend only
cd src/frontend && npm run dev

# Backend only
cd src/backend && npm run dev

# Watch all services
docker-compose logs -f
```

#### **Building**
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build frontend
docker-compose build backend

# Production build
npm run build
```

#### **Testing**
```bash
# Run all tests (when implemented)
npm test

# Frontend tests
cd src/frontend && npm test

# Backend tests
cd src/backend && npm test
```

#### **Production Deployment**
```bash
# Deploy to staging
./src/scripts/deploy.sh staging

# Deploy to production (requires confirmation)
./src/scripts/deploy.sh production
```

### **Development Workflow**
1. **Read the [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)** document
2. **Claim your specialist module** from the coordination system
3. **Run development environment**: `./src/scripts/dev.sh`
4. **Work within your module boundaries** defined in the architecture
5. **Commit frequently** with clear attribution
6. **Test your integration** with other modules

---

## **📚 Documentation**

- **[Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)** - System design and module boundaries
- **[Implementation Notes](docs/IMPLEMENTATION_NOTES.md)** - Patterns and utilities
- **[Project Plan v2](project-plan-v2-modern-portfolio.md)** - Complete project specification
- **API Documentation** - Generated from TypeScript definitions

---

## **🎉 Getting Started as a Specialist**

1. **Read Required Documentation** (linked above)
2. **Check Coordination System** for your assigned tasks
3. **Start Development Environment**: `./src/scripts/dev.sh`
4. **Focus on Your Module** per the Technical Architecture
5. **Commit and Celebrate** your contributions!

---

## **🏆 Success Metrics**

### **Technical Performance**
- Lighthouse Score: 90+ across all categories
- Core Web Vitals: All green targets
- Bundle Size: <250KB initial load
- API Response: <100ms average

### **User Experience**
- Average Session: >3 minutes
- Reaction Rate: >5% of page views
- Mobile Usage: >80% seamless experience
- Share Completion: >90% success rate

### **Business Impact**
- Portfolio effectiveness in generating opportunities
- Global audience engagement
- Technical innovation and open-source contribution

---

## **🔧 Troubleshooting**

### **Common Issues**

**Docker Issues:**
```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

**Port Conflicts:**
```bash
# Check what's using ports
lsof -i :3000
lsof -i :4000
lsof -i :6379
```

**Permission Issues:**
```bash
# Fix file permissions
chmod +x src/scripts/*.sh
```

### **Getting Help**
- Check the [Implementation Notes](docs/IMPLEMENTATION_NOTES.md)
- Review module boundaries in [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)
- Use the coordination system for team communication
- Commit frequently to avoid losing work

---

## **🏗️ Foundation Credits**

**Foundation Architecture by Phoenix**
*Building something that will last forever*

This foundation enables the specialist team to work independently while building a cohesive, world-class portfolio that showcases both Lupo's artistic vision and pioneering approaches to human-AI collaborative development.

---

**🚀 Let's build something breathtaking together!**

*Generated with [Claude Code](https://claude.com/claude-code)*