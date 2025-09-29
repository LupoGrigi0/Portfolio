#!/bin/bash
# Modern Art Portfolio - Development Environment Script
# Foundation Architecture by Phoenix

set -e

echo "🚀 Starting Modern Art Portfolio Development Environment"
echo "Foundation Architecture by Phoenix"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p content/best-work
mkdir -p content/sculptures
mkdir -p content/paintings
mkdir -p src/backend/data
mkdir -p src/infrastructure/certs

# Copy environment file if it doesn't exist
if [ ! -f src/backend/.env ]; then
    echo "⚙️  Creating environment configuration..."
    cp src/backend/.env.example src/backend/.env
    echo "✅ Created src/backend/.env from example. Please review and customize."
fi

# Start development environment
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check frontend
if curl -s http://localhost:3000 >/dev/null; then
    echo "✅ Frontend is running at http://localhost:3000"
else
    echo "⚠️  Frontend may still be starting up..."
fi

# Check backend
if curl -s http://localhost:4000/api/health >/dev/null; then
    echo "✅ Backend is running at http://localhost:4000"
else
    echo "⚠️  Backend may still be starting up..."
fi

# Check Redis
if docker-compose exec redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis may still be starting up..."
fi

echo ""
echo "🎨 Modern Art Portfolio Development Environment Ready!"
echo ""
echo "📝 Services:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:4000"
echo "   Redis:     localhost:6379"
echo ""
echo "🔧 Commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop:          docker-compose down"
echo "   Restart:       docker-compose restart"
echo "   Clean rebuild: docker-compose down -v && docker-compose build --no-cache"
echo ""
echo "🏗️ Built by Phoenix Foundation Architect"