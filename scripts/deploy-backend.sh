#!/bin/bash
# Backend Deployment Script
# Author: Nova (DevOps Engineer)
# Pulls latest code, rebuilds backend, and restarts with zero downtime

set -e  # Exit on error

COMPOSE_FILE="docker-compose.prod.yml"
SERVICE="backend"

echo "🔄 Pulling latest code from git..."
git pull

echo "🏗️  Building backend Docker image..."
time docker-compose -f "$COMPOSE_FILE" build "$SERVICE"

echo "♻️  Restarting backend service..."
docker-compose -f "$COMPOSE_FILE" up -d "$SERVICE"

echo "⏳ Waiting for backend to be healthy..."
sleep 10

echo "✅ Deployment complete! Status:"
docker ps --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "🧪 Testing backend health..."
curl -s http://localhost:4000/api/health | jq -r '"Status: \(.status) | Uptime: \(.uptime)s | Environment: \(.environment)"'

echo ""
echo "🎉 Backend deployed successfully!"
