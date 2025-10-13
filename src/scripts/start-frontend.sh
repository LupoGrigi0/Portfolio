#!/bin/bash
# Frontend Server Startup Script
# Starts the Modern Art Portfolio frontend Next.js server
#
# Usage from project root:
#   ./scripts/start-frontend.sh
#
# Usage from anywhere:
#   /path/to/Portfolio/scripts/start-frontend.sh

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Frontend location
FRONTEND_DIR="$PROJECT_ROOT/worktrees/frontend-core/src/frontend"

echo "================================================"
echo "Modern Art Portfolio - Frontend Server"
echo "================================================"
echo "Project Root: $PROJECT_ROOT"
echo "Frontend Dir: $FRONTEND_DIR"
echo ""

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Error: Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

# Navigate to frontend directory
cd "$FRONTEND_DIR" || exit 1

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Using defaults."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the dev server
echo "🚀 Starting frontend server..."
echo ""
npm run dev
