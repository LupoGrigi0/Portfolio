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
    orphansRemoved?: number;
    errors: string[];
}
type ScanMode = 'full' | 'incremental' | 'lightweight';
export declare class ContentScanner {
    private logger;
    private db;
    private contentDir;
    private imageSizes;
    private prioritySizes;
    private supportedFormats;
    private processing;
    private thumbnailWorkers;
    constructor(logger: Logger, db: DatabaseManager, contentDir: string, imageSizes?: string, supportedFormats?: string);
    /**
     * Scan entire content directory and process all files
     */
    scanAll(): Promise<ScanResult>;
    /**
     * Scan a specific directory by slug
     * @param slug - Directory slug (e.g., "posted", "scientists")
     * @param mode - Scan mode: 'full' (purge & rebuild), 'incremental' (add/update/cleanup), 'lightweight' (filesystem-only)
     */
    scanBySlug(slug: string, mode?: ScanMode): Promise<ScanResult>;
    /**
     * Purge all images for a directory (Full Rescan mode)
     */
    private purgeDirectoryImages;
    /**
     * Remove orphaned images (exist in database but not on filesystem)
     * Used in Incremental mode
     */
    private removeOrphanedImages;
    /**
     * Update image_count for all directories based on actual image count in database
     */
    private updateDirectoryImageCounts;
    /**
     * Auto-detect and set hero images for directories
     * Looks for files named: hero.jpg, hero.png, hero.jfif, Hero-image.jpg, etc.
     */
    private updateHeroImages;
    /**
     * Scan a specific directory and its subdirectories
     * @param dirPath - Path to directory to scan
     * @param parentDirectoryId - Optional parent directory ID for subdirectories
     */
    scanDirectory(dirPath: string, parentDirectoryId?: string): Promise<ScanResult>;
    /**
     * Process a single image file - METADATA ONLY (Phase 1)
     * Fast metadata extraction without thumbnail generation
     */
    processImage(imagePath: string, directoryId: string): Promise<void>;
    /**
     * Generate thumbnails for images (Phase 2)
     * Can be run after metadata scan completes
     */
    generateThumbnailsForDirectory(slug: string): Promise<ScanResult>;
    /**
     * Generate priority thumbnails for a single image
     * Only generates 3 sizes: 1920w, 1200w, 640w
     */
    private generateThumbnailsForImage;
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
     * Uses file stats (size + mtime) for fast change detection
     * Avoids reading entire file into memory
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
