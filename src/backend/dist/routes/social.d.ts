/**
 * Social Engagement Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * API endpoints for reactions, comments, sharing, and business inquiries
 */
import { DatabaseManager } from '../services/DatabaseManager.js';
declare const router: import("express-serve-static-core").Router;
export declare let db: DatabaseManager | null;
export declare function setDatabaseManager(manager: DatabaseManager): void;
export default router;
