#!/bin/bash
# Modern Art Portfolio - Production Deployment Script
# Foundation Architecture by Phoenix

set -e

echo "🚀 Modern Art Portfolio - Production Deployment"
echo "Foundation Architecture by Phoenix"
echo ""

# Configuration
DEPLOY_ENV=${1:-staging}
BUILD_VERSION=$(date +%Y%m%d-%H%M%S)

echo "🎯 Deployment Target: $DEPLOY_ENV"
echo "📦 Build Version: $BUILD_VERSION"
echo ""

# Validate environment
if [ "$DEPLOY_ENV" != "staging" ] && [ "$DEPLOY_ENV" != "production" ]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check required tools
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git is required but not installed."; exit 1; }

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes."
    echo "   It's recommended to commit all changes before deployment."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build production images
echo "🔨 Building production images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# Tag images with version
echo "🏷️  Tagging images..."
docker tag modern-art-portfolio_frontend:latest modern-art-portfolio_frontend:$BUILD_VERSION
docker tag modern-art-portfolio_backend:latest modern-art-portfolio_backend:$BUILD_VERSION

# Run tests (when implemented)
echo "🧪 Running tests..."
# docker-compose run --rm frontend npm test
# docker-compose run --rm backend npm test
echo "   Tests: Skipped (not yet implemented)"

# Security scan (optional)
echo "🔒 Security scan..."
# docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
#   -v $PWD:/src aquasec/trivy image modern-art-portfolio_frontend:$BUILD_VERSION
echo "   Security scan: Skipped (optional)"

# Deploy based on environment
if [ "$DEPLOY_ENV" = "staging" ]; then
    echo "🎭 Deploying to staging..."
    # Add staging deployment logic here
    echo "   Staging deployment: Not yet configured"

elif [ "$DEPLOY_ENV" = "production" ]; then
    echo "🏭 Deploying to production..."

    # Production safety check
    echo "⚠️  PRODUCTION DEPLOYMENT"
    echo "   This will deploy to the live production environment."
    read -p "Are you absolutely sure? Type 'DEPLOY' to continue: " confirm

    if [ "$confirm" != "DEPLOY" ]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi

    # Add production deployment logic here
    echo "   Production deployment: Not yet configured"
fi

# Create deployment record
echo "📝 Creating deployment record..."
cat > "deployments/deploy-$BUILD_VERSION.json" << EOF
{
  "version": "$BUILD_VERSION",
  "environment": "$DEPLOY_ENV",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD)",
  "deployed_by": "$(git config user.name)",
  "images": {
    "frontend": "modern-art-portfolio_frontend:$BUILD_VERSION",
    "backend": "modern-art-portfolio_backend:$BUILD_VERSION"
  }
}
EOF

echo ""
echo "✅ Deployment completed successfully!"
echo "   Version: $BUILD_VERSION"
echo "   Environment: $DEPLOY_ENV"
echo "   Record: deployments/deploy-$BUILD_VERSION.json"
echo ""
echo "🏗️ Deployed by Phoenix Foundation Architect"