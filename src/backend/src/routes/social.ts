/**
 * Social Engagement Routes
 * Author: Viktor (Backend API & Database Specialist)
 * Created: 2025-09-29
 *
 * API endpoints for reactions, comments, sharing, and business inquiries
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { DatabaseManager } from '../services/DatabaseManager.js';
import { createLogger } from '../utils/logger-wrapper.js';

const logger = createLogger('backend-social.log');
const router = Router();

// Global database manager instance (will be set by server on startup)
export let dbManager: DatabaseManager | null = null;

export function setDatabaseManager(manager: DatabaseManager) {
  dbManager = manager;
}

// Legacy alias for backwards compatibility
const db = new Proxy({} as DatabaseManager, {
  get(target, prop) {
    if (!dbManager) {
      throw new Error('Database manager not initialized');
    }
    return (dbManager as any)[prop];
  }
});

/**
 * Helper function to hash IP addresses for privacy
 */
function hashIP(ip: string): string {
  return createHash('sha256').update(ip + process.env.IP_SALT || 'default-salt').digest('hex');
}

/**
 * POST /api/social/reactions
 * Add reaction to image
 */
router.post('/reactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId, reactionType, sessionId } = req.body;

    // Validate required fields
    if (!imageId || !reactionType) {
      return res.status(400).json({
        success: false,
        message: 'imageId and reactionType are required',
        code: 'VALIDATION_ERROR',
      });
    }

    // Validate reaction type
    const validReactions = ['like', 'love', 'wow', 'sad', 'hate', 'dislike', 'inquire', 'purchase'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type',
        code: 'INVALID_REACTION_TYPE',
      });
    }

    const ipHash = hashIP(req.ip || 'unknown');

    await logger.info('SocialRoutes', 'POST /reactions', { imageId, reactionType });

    // Add reaction to database
    await db.addReaction(imageId, reactionType, ipHash, sessionId);

    // Get updated reaction counts
    const newCounts = await db.getReactionCounts(imageId);

    // Log analytics
    await db.logAnalytics('reaction', 'image', imageId, {
      reactionType,
      ipHash,
      sessionId,
    });

    res.json({
      success: true,
      data: {
        reaction: {
          id: `${imageId}-${ipHash}-${reactionType}`,
          imageId,
          reactionType,
          ipHash,
          sessionId,
          createdAt: new Date().toISOString(),
        },
        newCounts,
        rateLimit: {
          remaining: 100, // TODO: Implement actual rate limiting
          resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      },
    });
  } catch (error) {
    await logger.error('SocialRoutes', 'POST /reactions failed', { error });
    next(error);
  }
});

/**
 * GET /api/social/reactions/image/:imageId
 * Get reaction counts for specific image
 */
router.get('/reactions/image/:imageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId } = req.params;
    await logger.info('SocialRoutes', 'GET /reactions/image/:imageId', { imageId });

    const counts = await db.getReactionCounts(imageId);

    // Find top reaction
    const topReaction = Object.entries(counts)
      .filter(([key]) => key !== 'total')
      .sort(([, a], [, b]) => (b as number) - (a as number))[0];

    res.json({
      success: true,
      data: {
        imageId,
        counts,
        topReaction: topReaction ? topReaction[0] : null,
        recentActivity: [], // TODO: Implement recent activity tracking
      },
    });
  } catch (error) {
    await logger.error('SocialRoutes', 'GET /reactions/image/:imageId failed', { error });
    next(error);
  }
});

/**
 * POST /api/social/inquiries
 * Submit business inquiry (triggered by inquire/purchase reactions)
 */
router.post('/inquiries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId, inquiryType, contactInfo, message, intendedUse, budget } = req.body;

    // Validate required fields
    if (!imageId || !inquiryType || !contactInfo?.email) {
      return res.status(400).json({
        success: false,
        message: 'imageId, inquiryType, and contactInfo.email are required',
        code: 'VALIDATION_ERROR',
      });
    }

    await logger.info('SocialRoutes', 'POST /inquiries', { imageId, inquiryType });

    // TODO: Insert inquiry into database
    // TODO: Send email notification

    const inquiryId = `inq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      data: {
        inquiryId,
        confirmationCode: inquiryId.substr(-8).toUpperCase(),
        estimatedResponse: 'within 24 hours',
        autoReplyMessage: `Thank you for your ${inquiryType} about this artwork. We'll get back to you within 24 hours.`,
      },
    });
  } catch (error) {
    await logger.error('SocialRoutes', 'POST /inquiries failed', { error });
    next(error);
  }
});

/**
 * POST /api/social/share
 * Generate sharing URLs and track sharing events
 */
router.post('/share', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageId, platform, context } = req.body;

    if (!imageId || !platform) {
      return res.status(400).json({
        success: false,
        message: 'imageId and platform are required',
        code: 'VALIDATION_ERROR',
      });
    }

    await logger.info('SocialRoutes', 'POST /share', { imageId, platform });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/image/${imageId}${context?.carouselId ? `?carousel=${context.carouselId}` : ''}`;

    // Log analytics
    await db.logAnalytics('share', 'image', imageId, {
      platform,
      context,
    });

    res.json({
      success: true,
      data: {
        shareUrl,
        platformSpecific: {
          optimizedImage: `${baseUrl}/api/content/images/${imageId}/og-image`,
          suggestedText: `Check out this amazing artwork from Lupo's Portfolio`,
          hashTags: ['art', 'portfolio', 'artwork'],
        },
        trackingId: `share-${Date.now()}`,
      },
    });
  } catch (error) {
    await logger.error('SocialRoutes', 'POST /share failed', { error });
    next(error);
  }
});

export default router;