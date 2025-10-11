/**
 * Admin Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Administrative endpoints for content management
 */
import { DatabaseManager } from '../services/DatabaseManager.js';
import { ContentScanner } from '../services/ContentScanner.js';
declare const router: import("express-serve-static-core").Router;
export declare let contentScanner: ContentScanner | null;
export declare let dbManager: DatabaseManager | null;
export declare function setContentScanner(scanner: ContentScanner): void;
export declare function setDatabaseManager(manager: DatabaseManager): void;
export default router;
