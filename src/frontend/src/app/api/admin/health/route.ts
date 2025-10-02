import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * GET /api/admin/health
 *
 * Returns the health status of the frontend server.
 */
export async function GET() {
  const healthData = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  return NextResponse.json(healthData, { status: 200 });
}
