/**
 * Content Management Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * API endpoints for directories, images, and carousels per API Specification
 */

import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseManager } from '../services/DatabaseManager.js';
import { createLogger } from '../utils/logger-wrapper.js';

const logger = createLogger('backend-content.log');
const router = Router();
const db = new DatabaseManager();

// Initialize database on first use
let dbInitialized = false;
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await db.initialize();
    dbInitialized = true;
  }
}

/**
 * GET /api/content/collections
 * Get all collections (directories) for frontend integration
 * Alias for /directories with Zara's preferred response format
 */
router.get('/collections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDbInitialized();
    await logger.info('ContentRoutes', 'GET /collections');

    const { status } = req.query;
    const filter: any = {};

    if (status) filter.status = status as string;

    const directories = await db.getDirectories(filter);

    // Format as collections per Zara's spec
    const collections = directories.map((dir: any) => {
      const tags = JSON.parse(dir.tags || '[]');
      const config = JSON.parse(dir.config || '{}');

      return {
        id: dir.id,
        name: dir.title,
        slug: dir.slug,
        heroImage: dir.cover_image,
        hasConfig: Object.keys(config).length > 0,
        imageCount: dir.image_count || 0,
        videoCount: 0, // TODO: Track video count separately
        subcollections: [], // TODO: Implement hierarchical collections
        description: dir.description,
        featured: Boolean(dir.featured),
        tags,
        config,
      };
    });

    res.json({
      success: true,
      data: {
        collections,
      },
    });
  } catch (error) {
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
router.get('/collections/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDbInitialized();
    const { slug } = req.params;

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // Max 50 per page
    const offset = (page - 1) * limit;

    await logger.info('ContentRoutes', 'GET /collections/:slug', { slug, page, limit });

    const directory = await db.getDirectoryBySlug(slug);

    if (!directory) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND',
      });
    }

    // Get total count of images
    const allImages = await db.getImagesByDirectory((directory as any).id);
    const totalImages = allImages.length;

    // Get paginated images
    const paginatedImages = allImages.slice(offset, offset + limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalImages / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Format as collection
    const config = JSON.parse((directory as any).config || '{}');
    const tags = JSON.parse((directory as any).tags || '[]');

    const collection = {
      id: (directory as any).id,
      name: (directory as any).title,
      slug: (directory as any).slug,
      heroImage: (directory as any).cover_image,
      description: (directory as any).description,
      config,
      featured: Boolean((directory as any).featured),
      tags,
      gallery: paginatedImages.map((img: any) => ({
        id: img.id,
        filename: img.filename,
        title: img.title,
        caption: img.caption,
        type: img.format === 'mp4' ? 'video' : 'image',
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
      })),
      pagination: {
        page,
        limit,
        total: totalImages,
        totalPages,
        hasNext,
        hasPrev,
      },
      subcollections: [], // TODO: Implement hierarchical structure
    };

    res.json({
      success: true,
      data: {
        collection,
      },
    });
  } catch (error) {
    await logger.error('ContentRoutes', 'GET /collections/:slug failed', { error });
    next(error);
  }
});

/**
 * GET /api/content/collections/:slug/images
 * Get paginated images for a collection (lighter response for lazy loading)
 */
