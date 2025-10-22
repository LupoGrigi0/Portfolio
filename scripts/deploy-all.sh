#!/bin/bash
# Full Stack Deployment Script
# Author: Nova (DevOps Engineer)
# Pulls latest code, rebuilds both services, restarts cleanly

set -e  # Exit on error

COMPOSE_FILE="docker-compose.prod.yml"

echo "🔄 Pulling latest code from git..."
git pull

echo "🏗️  Building both frontend and backend Docker images..."
time docker-compose -f "$COMPOSE_FILE" build

echo "♻️  Restarting all services cleanly..."
docker-compose -f "$COMPOSE_FILE" down
docker-compose -f "$COMPOSE_FILE" up -d

echo "⏳ Waiting for services to start..."
sleep 15

echo "✅ Deployment complete! Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🧪 Testing services..."
echo "Backend API:"
curl -s http://localhost:4000/api/health | jq -r '"  Status: \(.status) | Uptime: \(.uptime)s | Environment: \(.environment)"'

echo "Frontend:"
curl -I https://smoothcurves.art 2>&1 | grep "HTTP" | sed 's/^/  /'

echo "MCP Coordination:"
sudo systemctl status mcp-coordination --no-pager | grep "Active" | sed 's/^/  /'

echo ""
echo "💾 Memory Usage:"
free -h | grep Mem

echo ""
echo "🎉 Full stack deployed successfully!"
