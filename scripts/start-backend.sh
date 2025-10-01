#!/bin/bash
# Backend Server Startup Script
# Starts the Modern Art Portfolio backend API server
#
# Usage from project root:
#   ./scripts/start-backend.sh
#
# Usage from anywhere:
#   /path/to/Portfolio/scripts/start-backend.sh

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Backend location
BACKEND_DIR="$PROJECT_ROOT/worktrees/backend-api/src/backend"

echo "================================================"
echo "Modern Art Portfolio - Backend Server"
echo "================================================"
echo "Project Root: $PROJECT_ROOT"
echo "Backend Dir:  $BACKEND_DIR"
echo ""

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: Backend directory not found at $BACKEND_DIR"
    exit 1
fi

# Navigate to backend directory
cd "$BACKEND_DIR" || exit 1

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
echo "🚀 Starting backend server..."
echo ""
npm run dev
