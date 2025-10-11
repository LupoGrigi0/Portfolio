/**
 * Database Manager Service
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * Manages SQLite database initialization, queries, and operations
 */
import Database from 'better-sqlite3';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/logger-wrapper.js';
const logger = createLogger('backend-database.log');
const __dirname = dirname(fileURLToPath(import.meta.url));
export class DatabaseManager {
    db = null;
    dbPath;
    constructor() {
        this.dbPath = process.env.DATABASE_PATH || './data/portfolio.sqlite';
    }
    /**
     * Initialize database connection and run schema
     */
    async initialize() {
        try {
            await logger.info('DatabaseManager', 'Initializing database connection');
            // Create database connection
            this.db = new Database(this.dbPath);
            // Enable foreign keys
            this.db.pragma('foreign_keys = ON');
            // Load and execute schema
            const schemaPath = join(__dirname, '../database/schema.sql');
            const schema = await readFile(schemaPath, 'utf-8');
            // Execute schema
            this.db.exec(schema);
            await logger.info('DatabaseManager', 'Database initialized successfully', {
                path: this.dbPath,
            });
        }
        catch (error) {
            await logger.error('DatabaseManager', 'Failed to initialize database', { error });
            throw error;
        }
    }
    /**
     * Get database instance
     */
    getDb() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db;
    }
    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            logger.info('DatabaseManager', 'Database connection closed');
        }
    }
    // Directory operations
    async getDirectories(filter) {
        const db = this.getDb();
        let query = 'SELECT * FROM directories';
        const conditions = [];
        const params = [];
        if (filter?.status) {
            conditions.push('status = ?');
            params.push(filter.status);
        }
        if (filter?.featured !== undefined) {
            conditions.push('featured = ?');
            params.push(filter.featured ? 1 : 0);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY menu_order ASC, created_at DESC';
        return db.prepare(query).all(...params);
    }
    async getDirectoryBySlug(slug) {
        const db = this.getDb();
        return db.prepare('SELECT * FROM directories WHERE slug = ?').get(slug);
    }
    async createDirectory(data) {
        const db = this.getDb();
        const stmt = db.prepare(`
      INSERT INTO directories (
        id, title, subtitle, description, slug, cover_image, image_count,
        last_modified, featured, menu_order, status, parent_category, tags, config
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(data.id, data.title, data.subtitle || null, data.description || null, data.slug, data.coverImage || null, data.imageCount || 0, data.lastModified || new Date().toISOString(), data.featured ? 1 : 0, data.menuOrder || 0, data.status || 'draft', data.parentCategory || null, JSON.stringify(data.tags || []), JSON.stringify(data.config || {}));
    }
    async updateDirectoryMetadata(directoryId, metadata) {
        const db = this.getDb();
        // Get current config
        const dir = db.prepare('SELECT config FROM directories WHERE id = ?').get(directoryId);
        const currentConfig = dir ? JSON.parse(dir.config || '{}') : {};
        // Merge new metadata with existing config
        const updatedConfig = { ...currentConfig, ...metadata };
        const stmt = db.prepare('UPDATE directories SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        return stmt.run(JSON.stringify(updatedConfig), directoryId);
    }
    async updateDirectoryImageCount(directoryId, imageCount) {
        const db = this.getDb();
        const stmt = db.prepare(`
      UPDATE directories
      SET image_count = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
        return stmt.run(imageCount, directoryId);
    }
    async updateDirectoryCoverImage(directoryId, coverImagePath) {
        const db = this.getDb();
        const stmt = db.prepare(`
      UPDATE directories
      SET cover_image = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
        return stmt.run(coverImagePath, directoryId);
    }
    // Image operations
    async getImagesByDirectory(directoryId, limit, offset) {
        const db = this.getDb();
        // If no limit specified, return all images
        if (limit === undefined) {
            return db
                .prepare('SELECT * FROM images WHERE directory_id = ? AND status = ? ORDER BY position ASC')
                .all(directoryId, 'published');
        }
        // If limit specified, apply pagination
        return db
            .prepare('SELECT * FROM images WHERE directory_id = ? AND status = ? ORDER BY position ASC LIMIT ? OFFSET ?')
            .all(directoryId, 'published', limit, offset || 0);
    }
    async getImageById(id) {
        const db = this.getDb();
        return db.prepare('SELECT * FROM images WHERE id = ?').get(id);
    }
    async getImageByPath(path) {
        const db = this.getDb();
        // Store path in exif_data JSON for now, or could add dedicated column
        return db.prepare("SELECT * FROM images WHERE json_extract(exif_data, '$.path') = ?").get(path);
    }
    async updateImage(id, data) {
        const db = this.getDb();
        const stmt = db.prepare(`
      UPDATE images SET
        filename = ?, title = ?, caption = ?, directory_id = ?,
        thumbnail_url = ?, small_url = ?, medium_url = ?, large_url = ?, original_url = ?,
        width = ?, height = ?, aspect_ratio = ?, file_size = ?, format = ?,
        color_palette = ?, average_color = ?, status = ?, alt_text = ?, exif_data = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
        return stmt.run(data.filename, data.title, data.caption || null, data.directoryId, data.thumbnailUrl || null, data.smallUrl || null, data.mediumUrl || null, data.largeUrl || null, data.originalUrl || null, data.width || null, data.height || null, data.aspectRatio || null, data.fileSize || null, data.format || null, JSON.stringify(data.colorPalette || []), data.averageColor || null, data.status || 'processing', data.altText || null, JSON.stringify(data.exifData || {}), id);
    }
    async createImage(data) {
        const db = this.getDb();
        const stmt = db.prepare(`
      INSERT INTO images (
        id, filename, title, caption, directory_id, carousel_id, position,
        thumbnail_url, small_url, medium_url, large_url, original_url,
        width, height, aspect_ratio, file_size, format,
        color_palette, average_color, status, alt_text, exif_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(data.id, data.filename, data.title, data.caption || null, data.directoryId, data.carouselId || null, data.position || 0, data.thumbnailUrl || null, data.smallUrl || null, data.mediumUrl || null, data.largeUrl || null, data.originalUrl || null, data.width || null, data.height || null, data.aspectRatio || null, data.fileSize || null, data.format || null, JSON.stringify(data.colorPalette || []), data.averageColor || null, data.status || 'processing', data.altText || null, JSON.stringify(data.exifData || {}));
    }
    async deleteImage(id) {
        const db = this.getDb();
        const stmt = db.prepare('DELETE FROM images WHERE id = ?');
        return stmt.run(id);
    }
    // Reaction operations
    async addReaction(imageId, reactionType, ipHash, sessionId) {
        const db = this.getDb();
        const stmt = db.prepare(`
      INSERT OR REPLACE INTO reactions (id, image_id, reaction_type, ip_hash, session_id)
      VALUES (?, ?, ?, ?, ?)
    `);
        const id = `${imageId}-${ipHash}-${reactionType}`;
        return stmt.run(id, imageId, reactionType, ipHash, sessionId || null);
    }
    async getReactionCounts(imageId) {
        const db = this.getDb();
        const results = db
            .prepare('SELECT reaction_type, COUNT(*) as count FROM reactions WHERE image_id = ? GROUP BY reaction_type')
            .all(imageId);
        // Initialize all reaction types with 0
        const counts = {
            like: 0,
            love: 0,
            wow: 0,
            sad: 0,
            hate: 0,
            dislike: 0,
            inquire: 0,
            purchase: 0,
            total: 0,
        };
        // Fill in actual counts
        for (const row of results) {
            counts[row.reaction_type] = row.count;
            counts.total += row.count;
        }
        return counts;
    }
    // Analytics operations
    async logAnalytics(eventType, resourceType, resourceId, metadata = {}) {
        const db = this.getDb();
        const stmt = db.prepare(`
      INSERT INTO analytics (event_type, resource_type, resource_id, ip_hash, session_id, user_agent, referrer, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(eventType, resourceType, resourceId, metadata.ipHash || null, metadata.sessionId || null, metadata.userAgent || null, metadata.referrer || null, JSON.stringify(metadata));
    }
}
