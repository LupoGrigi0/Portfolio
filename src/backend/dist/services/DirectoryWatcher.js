/**
 * Directory Watcher Service
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Watches file system for new content and triggers processing
 */
import * as chokidar from 'chokidar';
import { createLogger } from '../utils/logger-wrapper.js';
const logger = createLogger('backend-watcher.log');
export class DirectoryWatcher {
    watcher = null;
    contentDirectory;
    constructor() {
        this.contentDirectory = process.env.CONTENT_DIRECTORY || '../content';
    }
    /**
     * Start watching content directory
     */
    async start() {
        try {
            await logger.info('DirectoryWatcher', 'Starting directory watcher', {
                path: this.contentDirectory,
            });
            this.watcher = chokidar.watch(this.contentDirectory, {
                persistent: true,
                ignoreInitial: false,
                followSymlinks: true,
                awaitWriteFinish: {
                    stabilityThreshold: 2000,
                    pollInterval: 100,
                },
            });
            this.watcher
                .on('add', (path) => this.handleFileAdded(path))
                .on('change', (path) => this.handleFileChanged(path))
                .on('unlink', (path) => this.handleFileRemoved(path))
                .on('addDir', (path) => this.handleDirectoryAdded(path))
                .on('unlinkDir', (path) => this.handleDirectoryRemoved(path))
                .on('error', (error) => this.handleError(error));
            await logger.info('DirectoryWatcher', 'Directory watcher started successfully');
        }
        catch (error) {
            await logger.error('DirectoryWatcher', 'Failed to start directory watcher', { error });
            throw error;
        }
    }
    /**
     * Stop watching
     */
    async stop() {
        if (this.watcher) {
            await this.watcher.close();
            await logger.info('DirectoryWatcher', 'Directory watcher stopped');
        }
    }
    async handleFileAdded(path) {
        // Skip thumbnail directory files - they are generated, not source content
        if (path.includes('.thumbnails')) {
            return;
        }
        // Check if it's an image file
        const imageExtensions = (process.env.SUPPORTED_FORMATS || 'jpg,jpeg,png,webp,avif').split(',');
        const ext = path.split('.').pop()?.toLowerCase();
        if (ext && imageExtensions.includes(ext)) {
            await logger.info('DirectoryWatcher', 'New image detected', { path });
            // TODO: Trigger image processing pipeline
        }
        // Check if it's a configuration file
        if (path.endsWith('.json') || path.endsWith('config.json')) {
            await logger.info('DirectoryWatcher', 'Configuration file detected', { path });
            // TODO: Parse and validate configuration
        }
    }
    async handleFileChanged(path) {
        await logger.debug('DirectoryWatcher', 'File changed', { path });
        // TODO: Handle file updates
    }
    async handleFileRemoved(path) {
        await logger.info('DirectoryWatcher', 'File removed', { path });
        // TODO: Handle file deletion
    }
    async handleDirectoryAdded(path) {
        await logger.info('DirectoryWatcher', 'New directory detected', { path });
        // TODO: Scan directory and create database entry
    }
    async handleDirectoryRemoved(path) {
        await logger.info('DirectoryWatcher', 'Directory removed', { path });
        // TODO: Archive directory content
    }
    async handleError(error) {
        await logger.error('DirectoryWatcher', 'Watcher error', { error });
    }
}
