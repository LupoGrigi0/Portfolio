/**
 * Media Serving Routes
 * Author: Viktor v2 (Backend API & Database Specialist)
 * Created: 2025-10-01
 *
 * Serves actual image/video files from the content directory via HTTP
 * Supports thumbnail sizes and proper caching headers
 */
declare const router: import("express-serve-static-core").Router;
export default router;
