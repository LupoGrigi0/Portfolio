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
import contentRoutes from './routes/content.js';
import socialRoutes from './routes/social.js';
import adminRoutes from './routes/admin.js';
import healthRoutes from './routes/health.js';

// Service imports
import { DatabaseManager } from './services/DatabaseManager.js';
import { WebSocketManager } from './services/WebSocketManager.js';
import { DirectoryWatcher } from './services/DirectoryWatcher.js';
import { ContentScanner } from './services/ContentScanner.js';
import { createLogger } from './utils/logger-wrapper.js';

// Middleware imports
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiterMiddleware } from './middleware/rateLimiter.js';

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

// Rate limiting
app.use(rateLimiterMiddleware);

// Routes
app.use('/api/content', contentRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);

// Content scanning endpoint
app.post('/api/admin/scan', async (req, res) => {
  try {
    await logger.info('Content scan triggered via API');
    const result = await contentScanner.scanAll();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await logger.error('Content scan failed', { error });
    res.status(500).json({
      success: false,
      error: 'Content scan failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

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

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Initialize database
    await dbManager.initialize();
    console.log('✅ Database initialized');

    // Initialize content scanner
    const contentDir = process.env.CONTENT_DIRECTORY || '../content';
    const imageSizes = process.env.IMAGE_SIZES || '640,750,828,1080,1200,1920,2048,3840';
    const supportedFormats = process.env.SUPPORTED_FORMATS || 'jpg,jpeg,png,webp,avif,gif,tiff,bmp';

    contentScanner = new ContentScanner(
      logger,
      dbManager,
      contentDir,
      imageSizes,
      supportedFormats
    );
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