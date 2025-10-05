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
  title?: string;
  caption?: string;
  urls: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  };
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  status: string;
  altText?: string;
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
  // Layout type
  layoutType?: 'curated' | 'dynamic';

  // Meta
  title?: string;
  subtitle?: string;
  description?: string;

  // Background (static image, not carousel)
  background?: {
    image: string;
    opacity?: number;
    blur?: number;
    parallax?: boolean;
  };

  // Parallax config (for sister's multi-layer system)
  parallaxConfig?: {
    layers?: any[]; // Will use her ParallaxLayer type when integrated
    scrollBehavior?: string;
  };

  // Curated layout sections
  sections?: Array<
    | HeroSectionConfig
    | TextSectionConfig
    | CarouselSectionConfig
    | ImageSectionConfig
    | VideoSectionConfig
    | SeparatorSectionConfig
  >;

  // Dynamic layout settings
  dynamicSettings?: {
    layout: 'single-column' | '2-across' | '3-across' | 'masonry';
    imagesPerCarousel?: number | 'all';
    carouselDefaults?: CarouselOptionsConfig;
  };

  // DEPRECATED (keeping for backwards compat with Zara's work)
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

// Section type definitions
export interface HeroSectionConfig {
  type: 'hero';
  title: string;
  subtitle?: string;
  containerOpacity?: number;
  textPosition?: 'center' | 'left' | 'right';
  separator?: boolean;
}

export interface TextSectionConfig {
  type: 'text';
  content: string;
  position?: 'center' | 'left' | 'right';
  width?: 'full' | 'half' | 'third' | 'quarter';
}

export interface CarouselSectionConfig {
  type: 'carousel';
  images: string[] | 'auto' | ImageQuery;
  videos?: string[];
  width?: 'full' | 'half' | 'third' | 'quarter';
  carouselOptions?: CarouselOptionsConfig;
}

export interface ImageSectionConfig {
  type: 'image';
  src: string;
  alt?: string;
  width?: 'full' | 'half' | 'third' | 'quarter';
  caption?: string;
}

export interface VideoSectionConfig {
  type: 'video';
  src: string;
  width?: 'full' | 'half' | 'third' | 'quarter';
  caption?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export interface SeparatorSectionConfig {
  type: 'separator';
  style?: 'line' | 'gradient' | 'dots';
  opacity?: number;
  thickness?: number;
  spacing?: number;
}

// Image query for dynamic image selection
export interface ImageQuery {
  aspectRatio?: { min?: number; max?: number } | string; // ">2.5" or {min: 2.5}
  tags?: string[];
  filename?: string; // Pattern matching
  skip?: number; // Skip first N images (for pagination/offsetting)
  limit?: number;
  sortBy?: 'filename' | 'date' | 'random';
}

// Carousel options (maps to Carousel component props)
export interface CarouselOptionsConfig {
  transition?: 'fade' | 'slide-horizontal' | 'slide-vertical' | 'slide-up' | 'slide-down' | 'zoom' | 'flipbook' | 'none';
  autoplay?: boolean;
  interval?: number;
  speed?: number;
  controls?: {
    nav?: { show: boolean; position?: 'top' | 'bottom' | 'sides' };
    reactions?: { show: boolean; autoHide?: boolean };
  };
  reservedSpace?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    backgroundColor?: string;
    backgroundOpacity?: number;
  };
  styling?: {
    borderWidth?: number;
    borderColor?: string;
    borderOpacity?: number;
    borderRadius?: number;
    backgroundColor?: string;
    backgroundOpacity?: number;
    padding?: number;
  };
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

    const result = await response.json();

    // Viktor's response format: { success: true, data: { collections: [...] } }
    if (result.success && result.data?.collections) {
      return result.data.collections;
    }

    // Fallback for direct format
    return result.collections || [];
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

    const result = await response.json();

    // Viktor's response format: { success: true, data: { collection: {...} } }
    if (result.success && result.data?.collection) {
      return result.data.collection;
    }

    // Fallback for direct format
    return result.collection || null;
  } catch (error) {
    console.error('[API Client] Error fetching collection:', error);
    return null;
  }
}

/**
 * Convert relative API URL to absolute URL
 * Viktor's backend returns relative URLs like "/api/media/..."
 * Frontend needs absolute URLs like "http://localhost:4000/api/media/..."
 */
export function getAbsoluteMediaUrl(relativeUrl: string): string {
  if (relativeUrl.startsWith('http')) {
    return relativeUrl; // Already absolute
  }
  return `${API_BASE_URL}${relativeUrl}`;
}

/**
 * Get media URL for an image/video (DEPRECATED - use item.urls from API)
 * Supports size and format query parameters
 *
 * @deprecated Use MediaItem.urls directly from API response
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