#!/bin/bash

# Frontend Cache Cleanup Script
# This script clears the Next.js cache and restarts the development server

set -e

echo "Starting frontend cache cleanup..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paths
FRONTEND_DIR="D:/Lupo/Source/Portfolio/worktrees/frontend-core/src/frontend"
NEXT_CACHE_DIR="$FRONTEND_DIR/.next"

# Step 1: Use admin restart endpoint
echo -e "${YELLOW}Step 1: Calling admin restart endpoint...${NC}"
curl -X POST http://localhost:3000/api/admin/restart -H "Content-Type: application/json" 2>&1 || echo "Restart endpoint failed or not available"

# Step 2: Wait for shutdown
echo -e "${YELLOW}Step 2: Waiting 2 seconds for shutdown...${NC}"
sleep 2

# Step 3: Remove .next cache directory
echo -e "${YELLOW}Step 3: Removing .next cache directory...${NC}"
if [ -d "$NEXT_CACHE_DIR" ]; then
    rm -rf "$NEXT_CACHE_DIR"
    echo -e "${GREEN}✓ Cache directory removed${NC}"
else
    echo -e "${GREEN}✓ Cache directory already clean${NC}"
fi

# Step 4: Restart the server
echo -e "${YELLOW}Step 4: Restarting development server...${NC}"
cd "$FRONTEND_DIR"
echo -e "${GREEN}✓ Starting npm run dev...${NC}"
echo -e "${YELLOW}Note: Run 'npm run dev' manually in the frontend directory or this will run in foreground${NC}"

# Uncomment the line below to auto-start the server (will run in foreground)
# npm run dev

echo -e "${GREEN}✓ Cleanup complete!${NC}"
echo -e "${YELLOW}Remember to start the dev server with: cd $FRONTEND_DIR && npm run dev${NC}"
