/**
 * Content Management Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * API endpoints for directories, images, and carousels per API Specification
 */
import { Router } from 'express';
import { createLogger } from '../utils/logger-wrapper.js';
import { loadSiteConfig } from '../utils/config-loader.js';
import path from 'path';
const logger = createLogger('backend-content.log');
const router = Router();
// Database manager instance (injected by index.ts on startup)
export let db = null;
export let scanner = null;
export function setDatabaseManager(manager) {
    db = manager;
}
export function setContentScanner(contentScanner) {
    scanner = contentScanner;
}
// Content directory for URL transformation - use site config
const siteConfig = loadSiteConfig();
const CONTENT_DIR = siteConfig.paths.content;
/**
 * Transform absolute file paths to relative API URLs
 * Author: Viktor v2 (Backend API & Database Specialist)
 *
 * Converts: "E:\mnt\lupoportfolio\content\couples\.thumbnails\Hero-image_640w.webp"
 * To: "/api/media/couples/Hero-image.jpg?size=thumbnail"
 *
 * @param absolutePath - Absolute path to file
 * @param slug - Collection slug (unused - extracted from path instead)
 * @param originalFormat - Original file extension (jpg, gif, png, etc.)
 */
function transformImageUrl(absolutePath, slug, originalFormat = 'jpg') {
    // For videos without thumbnails, return a generic video icon
    if (!absolutePath && originalFormat === 'mp4') {
        return '/api/media/icons/video';
    }
    if (!absolutePath)
        return '';
    try {
        // Normalize path separators
        const normalizedPath = absolutePath.replace(/\\/g, '/');
        const normalizedContentDir = CONTENT_DIR.replace(/\\/g, '/');
        // Extract relative path from content directory
        let relativePath = normalizedPath;
        if (normalizedPath.startsWith(normalizedContentDir)) {
            relativePath = normalizedPath.substring(normalizedContentDir.length);
            // Remove leading slash if present
            if (relativePath.startsWith('/')) {
                relativePath = relativePath.substring(1);
            }
        }
        // Parse the path to determine if it's a thumbnail or original
        const parts = relativePath.split('/');
        // Extract the top-level slug from the filesystem path (first part)
        // E.g., "Gynoids/Bugs/hero.jfif" → topLevelSlug = "gynoids"
        const topLevelSlug = parts[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
        // Check if path contains .thumbnails directory
        const isThumbnail = parts.includes('.thumbnails');
        if (isThumbnail) {
            // Extract filename from thumbnail path
            const filename = parts[parts.length - 1]; // e.g., "Hero-image_640w.webp"
            // Detect size from filename suffix
            let size = 'thumbnail'; // default
            if (filename.includes('_828w'))
                size = 'small';
            else if (filename.includes('_1200w'))
                size = 'medium';
            else if (filename.includes('_1920w'))
                size = 'large';
            else if (filename.includes('_2048w'))
                size = 'xlarge';
            else if (filename.includes('_3840w'))
                size = '4k';
            else if (filename.includes('_640w'))
                size = 'thumbnail';
            // Remove size suffix and .webp/.jpg extension to get original filename with correct extension
            // Video thumbnails are .jpg, image thumbnails are .webp
            const originalName = filename
                .replace(/_\d+w/, '') // Remove _640w, _1200w, etc.
                .replace(/\.(webp|jpg)$/, `.${originalFormat}`); // Use actual original format
            // Extract subdirectory path (skip slug, exclude .thumbnails and filename)
            // E.g., "Cafe/Coffee/.thumbnails/image.webp" → subdirectory = "Coffee"
            const subdirectoryParts = parts.slice(1, parts.indexOf('.thumbnails'));
            const subdirectory = subdirectoryParts.length > 0 ? subdirectoryParts.join('/') : '';
            // Construct API URL with size parameter (URL-encode filename)
            const encodedName = encodeURIComponent(originalName);
            if (subdirectory) {
                return `/api/media/${topLevelSlug}/${subdirectory}/${encodedName}?size=${size}`;
            }
            return `/api/media/${topLevelSlug}/${encodedName}?size=${size}`;
        }
        else {
            // Original file - no thumbnail
            const filename = parts[parts.length - 1];
            const encodedFilename = encodeURIComponent(filename);
            // Extract subdirectory path (skip slug and filename)
            // E.g., "Cafe/Coffee/image.jpg" → subdirectory = "Coffee"
            const subdirectoryParts = parts.slice(1, -1);
            const subdirectory = subdirectoryParts.length > 0 ? subdirectoryParts.join('/') : '';
            // Construct API URL (URL-encode filename)
            if (subdirectory) {
                return `/api/media/${topLevelSlug}/${subdirectory}/${encodedFilename}`;
            }
            return `/api/media/${topLevelSlug}/${encodedFilename}`;
        }
    }
    catch (error) {
        logger.error('URL Transformation Error', 'Failed to transform image URL', {
            absolutePath,
            slug,
            error
        });
        // Return empty string on error rather than exposing file paths
        return '';
    }
}
/**
 * GET /api/content/collections
 * Get all collections (directories) for frontend integration
 * Alias for /directories with Zara's preferred response format
 */
router.get('/collections', async (req, res, next) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database manager not initialized',
                code: 'DB_NOT_INITIALIZED'
            });
        }
        await logger.info('ContentRoutes', 'GET /collections');
        const { status } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        const directories = await db.getDirectories(filter);
        // Filter to only top-level collections (parent_category IS NULL)
        const topLevelDirectories = directories.filter((dir) => !dir.parent_category);
        // Format as collections per Zara's spec
        const collections = await Promise.all(topLevelDirectories.map(async (dir) => {
            const tags = JSON.parse(dir.tags || '[]');
            const config = JSON.parse(dir.config || '{}');
            // Get direct subcollections (just slugs)
            const subcollectionObjects = await db.getSubdirectoriesByParentId(dir.id);
            const subcollections = subcollectionObjects.map((sub) => sub.slug);
            // Transform hero image path to API URL
            const heroImageUrl = dir.cover_image ? transformImageUrl(dir.cover_image, dir.slug, path.extname(dir.cover_image).slice(1) || 'jpg') : null;
            return {
                id: dir.id,
                name: dir.title,
                slug: dir.slug,
                heroImage: heroImageUrl,
                hasConfig: Object.keys(config).length > 0,
                imageCount: dir.image_count || 0,
                videoCount: 0, // TODO: Track video count separately
                subcollections,
                description: dir.description,
                featured: Boolean(dir.featured),
                tags,
                config,
            };
        }));
        res.json({
            success: true,
            data: {
                collections,
            },
        });
    }
    catch (error) {
        await logger.error('ContentRoutes', 'GET /collections failed', { error });
        next(error);
    }
});
/**
 * GET /api/content/collections/:slug
 * Get specific collection with full details
 * Supports pagination: ?page=1&limit=20
 * Alias for /directories/:slug with collection format
 */
