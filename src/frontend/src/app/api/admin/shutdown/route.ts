import { NextResponse } from 'next/server';

/**
 * Shutdown Endpoint
 * POST /api/admin/shutdown
 *
 * Gracefully shuts down the frontend server.
 * Only available in development mode for security.
 */
export async function POST() {
  // Security check: Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        error: 'Shutdown endpoint is not available in production',
      },
      { status: 403 }
    );
  }

  // Schedule shutdown after sending response
  setTimeout(() => {
    console.log('Shutting down server...');
    process.exit(0);
  }, 1000);

  return NextResponse.json(
    {
      success: true,
      message: 'Server shutting down in 1 second',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
