/**
 * API Client for Backend Content Service
 *
 * Wrapper for Viktor's backend API endpoints.
 * Provides type-safe access to content, collections, and media.
 *
 * @author Zara (UI/UX & React Components Specialist)
 * @created 2025-09-30
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  filename: string;
  path: string;
  thumbnailPath?: string;
  metadata: {
    width: number;
    height: number;
    aspectRatio: number;
    fileSize: number;
  };
  altText?: string;
  caption?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  heroImage?: string;
  hasConfig: boolean;
  imageCount: number;
  videoCount: number;
  subcollections?: Collection[];
  gallery?: MediaItem[];
  config?: CollectionConfig;
}

export interface CollectionConfig {
  title?: string;
  subtitle?: string;
  description?: string;
  heroBanner?: {
    enabled: boolean;
    image: string;
    title: string;
    subtitle: string;
    overlayOpacity: number;
    textPosition: string;
  };
  layout?: {
    type: 'masonry' | 'side-by-side' | 'single' | 'stacked';
    columns: number;
    spacing: 'tight' | 'normal' | 'loose';
    backgroundColor: string;
    backgroundOpacity: number;
  };
  carousels?: Array<{
    title: string;
    images: string[];
    transitionType: 'fade' | 'slide' | 'zoom';
    autoplaySpeed: number;
  }>;
}

/**
 * Fetch all available collections
 */
export async function getCollections(): Promise<Collection[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/content/collections`);

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data = await response.json();
    return data.collections || [];
  } catch (error) {
    console.error('[API Client] Error fetching collections:', error);
    return [];
  }
}

/**
 * Fetch a specific collection by slug
 */
export async function getCollection(slug: string): Promise<Collection | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/content/collections/${slug}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[API Client] Collection not found: ${slug}`);
        return null;
      }
      throw new Error(`Failed to fetch collection: ${response.statusText}`);
    }

    const data = await response.json();
    return data.collection || null;
  } catch (error) {
    console.error('[API Client] Error fetching collection:', error);
    return null;
  }
}

/**
 * Get media URL for an image/video
 * Supports size and format query parameters
 */
export function getMediaUrl(
  collectionSlug: string,
  filename: string,
  options?: {
    size?: 'thumbnail' | 'medium' | 'full';
    format?: 'webp' | 'jpg' | 'png';
  }
): string {
  const params = new URLSearchParams();

  if (options?.size) {
    params.append('size', options.size);
  }

  if (options?.format) {
    params.append('format', options.format);
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/media/${collectionSlug}/${filename}`;

  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Trigger content scan (admin operation)
 */
export async function triggerContentScan(): Promise<{
  success: boolean;
  results?: {
    imagesProcessed: number;
    thumbnailsGenerated: number;
    directoriesCreated: number;
    errors: string[];
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/scan`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Scan failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, results: data };
  } catch (error) {
    console.error('[API Client] Error triggering scan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('[API Client] Backend health check failed:', error);
    return false;
  }
}