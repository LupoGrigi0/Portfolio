#!/bin/bash
# Frontend Deployment Script
# Author: Nova (DevOps Engineer)
# Pulls latest code, rebuilds frontend, and restarts

set -e  # Exit on error

COMPOSE_FILE="docker-compose.prod.yml"
SERVICE="frontend"

echo "🔄 Pulling latest code from git..."
git pull

echo "🏗️  Building frontend Docker image (this takes ~1-2 minutes)..."
time docker-compose -f "$COMPOSE_FILE" build "$SERVICE"

echo "♻️  Restarting frontend service..."
docker-compose -f "$COMPOSE_FILE" up -d "$SERVICE"

echo "⏳ Waiting for frontend to start..."
sleep 10

echo "✅ Deployment complete! Status:"
docker ps --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "🧪 Testing frontend..."
curl -I https://smoothcurves.art 2>&1 | grep "HTTP"

echo ""
echo "🎉 Frontend deployed successfully!"
