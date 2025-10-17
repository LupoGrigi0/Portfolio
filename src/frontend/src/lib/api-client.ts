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

export interface Subcollection {
  id: string;
  title: string;  // Display name
  slug: string;   // URL-safe identifier
  description?: string;
  coverImage?: string | null;
  imageCount: number;
  featured: boolean;
  subcollections: Subcollection[];  // Recursive up to 4 levels
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  heroImage?: string;
  hasConfig: boolean;
  imageCount: number;
  videoCount: number;
  description?: string;
  featured?: boolean;
  tags?: string[];
  subcollections?: Subcollection[];  // New: Full nested subcollection objects
  gallery?: MediaItem[];
  config?: CollectionConfig;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CollectionConfig {
  // Layout type
  layoutType?: 'curated' | 'dynamic';

  // Meta
  title?: string;
  subtitle?: string;
  description?: string;
  tags?: string[];

  // Styling
  styling?: {
    accentColor?: string;
  };

  // Background (static image, not carousel)
  background?: {
    image: string;
    opacity?: number;
    blur?: number;
    parallax?: boolean;
  };

  // Projection settings (midground image projection from carousels)
  projection?: ProjectionConfig;

  // Parallax config (for sister's multi-layer system)
  parallaxConfig?: {
    layers?: any[]; // Will use her ParallaxLayer type when integrated
    scrollBehavior?: string;
  };

  // Curated layout sections (also supports 'hybrid' with dynamic-fill sections)
  sections?: Array<
    | HeroSectionConfig
    | TextSectionConfig
    | CarouselSectionConfig
    | ImageSectionConfig
    | VideoSectionConfig
    | SeparatorSectionConfig
    | DynamicFillSectionConfig
    | RowSectionConfig
  >;

  // Dynamic layout settings
  dynamicSettings?: {
    layout: 'single-column' | '2-across' | '3-across' | 'masonry' | 'zipper';
    imagesPerCarousel?: number | 'all';
    carouselDefaults?: CarouselOptionsConfig;
    spacing?: {
      horizontal?: number; // Gap between carousels (px) - applies to grids
      vertical?: number;   // Gap between rows (px)
    };
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
  // Background image settings (configurable via Lightboard)
  backgroundImage?: string; // URL or path to hero image
  backgroundPosition?: string; // CSS background-position (e.g., 'center', 'top', '50% 30%')
  backgroundSize?: string; // CSS background-size (e.g., 'cover', 'contain', '100% auto')
  minHeight?: string; // Minimum height as CSS value (e.g., '60vh', '800px', '100%')
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
  enableProjection?: boolean; // Override global projection setting for this carousel
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

export interface DynamicFillSectionConfig {
  type: 'dynamic-fill';
  count?: number | 'all'; // Number of images to auto-fill, or 'all' for remaining
  skip?: number; // Number of remaining images to skip before filling (default: 0)
  layout?: 'single-column' | '2-across' | '3-across' | 'masonry' | 'zipper';
  imagesPerCarousel?: number | 'all';
  carouselDefaults?: CarouselOptionsConfig;
  spacing?: {
    horizontal?: number; // Gap between carousels (px)
    vertical?: number;   // Gap between rows (px)
  };
}

export interface RowSectionConfig {
  type: 'row';
  sections: Array<
    | TextSectionConfig
    | CarouselSectionConfig
    | ImageSectionConfig
    | VideoSectionConfig
  >;
}

// Projection configuration for midground image effects
export interface ProjectionConfig {
  // Global settings (applied to all projections in this collection)
  enabled?: boolean; // Master toggle (default: false)
  fadeDistance?: number; // 0-1, distance from viewport center where fade starts (default: 0.5)
  maxBlur?: number; // 0-10px, blur intensity at edge of fade zone (default: 4)
  scaleX?: number; // 0.5-2, horizontal scale of projection (default: 1.2)
  scaleY?: number; // 0.5-2, vertical scale of projection (default: 1.2)
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn' | 'lighten' | 'darken';

  // Vignette settings (radial fade from center)
  vignette?: {
    width?: number; // 0-50%, edge fade width (default: 20)
    strength?: number; // 0-1, fade opacity (default: 0.8)
  };

  // Checkerboard vignette (alternative to radial, more artistic)
  checkerboard?: {
    enabled?: boolean; // Use checkerboard instead of radial (default: false)
    tileSize?: number; // 10-100px, checker square size (default: 30)
    scatterSpeed?: number; // 0-1, animation speed (default: 0.3)
    blur?: number; // 0-10px, blur for checker edges (default: 0)
  };

  // Pattern for auto-generated layouts (dynamic/dynamic-fill sections)
  pattern?: 'all' | 'every-2nd' | 'every-3rd' | 'none'; // Which carousels get projection
  patternOffset?: number; // Start index (0-based, default: 0)
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

// Navigation configuration (stored in site config)
export interface NavigationConfig {
  menu?: {
    position?: 'left' | 'right';
    showHome?: boolean;
    homeLabel?: string;
    groupByTag?: boolean;
    showSubcollections?: boolean;
  };
  breadcrumbs?: {
    enabled?: boolean;
    separator?: string;
    showHome?: boolean;
    homeLabel?: string;
  };
  timing?: {
    drawerTransitionMs?: number;
    fadeInMs?: number;
    hoverDelayMs?: number;
    rollbackDelay?: number; // Delay before menu auto-closes (simple collections)
    rollbackDelayWithSubs?: number; // Delay before menu auto-closes (with subcollections)
  };
  styling?: {
    hamburgerSize?: number;
    hamburgerColor?: string;
    hamburgerPosition?: { top?: number; left?: number; right?: number };
    drawerWidth?: number;
    drawerBackgroundColor?: string;
    drawerBackgroundOpacity?: number;
    textColor?: string;
    hoverColor?: string;
    activeColor?: string;
    subcollectionIndent?: number;
  };
}

// Site configuration (from /api/site/config)
export interface SiteConfig {
  siteName?: string;
  tagline?: string;
  copyright?: string;
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
  };
  social?: Array<{
    platform: string;
    url: string;
    icon: string;
  }>;
  branding?: {
    logo?: string;
    logoUrl?: string;
    favicon?: string;
    faviconUrl?: string;
    appleTouchIcon?: string;
    appleTouchIconUrl?: string;
    primaryColor?: string;
    accentColor?: string;
  };
  seo?: {
    description?: string;
    keywords?: string[];
  };
  navigation?: NavigationConfig;

  // PERFORMANCE: Global projection control
  // Set to false to disable projection system entirely (overrides all page-level settings)
  // Useful during performance optimization or on mobile devices
  enableProjection?: boolean; // Default: true
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
 * Fetch a specific collection by slug with automatic pagination handling
 *
 * Fetches all pages in parallel to get complete gallery for large collections.
 * Small collections (< page size) return in single request.
 */
export async function getCollection(
  slug: string,
  options?: { limit?: number; disablePagination?: boolean }
): Promise<Collection | null> {
  try {
    const pageSize = options?.limit || 100; // Default to Viktor's new 100/page limit

    // Fetch first page to get pagination info
    const firstPageUrl = new URL(`${API_BASE_URL}/api/content/collections/${slug}`);
    firstPageUrl.searchParams.set('page', '1');
    firstPageUrl.searchParams.set('limit', pageSize.toString());

    const firstResponse = await fetch(firstPageUrl.toString());

    if (!firstResponse.ok) {
      if (firstResponse.status === 404) {
        console.warn(`[API Client] Collection not found: ${slug}`);
        return null;
      }
      throw new Error(`Failed to fetch collection: ${firstResponse.statusText}`);
    }

    const firstResult = await firstResponse.json();

    if (!firstResult.success || !firstResult.data?.collection) {
      return firstResult.collection || null;
    }

    const collection = firstResult.data.collection;
    const pagination = collection.pagination;

    // If no pagination or only 1 page, return immediately
    if (!pagination || pagination.totalPages <= 1 || options?.disablePagination) {
      return collection;
    }

    console.log(`[API Client] Fetching ${pagination.totalPages} pages for ${slug} (${pagination.total} total images)`);

    // Fetch remaining pages in parallel
    const pagePromises: Promise<MediaItem[]>[] = [];
    for (let page = 2; page <= pagination.totalPages; page++) {
      const pageUrl = new URL(`${API_BASE_URL}/api/content/collections/${slug}`);
      pageUrl.searchParams.set('page', page.toString());
      pageUrl.searchParams.set('limit', pageSize.toString());

      pagePromises.push(
        fetch(pageUrl.toString())
          .then(r => r.json())
          .then(data => {
            const gallery = data.data?.collection?.gallery || [];
            console.log(`[API Client] Page ${page}: ${gallery.length} images`);
            return gallery;
          })
      );
    }

    // Wait for all pages and concatenate galleries
    const additionalPages = await Promise.all(pagePromises);
    const totalFromAdditional = additionalPages.reduce((sum, page) => sum + page.length, 0);

    console.log(`[API Client] Page 1: ${collection.gallery?.length || 0} images`);
    console.log(`[API Client] Pages 2-${pagination.totalPages}: ${totalFromAdditional} images across ${additionalPages.length} pages`);

    collection.gallery = [
      ...(collection.gallery || []),
      ...additionalPages.flat()
    ];

    console.log(`[API Client] ✅ Total loaded: ${collection.gallery.length} images for ${slug}`);

    return collection;
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

/**
 * Reset rate limit for current IP (useful for testing large collections)
 */
export async function resetRateLimit(ip?: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const url = new URL(`${API_BASE_URL}/api/admin/reset-rate-limit`);
    if (ip) {
      url.searchParams.set('ip', ip);
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Rate limit reset failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
    };
  } catch (error) {
    console.error('[API Client] Error resetting rate limit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update collection config (both filesystem and database)
 *
 * @param slug Collection slug
 * @param config New configuration object (replaces existing config entirely)
 * @returns Success status and updated config
 */
export async function updateCollectionConfig(
  slug: string,
  config: CollectionConfig
): Promise<{
  success: boolean;
  config?: CollectionConfig;
  error?: string;
  updatedAt?: string;
  path?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/config/${slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`Config update failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Config update failed');
    }

    return {
      success: true,
      config: data.data.config,
      updatedAt: data.data.updatedAt,
      path: data.data.path,
    };
  } catch (error) {
    console.error('[API Client] Error updating config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch site-wide configuration
 */
export async function getSiteConfig(): Promise<SiteConfig | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/site/config`);

    if (!response.ok) {
      throw new Error(`Failed to fetch site config: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    }

    return null;
  } catch (error) {
    console.error('[API Client] Error fetching site config:', error);
    return null;
  }
}

/**
 * Update site-wide configuration
 * (Development mode only)
 */
export async function updateSiteConfig(
  config: Partial<SiteConfig>
): Promise<{
  success: boolean;
  config?: SiteConfig;
  error?: string;
  updatedAt?: string;
  path?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/site/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`Site config update failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Site config update failed');
    }

    return {
      success: true,
      config: data.data.config,
      updatedAt: data.data.updatedAt,
      path: data.data.path,
    };
  } catch (error) {
    console.error('[API Client] Error updating site config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}