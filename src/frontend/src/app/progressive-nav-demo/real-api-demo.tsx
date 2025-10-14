/**
 * Progressive Disclosure Navigation - Real API Integration
 *
 * Connected to Viktor's backend API with real subcollections.
 * Demonstrates full navigation hierarchy with actual collections.
 *
 * Features:
 * - Triangle pips for subcollections
 * - Favicon Home icon
 * - Configurable timing and spacing
 * - Fixed third-level navigation
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-06
 * @updated 2025-10-12
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCollections, getCollection, type Collection } from '@/lib/api-client';

export default function ProgressiveNavRealAPI() {
  // Navigation state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [isAutoCollapsing, setIsAutoCollapsing] = useState(false);

  // Data state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [breadcrumbHistory, setBreadcrumbHistory] = useState<Array<{ name: string; slug: string }>>([]);

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);
  const [rollbackDelay, setRollbackDelay] = useState(300); // ms before drawer closes when clicking Home
  const [rollbackSpeed, setRollbackSpeed] = useState(300); // ms for close animation
  const [indentSpacing, setIndentSpacing] = useState(16); // px for each indent level
  const [itemVerticalSpacing, setItemVerticalSpacing] = useState(4); // px between items

  // Load all collections on mount
  useEffect(() => {
    async function loadCollections() {
      console.log('[Real API Nav] Loading collections from API...');
      setLoading(true);
      const data = await getCollections();
      console.log('[Real API Nav] Received collections:', data);
      console.log('[Real API Nav] Total collections:', data.length);

      // Log subcollections for each
      data.forEach(col => {
        if (col.subcollections && col.subcollections.length > 0) {
          console.log(`[Real API Nav] ${col.name} has ${col.subcollections.length} subcollections:`, col.subcollections.map(s => s.title || s.name || s.slug));
        }
      });

      setCollections(data);
      setLoading(false);
    }
    loadCollections();
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    console.log('[Real API Nav] Navigating to:', slug, 'fromBreadcrumb:', fromBreadcrumb);

    if (slug === '/') {
      setCurrentPath('/');
      setCurrentCollection(null);
      setExpandedCollections(new Set());
      setBreadcrumbHistory([]);
      // Use rollback delay and speed settings
      if (!isMobile) {
        setTimeout(() => setIsDrawerOpen(false), rollbackDelay);
      }
      return;
    }

    const isAlreadyOnPage = currentCollection?.slug === slug;

    // Load collection details
    console.log('[Real API Nav] Fetching collection details for:', slug);
    const collectionData = await getCollection(slug);
    console.log('[Real API Nav] Received collection data:', collectionData);
    if (!collectionData) {
      console.error('[Real API Nav] Failed to load collection:', slug);
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
    // If already on page, don't modify history

    setCurrentPath(`/collections/${slug}`);
    setCurrentCollection(collectionData);

    // Check if this collection has subcollections (from the API response, not the tree)
    const hasSubcollections = collectionData.subcollections && collectionData.subcollections.length > 0;
    console.log('[Real API Nav] Collection has subcollections?', hasSubcollections, collectionData.subcollections);

    if (hasSubcollections) {
      // If clicking from breadcrumb, open drawer and expand
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

          // Mobile: auto-collapse after delay
          if (isMobile) {
            setTimeout(() => {
              setIsAutoCollapsing(true);
              setTimeout(() => {
                setIsDrawerOpen(false);
                setIsAutoCollapsing(false);
              }, 600);
            }, 2500);
          }
        }, 300);
      }
    } else {
      // No subcollections: keep drawer open on mobile, use rollback delay on desktop
      if (!isMobile) {
        setTimeout(() => {
          setIsDrawerOpen(false);
          setExpandedCollections(new Set());
        }, rollbackDelay);
      }
      // On mobile, keep drawer open so user can navigate back
    }
  };

  // Get drawer width based on expanded depth
  const getDrawerWidth = () => {
    // Base width + additional width per depth level
    const maxDepth = Math.max(0, ...Array.from(expandedCollections).map(slug => {
      const col = findCollectionBySlug(slug);
      return col?.subcollections?.length || 0;
    }));

    return 240 + (maxDepth > 0 ? 40 : 0);
  };

  // Helper function to recursively normalize subcollections from API format to Collection format
  const normalizeSubcollection = (sub: any): Collection => {
    // Recursively normalize any nested subcollections
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

    // Return normalized Collection object
    return {
      slug: sub.slug,
      name: sub.title || sub.name || sub.slug, // Viktor's API uses "title" instead of "name"
      id: sub.id || sub.slug,
      imageCount: sub.imageCount || 0,
      videoCount: 0,
      subcollections: normalizedSubcollections,
    };
  };

  // Recursive collection tree renderer
  const renderCollectionTree = (cols: Collection[], depth = 0) => {
    if (depth === 0) {
      console.log('[Real API Nav] Rendering collection tree, total collections:', cols.length);
    }

    return cols.map((collection) => {
      const isExpanded = expandedCollections.has(collection.slug);
      const isActive = currentCollection?.slug === collection.slug;

      // Handle both object subcollections and string slug subcollections
      let hasSubcollections = false;
      let subcollectionsList: Collection[] = [];

      if (collection.subcollections && collection.subcollections.length > 0) {
        const firstSub = collection.subcollections[0];
        if (typeof firstSub === 'string') {
          // Viktor's format: array of slug strings
          hasSubcollections = true;
          // Convert slug strings to minimal collection objects for rendering
          subcollectionsList = (collection.subcollections as unknown as string[]).map(slug => ({
            slug,
            name: slug.replace(/^[^-]+-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Convert slug to title
            id: slug,
            imageCount: 0,
            videoCount: 0,
            subcollections: [],
          }));
        } else {
          // Full object format - normalize to Collection format recursively
          hasSubcollections = true;
          subcollectionsList = (collection.subcollections as any[]).map(sub => normalizeSubcollection(sub));
        }
      }

      if (hasSubcollections && depth === 0) {
        console.log(`[Real API Nav] ${collection.name} has ${subcollectionsList.length} subcollections, expanded:`, isExpanded);
      }

      return (
        <div key={collection.slug} style={{ marginLeft: depth > 0 ? `${indentSpacing}px` : '0' }}>
          {/* Collection button */}
          <button
            onClick={() => navigateTo(collection.slug)}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-between ${
              isActive
                ? 'bg-white/10 border border-white/20 text-white font-semibold'
                : 'text-white/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>{collection.name}</span>
            {hasSubcollections && (
              <span className="ml-2 text-white/50">
                ▸
              </span>
            )}
          </button>

          {/* Subcollections (if expanded) */}
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

  const drawerWidth = getDrawerWidth();
  const breadcrumbs = getBreadcrumbs();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading collections...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center h-16 px-4 gap-4">
          {/* Hamburger Button */}
          <button
            onClick={toggleDrawer}
            className={`relative w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-all duration-300 ${
              !isDrawerOpen ? 'animate-pulse-subtle' : ''
            }`}
            aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                  isDrawerOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                  isDrawerOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                  isDrawerOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>

          {/* Logo */}
          <button
            onClick={() => navigateTo('/')}
            className="text-white text-xl font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            Lupo Grigio
          </button>

          {/* Breadcrumbs (Desktop) - positioned right after logo */}
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

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-all"
            aria-label="Settings"
            title="Navigation Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Drawer Overlay (Mobile) */}
      {isMobile && isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-16 bottom-0 left-0 z-40 bg-black/80 backdrop-blur-lg border-r border-white/20 transition-all ${
          isDrawerOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
        style={{
          width: `${drawerWidth}px`,
          transitionDuration: `${rollbackSpeed}ms`,
        }}
      >
        <div className="h-full overflow-y-auto p-4">
          <nav style={{ display: 'flex', flexDirection: 'column', gap: `${itemVerticalSpacing}px` }}>
            {/* Home link (always at top when viewing a collection) */}
            {currentCollection && (
              <>
                <button
                  onClick={() => navigateTo('/')}
                  className="w-full text-left px-4 py-2 rounded-lg transition-all duration-200 text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-2"
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
                    // Handle both string slugs and full Subcollection objects
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
                    // Viktor's API returns full Subcollection objects with "title" instead of "name"
                    // Use recursive normalization to handle nested subcollections
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

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed top-20 right-4 z-50 w-80 bg-black/90 backdrop-blur-lg border border-white/20 rounded-lg p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Navigation Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Close settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Rollback Delay */}
            <div>
              <label className="text-white/80 text-sm block mb-2">
                Rollback Delay: <span className="text-white font-mono">{rollbackDelay}ms</span>
              </label>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={rollbackDelay}
                onChange={(e) => setRollbackDelay(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-white/50 text-xs mt-1">Time before drawer closes after clicking Home</p>
            </div>

            {/* Rollback Speed */}
            <div>
              <label className="text-white/80 text-sm block mb-2">
                Rollback Speed: <span className="text-white font-mono">{rollbackSpeed}ms</span>
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={rollbackSpeed}
                onChange={(e) => setRollbackSpeed(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-white/50 text-xs mt-1">Animation duration for drawer transitions</p>
            </div>

            {/* Indent Spacing */}
            <div>
              <label className="text-white/80 text-sm block mb-2">
                Indent Spacing: <span className="text-white font-mono">{indentSpacing}px</span>
              </label>
              <input
                type="range"
                min="8"
                max="32"
                step="2"
                value={indentSpacing}
                onChange={(e) => setIndentSpacing(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-white/50 text-xs mt-1">Horizontal indent per hierarchy level</p>
            </div>

            {/* Vertical Spacing */}
            <div>
              <label className="text-white/80 text-sm block mb-2">
                Vertical Spacing: <span className="text-white font-mono">{itemVerticalSpacing}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="16"
                step="1"
                value={itemVerticalSpacing}
                onChange={(e) => setItemVerticalSpacing(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-white/50 text-xs mt-1">Gap between navigation items</p>
            </div>

            {/* Reset to Defaults */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setRollbackDelay(300);
                  setRollbackSpeed(300);
                  setIndentSpacing(16);
                  setItemVerticalSpacing(4);
                }}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="pt-16">
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl font-bold text-white">
                {currentCollection?.name || 'Home'}
              </h1>
              {breadcrumbs.length > 1 && (
                <p className="text-white/70">
                  {breadcrumbs.map(c => c.name).join(' > ')}
                </p>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Real API Integration
              </h2>
              <div className="text-white/70 space-y-4">
                {currentCollection ? (
                  <>
                    <p><strong>Collection:</strong> {currentCollection.name}</p>
                    <p><strong>Images:</strong> {currentCollection.imageCount}</p>
                    <p><strong>Videos:</strong> {currentCollection.videoCount}</p>
                    {currentCollection.subcollections && currentCollection.subcollections.length > 0 && (
                      <div>
                        <p><strong>Subcollections:</strong></p>
                        <ul className="list-disc list-inside ml-4 mt-2">
                          {currentCollection.subcollections.map((sub, index) => {
                            // Handle both string slugs and full objects
                            const slug = typeof sub === 'string' ? sub : sub.slug;
                            const name = typeof sub === 'string' ? sub.replace(/^[^-]+-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : (sub.title || sub.name || sub.slug);
                            const imageCount = typeof sub === 'string' ? 0 : sub.imageCount;

                            return (
                              <li key={`${slug}-${index}`}>
                                <button
                                  onClick={() => navigateTo(slug)}
                                  className="hover:text-white transition-colors underline"
                                >
                                  {name} ({imageCount} images)
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p>Welcome! Click the hamburger menu to explore collections.</p>
                )}

                <div className="pt-4 border-t border-white/10 mt-6">
                  <p className="text-sm text-white/50">
                    <strong>Loaded collections:</strong> {collections.length}<br/>
                    <strong>Drawer:</strong> {isDrawerOpen ? 'Open' : 'Closed'}<br/>
                    <strong>Expanded:</strong> {expandedCollections.size} collection(s)<br/>
                    <strong>Mobile:</strong> {isMobile ? 'Yes' : 'No'}<br/>
                    <strong>Drawer width:</strong> {drawerWidth}px
                  </p>
                </div>
              </div>
            </div>
          </div>
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
      `}</style>
    </div>
  );
}