router.get('/collections/:slug', async (req, res, next) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database manager not initialized',
                code: 'DB_NOT_INITIALIZED'
            });
        }
        const { slug } = req.params;
        // Pagination parameters
        const requestedPage = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
        await logger.info('ContentRoutes', 'GET /collections/:slug', { slug, page: requestedPage, limit });
        const directory = await db.getDirectoryBySlug(slug);
        if (!directory) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found',
                code: 'COLLECTION_NOT_FOUND',
            });
        }
        // Get total count of images
        const allImages = await db.getImagesByDirectory(directory.id);
        const totalImages = allImages.length;
        // Calculate pagination metadata
        const totalPages = Math.max(1, Math.ceil(totalImages / limit));
        // Clamp page to valid range (1 to totalPages)
        const page = Math.max(1, Math.min(requestedPage, totalPages));
        const offset = (page - 1) * limit;
        // Get paginated images
        const paginatedImages = allImages.slice(offset, offset + limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        // Format as collection
        const config = JSON.parse(directory.config || '{}');
        const tags = JSON.parse(directory.tags || '[]');
        // Get direct subcollections (just slugs)
        const subcollectionObjects = await db.getSubdirectoriesByParentId(directory.id);
        const subcollections = subcollectionObjects.map((sub) => sub.slug);
        // Transform hero image path to API URL
        const coverImage = directory.cover_image;
        const heroImageUrl = coverImage ? transformImageUrl(coverImage, slug, path.extname(coverImage).slice(1) || 'jpg') : null;
        const collection = {
            id: directory.id,
            name: directory.title,
            slug: directory.slug,
            heroImage: heroImageUrl,
            description: directory.description,
            imageCount: totalImages,
            videoCount: 0, // TODO: Track video count separately
            config,
            featured: Boolean(directory.featured),
            tags,
            gallery: paginatedImages.map((img) => ({
                id: img.id,
                filename: img.filename,
                title: img.title,
                caption: img.caption,
                type: img.format === 'mp4' ? 'video' : 'image',
                urls: {
                    thumbnail: transformImageUrl(img.thumbnail_url, slug, img.format),
                    small: transformImageUrl(img.small_url, slug, img.format),
                    medium: transformImageUrl(img.medium_url, slug, img.format),
                    large: transformImageUrl(img.large_url, slug, img.format),
                    original: transformImageUrl(img.original_url, slug, img.format),
                },
                dimensions: {
                    width: img.width,
                    height: img.height,
                    aspectRatio: img.aspect_ratio,
                },
                status: img.status,
            })),
            pagination: {
                page,
                limit,
                total: totalImages,
                totalPages,
                hasNext,
                hasPrev,
            },
            subcollections,
        };
        res.json({
            success: true,
            data: {
                collection,
            },
        });
    }
    catch (error) {
        await logger.error('ContentRoutes', 'GET /collections/:slug failed', { error });
        next(error);
    }
});
/**
 * GET /api/content/collections/:slug/images
 * Get paginated images for a collection (lighter response for lazy loading)
 */
