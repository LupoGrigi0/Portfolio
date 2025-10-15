/**
 * WebSocket Manager Service
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Manages WebSocket connections for real-time features
 */
import { WebSocketServer } from 'ws';
export interface WSMessage {
    type: string;
    data: any;
    timestamp: string;
    id: string;
}
export declare class WebSocketManager {
    private wss;
    private clients;
    constructor(wss: WebSocketServer);
    private initialize;
    private handleMessage;
    /**
     * Send message to a specific client
     */
    private sendToClient;
    /**
     * Broadcast message to all connected clients
     */
    broadcast(message: WSMessage): void;
    /**
     * Broadcast reaction update
     */
    broadcastReactionUpdate(imageId: string, reactionType: string, newCounts: any): void;
    /**
     * Broadcast content update
     */
    broadcastContentUpdate(directoryId: string, title: string, imageCount: number): void;
    /**
     * Get number of connected clients
     */
    getClientCount(): number;
}
