/**
 * Content Management Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * API endpoints for directories, images, and carousels per API Specification
 */
import { DatabaseManager } from '../services/DatabaseManager.js';
import { ContentScanner } from '../services/ContentScanner.js';
declare const router: import("express-serve-static-core").Router;
export declare let db: DatabaseManager | null;
export declare let scanner: ContentScanner | null;
export declare function setDatabaseManager(manager: DatabaseManager): void;
export declare function setContentScanner(contentScanner: ContentScanner): void;
export default router;
