/**
 * Database Manager Service
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Manages SQLite database initialization, queries, and operations
 */
import Database from 'better-sqlite3';
export declare class DatabaseManager {
    private db;
    private dbPath;
    constructor();
    /**
     * Initialize database connection and run schema
     */
    initialize(): Promise<void>;
    /**
     * Get database instance
     */
    getDb(): Database.Database;
    /**
     * Close database connection
     */
    close(): void;
    getDirectories(filter?: {
        status?: string;
        featured?: boolean;
    }): Promise<unknown[]>;
    getDirectoryBySlug(slug: string): Promise<unknown>;
    createDirectory(data: any): Promise<Database.RunResult>;
    getImagesByDirectory(directoryId: string, limit?: number, offset?: number): Promise<unknown[]>;
    getImageById(id: string): Promise<unknown>;
    createImage(data: any): Promise<Database.RunResult>;
    addReaction(imageId: string, reactionType: string, ipHash: string, sessionId?: string): Promise<Database.RunResult>;
    getReactionCounts(imageId: string): Promise<any>;
    logAnalytics(eventType: string, resourceType: string, resourceId: string, metadata?: any): Promise<Database.RunResult>;
}
