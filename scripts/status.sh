#!/bin/bash
# Production Status Check Script
# Author: Nova (DevOps Engineer)
# Shows status of all services, memory, and health checks

echo "🚀 SmoothCurves Production Status"
echo "=================================="
echo ""

echo "📦 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""

echo "🏥 Health Checks:"
echo "  Backend API:"
curl -s http://localhost:4000/api/health 2>/dev/null | jq -r '"    Status: \(.status) | Uptime: \(.uptime)s | Environment: \(.environment)"' || echo "    ❌ Backend not responding"

echo "  Frontend:"
curl -I https://smoothcurves.art 2>&1 | grep "HTTP" | sed 's/^/    /' || echo "    ❌ Frontend not responding"

echo "  MCP Coordination:"
sudo systemctl status mcp-coordination --no-pager | grep -E "Active|Memory" | head -2 | sed 's/^/    /'

echo ""
echo "💾 System Resources:"
free -h | grep -E "^Mem" | awk '{print "  RAM: "$3" / "$2" used ("int($3/$2*100)"% used, "$7" available)"}'

echo ""
echo "📊 Disk Usage - Content Directory:"
du -sh /mnt/lupoportfolio/content 2>/dev/null | sed 's/^/  /'

echo ""
echo "🌐 Public URLs:"
echo "  Portfolio: https://smoothcurves.art"
echo "  API Docs:  https://smoothcurves.art/api-explorer"
echo "  MCP:       https://smoothcurves.nexus"

echo ""
echo "✅ Status check complete!"
