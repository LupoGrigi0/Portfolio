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
  private watcher: chokidar.FSWatcher | null = null;
  private contentDirectory: string;

  constructor() {
    this.contentDirectory = process.env.CONTENT_DIRECTORY || '../content';
  }

  /**
   * Start watching content directory
   */
  async start(): Promise<void> {
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
        .on('add', (path: string) => this.handleFileAdded(path))
        .on('change', (path: string) => this.handleFileChanged(path))
        .on('unlink', (path: string) => this.handleFileRemoved(path))
        .on('addDir', (path: string) => this.handleDirectoryAdded(path))
        .on('unlinkDir', (path: string) => this.handleDirectoryRemoved(path))
        .on('error', (error: unknown) => this.handleError(error as Error));

      await logger.info('DirectoryWatcher', 'Directory watcher started successfully');
    } catch (error) {
      await logger.error('DirectoryWatcher', 'Failed to start directory watcher', { error });
      throw error;
    }
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      await logger.info('DirectoryWatcher', 'Directory watcher stopped');
    }
  }

  private async handleFileAdded(path: string): Promise<void> {
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

  private async handleFileChanged(path: string): Promise<void> {
    await logger.debug('DirectoryWatcher', 'File changed', { path });
    // TODO: Handle file updates
  }

  private async handleFileRemoved(path: string): Promise<void> {
    await logger.info('DirectoryWatcher', 'File removed', { path });
    // TODO: Handle file deletion
  }

  private async handleDirectoryAdded(path: string): Promise<void> {
    await logger.info('DirectoryWatcher', 'New directory detected', { path });
    // TODO: Scan directory and create database entry
  }

  private async handleDirectoryRemoved(path: string): Promise<void> {
    await logger.info('DirectoryWatcher', 'Directory removed', { path });
    // TODO: Archive directory content
  }

  private async handleError(error: Error): Promise<void> {
    await logger.error('DirectoryWatcher', 'Watcher error', { error });
  }
}