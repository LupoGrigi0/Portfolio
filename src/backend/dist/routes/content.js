/**
 * Content Management Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * API endpoints for directories, images, and carousels per API Specification
 */
import { Router } from 'express';
import { DatabaseManager } from '../services/DatabaseManager.js';
import { createLogger } from '../utils/logger-wrapper.js';
const logger = createLogger('backend-content.log');
const router = Router();
const db = new DatabaseManager();
/**
 * GET /api/content/directories
 * Get all portfolio directories
 */
router.get('/directories', async (req, res, next) => {
    try {
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