router.get('/collections/:slug/images', async (req, res, next) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database manager not initialized',
                code: 'DB_NOT_INITIALIZED'
            });
        }
        const { slug } = req.params;
        // Pagination parameters
        const requestedPage = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
        await logger.info('ContentRoutes', 'GET /collections/:slug/images', { slug, page: requestedPage, limit });
        const directory = await db.getDirectoryBySlug(slug);
        if (!directory) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found',
                code: 'COLLECTION_NOT_FOUND',
            });
        }
        // Get total count of images
        const allImages = await db.getImagesByDirectory(directory.id);
        const totalImages = allImages.length;
        // Calculate pagination metadata
        const totalPages = Math.max(1, Math.ceil(totalImages / limit));
        // Clamp page to valid range (1 to totalPages)
        const page = Math.max(1, Math.min(requestedPage, totalPages));
        const offset = (page - 1) * limit;
        // Get paginated images
        const paginatedImages = allImages.slice(offset, offset + limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        // Format images (lighter response - no collection metadata)
        const formattedImages = paginatedImages.map((img) => ({
            id: img.id,
            filename: img.filename,
            title: img.title,
            caption: img.caption,
            type: img.format === 'mp4' ? 'video' : 'image',
            urls: {
                thumbnail: transformImageUrl(img.thumbnail_url, slug, img.format),
                small: transformImageUrl(img.small_url, slug, img.format),
                medium: transformImageUrl(img.medium_url, slug, img.format),
                large: transformImageUrl(img.large_url, slug, img.format),
                original: transformImageUrl(img.original_url, slug, img.format),
            },
            dimensions: {
                width: img.width,
                height: img.height,
                aspectRatio: img.aspect_ratio,
            },
            status: img.status,
        }));
        res.json({
            success: true,
            data: {
                images: formattedImages,
                pagination: {
                    page,
                    limit,
                    total: totalImages,
                    totalPages,
                    hasNext,
                    hasPrev,
                },
            },
        });
    }
    catch (error) {
        await logger.error('ContentRoutes', 'GET /collections/:slug/images failed', { error });
        next(error);
    }
});
/**
 * GET /api/content/directories
 * Get all portfolio directories
 */
router.get('/directories', async (req, res, next) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database manager not initialized',
                code: 'DB_NOT_INITIALIZED'
            });
        }
        await logger.info('ContentRoutes', 'GET /directories');
        const { status, featured } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (featured !== undefined)
            filter.featured = featured === 'true';
        const directories = await db.getDirectories(filter);
        // Parse JSON fields
        const formattedDirectories = directories.map((dir) => ({
            ...dir,
            tags: JSON.parse(dir.tags || '[]'),
            config: JSON.parse(dir.config || '{}'),
            featured: Boolean(dir.featured),
        }));
        // Get featured directories
        const featuredDirs = formattedDirectories.filter((d) => d.featured);
        // Calculate total images
        const totalImages = formattedDirectories.reduce((sum, d) => sum + (d.image_count || 0), 0);
        res.json({
            success: true,
            data: {
                directories: formattedDirectories,
                featured: featuredDirs,
                totalImages,
            },
        });
    }
    catch (error) {
        await logger.error('ContentRoutes', 'GET /directories failed', { error });
        next(error);
    }
});
/**
 * GET /api/content/directories/:slug
 * Get specific directory with full configuration
 */
