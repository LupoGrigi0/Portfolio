/**
 * WebSocket Manager Service
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Manages WebSocket connections for real-time features
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createLogger } from '../utils/logger-wrapper.js';

const logger = createLogger('backend-websocket.log');

export interface WSMessage {
  type: string;
  data: any;
  timestamp: string;
  id: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.clients = new Set();
    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      logger.info('WebSocketManager', 'Client connected', {
        totalClients: this.clients.size,
      });

      ws.on('message', (message: string) => {
        this.handleMessage(ws, message);
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        logger.info('WebSocketManager', 'Client disconnected', {
          totalClients: this.clients.size,
        });
      });

      ws.on('error', (error) => {
        logger.error('WebSocketManager', 'WebSocket error', { error });
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        data: { message: 'Connected to Modern Art Portfolio WebSocket' },
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      });
    });
  }

  private handleMessage(ws: WebSocket, message: string): void {
    try {
      const parsed = JSON.parse(message);
      logger.debug('WebSocketManager', 'Message received', { message: parsed });

      // Handle different message types
      // TODO: Implement message routing based on type
    } catch (error) {
      logger.error('WebSocketManager', 'Failed to parse message', { error });
    }
  }

  /**
   * Send message to a specific client
   */
  private sendToClient(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: WSMessage): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });

    logger.debug('WebSocketManager', 'Message broadcasted', {
      type: message.type,
      clientCount: this.clients.size,
    });
  }

  /**
   * Broadcast reaction update
   */
  broadcastReactionUpdate(imageId: string, reactionType: string, newCounts: any): void {
    this.broadcast({
      type: 'reaction_updated',
      data: {
        imageId,
        reactionType,
        newCounts,
        animation: 'pulse', // Default animation
      },
      timestamp: new Date().toISOString(),
      id: `reaction-${Date.now()}`,
    });
  }

  /**
   * Broadcast content update
   */
  broadcastContentUpdate(directoryId: string, title: string, imageCount: number): void {
    this.broadcast({
      type: 'directory_published',
      data: {
        directoryId,
        title,
        imageCount,
        notification: 'New artwork collection added!',
      },
      timestamp: new Date().toISOString(),
      id: `content-${Date.now()}`,
    });
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }
}