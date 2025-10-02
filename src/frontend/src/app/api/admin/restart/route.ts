import { NextResponse } from 'next/server';

/**
 * Restart Endpoint
 * POST /api/admin/restart
 *
 * Triggers a server restart by exiting the process.
 * When combined with a file watcher (like nodemon or Next.js dev mode),
 * this will cause the server to automatically restart.
 * Only available in development mode for security.
 */
export async function POST() {
  // Security check: Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        error: 'Restart endpoint is not available in production',
      },
      { status: 403 }
    );
  }

  // Schedule restart after sending response
  setTimeout(() => {
    console.log('Restarting server...');
    process.exit(0);
  }, 1000);

  return NextResponse.json(
    {
      success: true,
      message: 'Server restarting in 1 second',
      timestamp: new Date().toISOString(),
      note: 'The server will restart automatically if running with a file watcher (e.g., npm run dev)',
    },
    { status: 200 }
  );
}