router.get('/collections/:slug/images', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDbInitialized();
    const { slug } = req.params;

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // Max 50 per page
    const offset = (page - 1) * limit;

    await logger.info('ContentRoutes', 'GET /collections/:slug/images', { slug, page, limit });

    const directory = await db.getDirectoryBySlug(slug);

    if (!directory) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
        code: 'COLLECTION_NOT_FOUND',
      });
    }

    // Get total count of images
    const allImages = await db.getImagesByDirectory((directory as any).id);
    const totalImages = allImages.length;

    // Get paginated images
    const paginatedImages = allImages.slice(offset, offset + limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalImages / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Format images (lighter response - no collection metadata)
    const formattedImages = paginatedImages.map((img: any) => ({
      id: img.id,
      filename: img.filename,
      title: img.title,
      caption: img.caption,
      type: img.format === 'mp4' ? 'video' : 'image',
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
  } catch (error) {
    await logger.error('ContentRoutes', 'GET /collections/:slug/images failed', { error });
    next(error);
  }
});

/**
 * GET /api/content/directories
 * Get all portfolio directories
 */
router.get('/directories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logger.info('ContentRoutes', 'GET /directories');

    const { status, featured } = req.query;
    const filter: any = {};

    if (status) filter.status = status as string;
    if (featured !== undefined) filter.featured = featured === 'true';

    const directories = await db.getDirectories(filter);

    // Parse JSON fields
    const formattedDirectories = directories.map((dir: any) => ({
      ...dir,
      tags: JSON.parse(dir.tags || '[]'),
      config: JSON.parse(dir.config || '{}'),
      featured: Boolean(dir.featured),
    }));

    // Get featured directories
    const featuredDirs = formattedDirectories.filter((d: any) => d.featured);

    // Calculate total images
    const totalImages = formattedDirectories.reduce((sum: number, d: any) => sum + (d.image_count || 0), 0);

    res.json({
      success: true,
      data: {
        directories: formattedDirectories,
        featured: featuredDirs,
        totalImages,
      },
    });
  } catch (error) {
    await logger.error('ContentRoutes', 'GET /directories failed', { error });
    next(error);
  }
});

/**
 * GET /api/content/directories/:slug
 * Get specific directory with full configuration
 */
router.get('/directories/:slug', async (req: Request, res: Response, next: NextFunction) => {
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
    const images = await db.getImagesByDirectory((directory as any).id);

    // Format directory
    const formattedDirectory = {
      ...(directory as any),
      tags: JSON.parse((directory as any).tags || '[]'),
      config: JSON.parse((directory as any).config || '{}'),
      featured: Boolean((directory as any).featured),
    };

    // Format images
    const formattedImages = images.map((img: any) => ({
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
  } catch (error) {
    await logger.error('ContentRoutes', 'GET /directories/:slug failed', { error });
    next(error);
  }
});

/**
 * GET /api/content/images/:imageId
 * Get specific image with metadata
 */
router.get('/images/:imageId', async (req: Request, res: Response, next: NextFunction) => {
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
      id: (image as any).id,
      filename: (image as any).filename,
      title: (image as any).title,
      caption: (image as any).caption,
      directoryId: (image as any).directory_id,
      carouselId: (image as any).carousel_id,
      position: (image as any).position,
      urls: {
        thumbnail: (image as any).thumbnail_url,
        small: (image as any).small_url,
        medium: (image as any).medium_url,
        large: (image as any).large_url,
        original: (image as any).original_url,
      },
      dimensions: {
        width: (image as any).width,
        height: (image as any).height,
        aspectRatio: (image as any).aspect_ratio,
      },
      status: (image as any).status,
      metadata: {
        originalSize: {
          width: (image as any).width,
          height: (image as any).height,
        },
        fileSize: (image as any).file_size,
        format: (image as any).format,
        colorPalette: JSON.parse((image as any).color_palette || '[]'),
        averageColor: (image as any).average_color,
        exif: JSON.parse((image as any).exif_data || '{}'),
      },
      accessibility: {
        altText: (image as any).alt_text || (image as any).title,
        description: (image as any).caption,
      },
      sharing: {
        directUrl: `${process.env.FRONTEND_URL}/image/${imageId}`,
        // TODO: Implement proper sharing URLs
      },
      createdAt: (image as any).created_at,
      updatedAt: (image as any).updated_at,
    };

    res.json({
      success: true,
      data: {
        image: imageDetail,
        related: [], // TODO: Implement related images
        reactions,
      },
    });
  } catch (error) {
    await logger.error('ContentRoutes', 'GET /images/:imageId failed', { error });
    next(error);
  }
});

export default router;