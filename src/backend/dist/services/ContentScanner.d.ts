/**
 * Content Scanner Service
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-30
 *
 * Scans content directories, processes files, extracts metadata,
 * generates thumbnails, and manages database entries.
 */
import type { Logger } from '../utils/logger-wrapper.js';
import type { DatabaseManager } from './DatabaseManager.js';
interface ScanResult {
    imagesProcessed: number;
    thumbnailsGenerated: number;
    directoriesCreated: number;
    configsApplied: number;
    errors: string[];
}
export declare class ContentScanner {
    private logger;
    private db;
    private contentDir;
    private imageSizes;
    private supportedFormats;
    private processing;
    constructor(logger: Logger, db: DatabaseManager, contentDir: string, imageSizes?: string, supportedFormats?: string);
    /**
     * Scan entire content directory and process all files
     */
    scanAll(): Promise<ScanResult>;
    /**
     * Scan a specific directory and its subdirectories
     */
    scanDirectory(dirPath: string): Promise<ScanResult>;
    /**
     * Process a single image file
     */
    processImage(imagePath: string, directoryId: string): Promise<void>;
    /**
     * Process a video file (metadata only, no thumbnail generation yet)
     */
    processVideo(videoPath: string, directoryId: string): Promise<void>;
    /**
     * Process document files (.md, .txt)
     */
    processDocument(docPath: string, directoryId: string): Promise<void>;
    /**
     * Extract image metadata using Sharp
     */
    private extractImageMetadata;
    /**
     * Generate thumbnail at specified width
     */
    private generateThumbnail;
    /**
     * Generate file hash for change detection
     */
    private generateFileHash;
    /**
     * Ensure directory exists in database
     */
    private ensureDirectory;
    /**
     * Generate directory config from path
     */
    private generateDirectoryConfig;
    /**
     * Generate slug from directory path
     */
    private generateSlug;
    /**
     * Generate directory ID from path
     */
    private generateDirectoryId;
    /**
     * Extract title from filename/path
     */
    private extractTitle;
    /**
     * Format string as title
     */
    private formatTitle;
}
export {};