router.get('/directories/:slug', async (req, res, next) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database manager not initialized',
                code: 'DB_NOT_INITIALIZED'
            });
        }
        const { slug } = req.params;
        await logger.info('ContentRoutes', 'GET /directories/:slug', { slug });
        const directory = await db.getDirectoryBySlug(slug);
        if (!directory) {
            return res.status(404).json({
                success: false,
                message: 'Directory not found',
                code: 'DIRECTORY_NOT_FOUND',
            });
        }
        // Get images for this directory
        const images = await db.getImagesByDirectory(directory.id);
        // Format directory
        const formattedDirectory = {
            ...directory,
            tags: JSON.parse(directory.tags || '[]'),
            config: JSON.parse(directory.config || '{}'),
            featured: Boolean(directory.featured),
        };
        // Format images
        const formattedImages = images.map((img) => ({
            id: img.id,
            filename: img.filename,
            title: img.title,
            caption: img.caption,
            directoryId: img.directory_id,
            carouselId: img.carousel_id,
            position: img.position,
            urls: {
                thumbnail: img.thumbnail_url,
                small: img.small_url,
                medium: img.medium_url,
                large: img.large_url,
                original: img.original_url,
            },
            dimensions: {
                width: img.width,
                height: img.height,
                aspectRatio: img.aspect_ratio,
            },
            status: img.status,
            createdAt: img.created_at,
            updatedAt: img.updated_at,
        }));
        res.json({
            success: true,
            data: {
                directory: formattedDirectory,
                images: formattedImages,
                carousels: [], // TODO: Implement carousel fetching
                navigation: {
                    // TODO: Implement navigation links
                    prev: null,
                    next: null,
                    parent: null,
                },
            },
        });
    }
    catch (error) {
        await logger.error('ContentRoutes', 'GET /directories/:slug failed', { error });
        next(error);
    }
});
/**
 * GET /api/content/images/:imageId
 * Get specific image with metadata
 */
router.get('/images/:imageId', async (req, res, next) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database manager not initialized',
                code: 'DB_NOT_INITIALIZED'
            });
        }
        const { imageId } = req.params;
        await logger.info('ContentRoutes', 'GET /images/:imageId', { imageId });
        const image = await db.getImageById(imageId);
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found',
                code: 'IMAGE_NOT_FOUND',
            });
        }
        // Get reaction counts for this image
        const reactions = await db.getReactionCounts(imageId);
        // Format image detail
        const imageDetail = {
            id: image.id,
            filename: image.filename,
            title: image.title,
            caption: image.caption,
            directoryId: image.directory_id,
            carouselId: image.carousel_id,
            position: image.position,
            urls: {
                thumbnail: image.thumbnail_url,
                small: image.small_url,
                medium: image.medium_url,
                large: image.large_url,
                original: image.original_url,
            },
            dimensions: {
                width: image.width,
                height: image.height,
                aspectRatio: image.aspect_ratio,
            },
            status: image.status,
            metadata: {
                originalSize: {
                    width: image.width,
                    height: image.height,
                },
                fileSize: image.file_size,
                format: image.format,
                colorPalette: JSON.parse(image.color_palette || '[]'),
                averageColor: image.average_color,
                exif: JSON.parse(image.exif_data || '{}'),
            },
            accessibility: {
                altText: image.alt_text || image.title,
                description: image.caption,
            },
            sharing: {
                directUrl: `${process.env.FRONTEND_URL}/image/${imageId}`,
                // TODO: Implement proper sharing URLs
            },
            createdAt: image.created_at,
            updatedAt: image.updated_at,
        };
        res.json({
            success: true,
            data: {
                image: imageDetail,
                related: [], // TODO: Implement related images
                reactions,
            },
        });
    }
    catch (error) {
        await logger.error('ContentRoutes', 'GET /images/:imageId failed', { error });
        next(error);
    }
});
export default router;
