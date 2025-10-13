/**
 * Modern Art Portfolio - Backend Server
 * Foundation Architecture by Phoenix
 *
 * Entry point for the Express.js backend server
 * Handles content management, social features, and real-time updates
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Route imports
import contentRoutes, { setDatabaseManager as setContentDb, setContentScanner as setContentScannerForContent } from './routes/content.js';
import socialRoutes, { setDatabaseManager as setSocialDb } from './routes/social.js';
import adminRoutes, { setContentScanner, setDatabaseManager as setAdminDb } from './routes/admin.js';
import thumbnailRoutes, { setDatabaseManager as setThumbnailDb } from './routes/thumbnails.js';
import siteRoutes from './routes/site.js';
import healthRoutes from './routes/health.js';
import mediaRoutes from './routes/media.js';

// Service imports
import { DatabaseManager } from './services/DatabaseManager.js';
import { WebSocketManager } from './services/WebSocketManager.js';
import { DirectoryWatcher } from './services/DirectoryWatcher.js';
import { ContentScanner } from './services/ContentScanner.js';
import { createLogger } from './utils/logger-wrapper.js';

// Middleware imports
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiterMiddleware, adminRateLimiterMiddleware } from './middleware/rateLimiter.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize core services
const logger = createLogger('backend-server.log');
const dbManager = new DatabaseManager();
const wsManager = new WebSocketManager(wss);
const directoryWatcher = new DirectoryWatcher();

// ContentScanner will be initialized after database
let contentScanner: ContentScanner;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// CORS configuration - support multiple frontend ports
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to specific routes (not globally)
// Admin endpoints get separate rate limiter with higher limits
app.use('/api/admin', adminRateLimiterMiddleware);
app.use('/api/thumbnails', adminRateLimiterMiddleware); // Thumbnails use admin rate limits
app.use('/api/content', rateLimiterMiddleware);
app.use('/api/social', rateLimiterMiddleware);
app.use('/api/media', rateLimiterMiddleware);

// Routes (rate limiting already applied above)
app.use('/api/content', contentRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/thumbnails', thumbnailRoutes);
app.use('/api/site', siteRoutes); // No rate limiting on site config
app.use('/api/health', healthRoutes); // No rate limiting on health checks
app.use('/api/media', mediaRoutes);

// Graceful shutdown endpoint (development only)
app.post('/api/admin/shutdown', async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isDev) {
    return res.status(403).json({
      success: false,
      error: 'Shutdown endpoint only available in development mode'
    });
  }

  await logger.info('Graceful shutdown initiated via API');

  res.json({
    success: true,
    message: 'Server shutting down...'
  });

  // Give response time to send, then exit
  setTimeout(() => {
    console.log('🔄 Shutting down gracefully...');
    process.exit(0);
  }, 500);
});

// Dev convenience: GET version of shutdown for browser testing
app.get('/api/admin/shutdown', async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isDev) {
    return res.status(403).json({
      success: false,
      error: 'Shutdown endpoint only available in development mode'
    });
  }

  await logger.info('Graceful shutdown initiated via API (dev convenience)');

  res.json({
    success: true,
    message: 'Server shutting down...'
  });

  // Give response time to send, then exit
  setTimeout(() => {
    console.log('🔄 Shutting down gracefully...');
    process.exit(0);
  }, 500);
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Initialize database
    await dbManager.initialize();
    console.log('✅ Database initialized');

    // Inject DatabaseManager into route modules
    setContentDb(dbManager);
    setSocialDb(dbManager);
    setAdminDb(dbManager);
    setThumbnailDb(dbManager);
    console.log('✅ Database manager injected into routes');

    // Initialize content scanner
    const contentDir = process.env.CONTENT_DIRECTORY || '../content';
    const imageSizes = process.env.IMAGE_SIZES || '640,750,828,1080,1200,1920,2048,3840';
    const supportedFormats = process.env.SUPPORTED_FORMATS || 'jpg,jpeg,jfif,png,webp,avif,gif,tiff,bmp';

    contentScanner = new ContentScanner(
      logger,
      dbManager,
      contentDir,
      imageSizes,
      supportedFormats
    );
    setContentScanner(contentScanner);
    setContentScannerForContent(contentScanner);
    console.log('✅ Content scanner initialized');

    // Start directory watcher
    await directoryWatcher.start();
    console.log('✅ Directory watcher started');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🎨 Modern Art Portfolio Backend - Viktor (Backend API Specialist)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Graceful shutdown initiated');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

startServer();