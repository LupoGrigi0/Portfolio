/**
 * Navigation Component - Production Navigation (lifted from real-api-demo)
 *
 * Full-featured navigation with:
 * - Breadcrumb history tracking for deep hierarchies
 * - Contextual menu (shows subcollections when inside a collection)
 * - Recursive subcollection rendering (handles 3rd, 4th+ tiers)
 * - Two-tier rollback delay (different for collections with/without subs)
 * - Triangle pips for subcollections
 * - Favicon Home icon
 *
 * @author Kai v3 (Carousel & Animation Specialist) - original real-api-demo
 * @author Claude (Opus 4.1) - production integration
 * @created 2025-10-06
 * @updated 2025-10-14
 * @based-on D:\Lupo\Source\Portfolio\worktrees\frontend-core\src\frontend\src\app\progressive-nav-demo\real-api-demo.tsx
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCollection, getAbsoluteMediaUrl, type Collection, type NavigationConfig, type SiteConfig } from '@/lib/api-client';

interface NavigationProps {
  config?: NavigationConfig;
  collections: Collection[];
  siteConfig?: SiteConfig | null;
  currentCollectionName?: string;
  onClose?: () => void;
}

export default function Navigation({ config, collections, siteConfig, currentCollectionName, onClose }: NavigationProps) {
  // Navigation state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [isAutoCollapsing, setIsAutoCollapsing] = useState(false);

  // Data state
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [breadcrumbHistory, setBreadcrumbHistory] = useState<Array<{ name: string; slug: string }>>([]);

  // Refs
  const router = useRouter();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Extract current collection slug from pathname
  const currentSlug = pathname?.startsWith('/collections/')
    ? pathname.split('/')[2]
    : pathname === '/' ? 'home' : null;

  // Config values (with defaults from real-api-demo)
  const indentSpacing = config?.styling?.subcollectionIndent || 16;
  const drawerWidth = config?.styling?.drawerWidth || 240;
  const rollbackSpeed = config?.timing?.drawerTransitionMs || 300;
  const rollbackDelay = config?.timing?.rollbackDelay || 300; // For simple collections
  const rollbackDelayWithSubs = config?.timing?.rollbackDelayWithSubs || 2000; // For collections with subcollections
  const itemVerticalSpacing = 4; // Gap between nav items

  // Styling from config
  const textColor = config?.styling?.textColor || 'rgba(255, 255, 255, 0.8)';
  const hoverColor = config?.styling?.hoverColor || 'rgba(255, 255, 255, 1)';
  const activeColor = config?.styling?.activeColor || 'rgba(255, 255, 255, 1)';
  const drawerBgColor = config?.styling?.drawerBackgroundColor || 'rgba(0, 0, 0, 0.8)';
  const hamburgerColor = config?.styling?.hamburgerColor || 'white';

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Click outside to close (excluding hamburger button)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        isDrawerOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(target)
      ) {
        setIsDrawerOpen(false);
        onClose?.();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDrawerOpen, onClose]);

  // ESC to close
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDrawerOpen, onClose]);

  // Find collection by slug (recursive search)
  const findCollectionBySlug = (slug: string, cols: Collection[] = collections): Collection | null => {
    for (const col of cols) {
      if (col.slug === slug) return col;
      if (col.subcollections && col.subcollections.length > 0) {
        // Handle string slug subcollections
        const firstSub = col.subcollections[0];
        if (typeof firstSub === 'string') {
          // Check if slug matches any string in array
          const slugArray = col.subcollections as unknown as string[];
          if (slugArray.includes(slug)) {
            // Return a minimal collection object for the slug
            return {
              slug,
              name: slug.replace(/^[^-]+-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              id: slug,
              imageCount: 0,
              videoCount: 0,
              subcollections: [],
            };
          }
        } else {
          // Object subcollections - recurse
          const found = findCollectionBySlug(slug, col.subcollections as Collection[]);
          if (found) return found;
        }
      }
    }
    return null;
  };

  // Get breadcrumbs from current path (using history)
  const getBreadcrumbs = () => {
    if (!currentCollection) return [{ name: 'Home', slug: '/' }];

    // Return Home + breadcrumb history + current collection
    return [
      { name: 'Home', slug: '/' },
      ...breadcrumbHistory,
      { name: currentCollection.name, slug: currentCollection.slug }
    ];
  };

  // Navigate to a collection
  const navigateTo = async (slug: string, fromBreadcrumb = false) => {
    if (slug === '/') {
      router.push('/');
      setCurrentCollection(null);
      setExpandedCollections(new Set());
      setBreadcrumbHistory([]);
      // Use rollback delay
      if (!isMobile) {
        setTimeout(() => setIsDrawerOpen(false), rollbackDelay);
      }
      return;
    }

    const isAlreadyOnPage = currentCollection?.slug === slug;

    // Load collection details to get subcollections
    const collectionData = await getCollection(slug);
    if (!collectionData) {
      console.error('[Navigation] Failed to load collection:', slug);
      return;
    }

    // Update breadcrumb history
    if (fromBreadcrumb) {
      // Clicking on a breadcrumb - truncate history to that point
      const crumbIndex = breadcrumbHistory.findIndex(c => c.slug === slug);
      if (crumbIndex >= 0) {
        setBreadcrumbHistory(breadcrumbHistory.slice(0, crumbIndex + 1));
      } else {
        // Not in history, reset to empty (must be top level)
        setBreadcrumbHistory([]);
      }
    } else if (!isAlreadyOnPage && currentCollection) {
      // Normal forward navigation - add current collection to history
      setBreadcrumbHistory([
        ...breadcrumbHistory,
        { name: currentCollection.name, slug: currentCollection.slug }
      ]);
    }

    router.push(`/collections/${slug}`);
    setCurrentCollection(collectionData);

    // Check if this collection has subcollections
    const hasSubcollections = collectionData.subcollections && collectionData.subcollections.length > 0;

    if (hasSubcollections) {
      // Collection WITH subcollections - keep menu open longer
      if (fromBreadcrumb) {
        setIsDrawerOpen(true);
        setTimeout(() => {
          setExpandedCollections(prev => new Set(prev).add(slug));
        }, 100);
      } else if (isAlreadyOnPage && expandedCollections.has(slug)) {
        // Double-click behavior: collapse subcollections
        setExpandedCollections(prev => {
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
      } else {
        // Normal navigation: expand after page load
        setTimeout(() => {
          setExpandedCollections(prev => new Set(prev).add(slug));

          // Use LONGER delay for collections with subs
          if (!isMobile) {
            setTimeout(() => {
              setIsDrawerOpen(false);
            }, rollbackDelayWithSubs);
          }
        }, 300);
      }
    } else {
      // Collection WITHOUT subcollections - use standard rollback delay
      if (!isMobile) {
        setTimeout(() => {
          setIsDrawerOpen(false);
          setExpandedCollections(new Set());
        }, rollbackDelay);
      }
    }
  };

  // Get drawer width based on expanded depth
  const getDrawerWidth = () => {
    const maxDepth = Math.max(0, ...Array.from(expandedCollections).map(slug => {
      const col = findCollectionBySlug(slug);
      return col?.subcollections?.length || 0;
    }));

    return drawerWidth + (maxDepth > 0 ? 40 : 0);
  };

  // Helper function to recursively normalize subcollections
  const normalizeSubcollection = (sub: any): Collection => {
    let normalizedSubcollections: Collection[] = [];
    if (sub.subcollections && Array.isArray(sub.subcollections) && sub.subcollections.length > 0) {
      const firstNestedSub = sub.subcollections[0];
      if (typeof firstNestedSub === 'string') {
        // String slugs - convert to minimal Collection objects
        normalizedSubcollections = (sub.subcollections as string[]).map((slug: string) => ({
          slug,
          name: slug.replace(/^[^-]+-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          id: slug,
          imageCount: 0,
          videoCount: 0,
          subcollections: [],
        }));
      } else {
        // Full objects - recursively normalize them too
        normalizedSubcollections = sub.subcollections.map((nestedSub: any) => normalizeSubcollection(nestedSub));
      }
    }

    return {
      slug: sub.slug,
      name: sub.title || sub.name || sub.slug,
      id: sub.id || sub.slug,
      imageCount: sub.imageCount || 0,
      videoCount: 0,
      subcollections: normalizedSubcollections,
    };
  };

  // Recursive collection tree renderer
  const renderCollectionTree = (cols: Collection[], depth = 0) => {
    return cols.map((collection) => {
      const isExpanded = expandedCollections.has(collection.slug);
      const isActive = currentCollection?.slug === collection.slug;

      // Handle both object subcollections and string slug subcollections
      let hasSubcollections = false;
      let subcollectionsList: Collection[] = [];

      if (collection.subcollections && collection.subcollections.length > 0) {
        const firstSub = collection.subcollections[0];
        if (typeof firstSub === 'string') {
          hasSubcollections = true;
          subcollectionsList = (collection.subcollections as unknown as string[]).map(slug => ({
            slug,
            name: slug.replace(/^[^-]+-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            id: slug,
            imageCount: 0,
            videoCount: 0,
            subcollections: [],
          }));
        } else {
          hasSubcollections = true;
          subcollectionsList = (collection.subcollections as any[]).map(sub => normalizeSubcollection(sub));
        }
      }

      return (
        <div key={collection.slug} style={{ marginLeft: depth > 0 ? `${indentSpacing}px` : '0' }}>
          <button
            onClick={() => navigateTo(collection.slug)}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-between ${
              isActive
                ? 'bg-white/10 border border-white/20 font-semibold'
                : 'hover:bg-white/5'
            }`}
            style={{
              color: isActive ? activeColor : textColor,
            }}
          >
            <span>{collection.name}</span>
            {hasSubcollections && (
              <span className="ml-2 text-white/50">▸</span>
            )}
          </button>

          {/* Subcollections (recursive rendering for 3rd, 4th+ tiers) */}
          {isExpanded && hasSubcollections && (
            <div
              className={`mt-1 transition-all duration-300 ${
                isAutoCollapsing ? 'animate-ghost-out' : ''
              }`}
              style={{ display: 'flex', flexDirection: 'column', gap: `${itemVerticalSpacing}px` }}
            >
              {renderCollectionTree(subcollectionsList, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const calculatedDrawerWidth = getDrawerWidth();
  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center h-16 px-4 gap-4">
          {/* Hamburger Button */}
          <button
            ref={hamburgerRef}
            onClick={toggleDrawer}
            className={`relative w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all duration-300 ${
              !isDrawerOpen ? 'animate-pulse-subtle' : ''
            }`}
            style={{ color: hamburgerColor }}
            aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-full transition-all duration-300 ${
                  isDrawerOpen ? 'rotate-45 translate-y-2' : ''
                }`}
                style={{ backgroundColor: hamburgerColor }}
              />
              <span
                className={`block h-0.5 w-full transition-all duration-300 ${
                  isDrawerOpen ? 'opacity-0' : ''
                }`}
                style={{ backgroundColor: hamburgerColor }}
              />
              <span
                className={`block h-0.5 w-full transition-all duration-300 ${
                  isDrawerOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
                style={{ backgroundColor: hamburgerColor }}
              />
            </div>
          </button>

          {/* Logo */}
          <button
            onClick={() => navigateTo('/')}
            className="hover:opacity-80 transition-opacity"
            aria-label="Home"
          >
            {siteConfig?.branding?.logoUrl ? (
              <img
                src={getAbsoluteMediaUrl(siteConfig.branding.logoUrl)}
                alt={siteConfig.siteName || 'Home'}
                className="h-10 w-auto"
              />
            ) : (
              <span className="text-white text-xl font-semibold tracking-tight">
                {siteConfig?.siteName || 'Home'}
              </span>
            )}
          </button>

          {/* Breadcrumbs (Desktop) - Full hierarchy support */}
          {!isMobile && breadcrumbs.length > 1 && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              {breadcrumbs.map((crumb, index) => (
                <div key={`breadcrumb-${index}-${crumb.slug}`} className="flex items-center gap-2">
                  <span className="text-white/40">/</span>
                  <button
                    onClick={() => crumb.slug === '/' ? navigateTo('/') : navigateTo(crumb.slug, true)}
                    className={`hover:text-white transition-colors ${
                      index === breadcrumbs.length - 1 ? 'text-white font-semibold' : ''
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />
        </div>
      </div>

      {/* Drawer Overlay - REMOVED per Site Rule: Images are paramount */}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-16 bottom-0 left-0 z-40 backdrop-blur-lg border-r border-white/20 transition-all ${
          isDrawerOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
        style={{
          width: `${calculatedDrawerWidth}px`,
          transitionDuration: `${rollbackSpeed}ms`,
          backgroundColor: drawerBgColor,
        }}
      >
        <div className="h-full overflow-y-auto p-4">
          <nav style={{ display: 'flex', flexDirection: 'column', gap: `${itemVerticalSpacing}px` }}>
            {/* Home link (always at top when viewing a collection) */}
            {currentCollection && (
              <>
                <button
                  onClick={() => navigateTo('/')}
                  className="w-full text-left px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/5 flex items-center gap-2"
                  style={{ color: textColor }}
                >
                  <img src="/favicon.ico" alt="Home" className="w-4 h-4" />
                  <span>Home</span>
                </button>
                <div className="border-b border-white/10 my-2" />
              </>
            )}

            {/* Contextual menu: show subcollections if current collection has them, otherwise show all */}
            {currentCollection && currentCollection.subcollections && currentCollection.subcollections.length > 0 ? (
              // Show current collection's subcollections
              <>
                <div className="text-xs text-white/50 px-4 py-2">{currentCollection.name}</div>
                {renderCollectionTree(
                  (currentCollection.subcollections as any[]).map((sub) => {
                    if (typeof sub === 'string') {
                      return {
                        slug: sub,
                        name: sub.replace(/^[^-]+-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        id: sub,
                        imageCount: 0,
                        videoCount: 0,
                        subcollections: [],
                      };
                    }
                    return normalizeSubcollection(sub);
                  })
                )}
              </>
            ) : (
              // Show all top-level collections
              renderCollectionTree(collections)
            )}
          </nav>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @keyframes ghost-out {
          0% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 0.3;
            transform: translateX(-8px);
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        .animate-ghost-out {
          animation: ghost-out 600ms ease-out forwards;
        }

        /* Pure CSS hover */
        :global(.w-full.text-left.px-4.py-2:not(.bg-white\\/10):hover) {
          background-color: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 1);
        }
      `}</style>
    </>
  );
}
