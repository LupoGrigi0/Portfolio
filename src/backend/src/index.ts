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

// Middleware imports
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize core services
const dbManager = new DatabaseManager();
const wsManager = new WebSocketManager(wss);
const directoryWatcher = new DirectoryWatcher();

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

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Routes
app.use('/api/content', contentRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Initialize database
    await dbManager.initialize();
    console.log('✅ Database initialized');

    // Start directory watcher
    await directoryWatcher.start();
    console.log('✅ Directory watcher started');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🎨 Modern Art Portfolio Backend - Phoenix Foundation`);
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