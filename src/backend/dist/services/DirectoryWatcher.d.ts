/**
 * Directory Watcher Service
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Watches file system for new content and triggers processing
 */
export declare class DirectoryWatcher {
    private watcher;
    private contentDirectory;
    constructor();
    /**
     * Start watching content directory
     */
    start(): Promise<void>;
    /**
     * Stop watching
     */
    stop(): Promise<void>;
    private handleFileAdded;
    private handleFileChanged;
    private handleFileRemoved;
    private handleDirectoryAdded;
    private handleDirectoryRemoved;
    private handleError;
}
