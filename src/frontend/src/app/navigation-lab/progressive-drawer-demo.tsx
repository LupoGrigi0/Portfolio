/**
 * Progressive Disclosure Drawer Navigation - Demo Prototype
 *
 * Demonstrates the smart persistent drawer navigation system:
 * - Progressive disclosure of subcollections
 * - Dynamic width based on hierarchy depth
 * - Mobile delayed auto-collapse with visual hints
 * - Breadcrumb navigation
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-06
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock collection structure matching Lupo's site
const MOCK_COLLECTIONS = [
  { id: 'home', name: 'Home', slug: '/', subcollections: [] },
  {
    id: 'love',
    name: 'Love',
    slug: '/collections/love',
    subcollections: [
      { id: 'cuddling', name: 'Cuddling', slug: '/collections/love/cuddling' },
      { id: 'mixed-media', name: 'Mixed Media', slug: '/collections/love/mixed-media' },
      { id: 'immersive', name: 'Immersive', slug: '/collections/love/immersive' },
      { id: 'surreal-love', name: 'Surreal Love', slug: '/collections/love/surreal-love' },
      { id: 'watercolor', name: 'Watercolor', slug: '/collections/love/watercolor' },
      { id: 'snow-walk', name: 'Snow Walk', slug: '/collections/love/snow-walk' },
      { id: 'snow-cuddles', name: 'Snow Cuddles', slug: '/collections/love/snow-cuddles' },
      { id: 'windowbox-doves', name: 'Windowbox Doves', slug: '/collections/love/windowbox-doves' },
    ],
  },
  { id: 'dark-fantasy', name: 'Dark Fantasy', slug: '/collections/dark-fantasy', subcollections: [] },
  { id: 'the-cafe', name: 'The Cafe', slug: '/collections/the-cafe', subcollections: [] },
  { id: 'surreal', name: 'Surreal', slug: '/collections/surreal', subcollections: [] },
  { id: 'limited-sets', name: 'Limited Sets', slug: '/collections/limited-sets', subcollections: [] },
  { id: 'expressions-spring', name: 'Expressions of Spring', slug: '/collections/expressions-spring', subcollections: [] },
  { id: 'fall-parade', name: 'Fall Parade', slug: '/collections/fall-parade', subcollections: [] },
  { id: '2023-portfolio', name: '2023 Art Portfolio', slug: '/collections/2023-portfolio', subcollections: [] },
  { id: 'the-menagerie', name: 'The Menagerie', slug: '/collections/the-menagerie', subcollections: [] },
];

export default function ProgressiveDrawerDemo() {
  // Navigation state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isAutoCollapsing, setIsAutoCollapsing] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get current collection and subcollection from path
  const getCurrentLocation = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length === 0) return { collection: null, subcollection: null };

    const collectionSlug = pathParts[1]; // e.g., "love"
    const subcollectionSlug = pathParts[2]; // e.g., "cuddling"

    const collection = MOCK_COLLECTIONS.find(c => c.slug.includes(collectionSlug));
    const subcollection = collection?.subcollections.find(s => s.slug.includes(subcollectionSlug || ''));

    return { collection, subcollection };
  };

  // Navigate to a page
  const navigateTo = (slug: string, fromBreadcrumb = false) => {
    const isAlreadyOnPage = currentPath === slug;

    setCurrentPath(slug);

    // Find the collection
    const collection = MOCK_COLLECTIONS.find(c => c.slug === slug || c.subcollections.some(s => s.slug === slug));

    if (collection) {
      // If navigating to a collection with subcollections, expand it after "page load"
      if (collection.subcollections.length > 0 && collection.slug === slug) {
        // If clicking from breadcrumb, open drawer and expand
        if (fromBreadcrumb) {
          setIsDrawerOpen(true);
          setTimeout(() => {
            setExpandedCollection(collection.id);
          }, 100);
        } else if (isAlreadyOnPage && expandedCollection === collection.id) {
          // Double-click behavior: collapse subcollections
          setExpandedCollection(null);
        } else {
          // Normal navigation: expand after page load
          setTimeout(() => {
            setExpandedCollection(collection.id);

            // Mobile: auto-collapse after delay
            if (isMobile) {
              setTimeout(() => {
                setIsAutoCollapsing(true);
                setTimeout(() => {
                  setIsDrawerOpen(false);
                  setIsAutoCollapsing(false);
                }, 600); // Ghost animation duration
              }, 2500); // Show subcollections for 2.5s
            }
          }, 300); // Simulate page load delay
        }
      } else if (collection.subcollections.length === 0) {
        // No subcollections: close drawer
        setTimeout(() => {
          setIsDrawerOpen(false);
          setExpandedCollection(null);
        }, 300);
      } else {
        // Navigating to a subcollection - keep drawer open with parent expanded
        setTimeout(() => {
          setExpandedCollection(collection.id);
        }, 100);
      }
    } else if (slug === '/') {
      // Going home: collapse to top-level
      setExpandedCollection(null);
      if (!isMobile) {
        setTimeout(() => setIsDrawerOpen(false), 300);
      }
    }
  };

  // Get drawer width based on depth
  const getDrawerWidth = () => {
    if (!expandedCollection) return 240;

    const collection = MOCK_COLLECTIONS.find(c => c.id === expandedCollection);
    const hasSubcollections = collection && collection.subcollections.length > 0;

    // For now, just one level of depth
    return hasSubcollections ? 280 : 240;
  };

  // Get breadcrumbs
  const getBreadcrumbs = () => {
    const { collection, subcollection } = getCurrentLocation();
    const crumbs = [{ name: 'Home', slug: '/' }];

    if (collection) {
      crumbs.push({ name: collection.name, slug: collection.slug });
    }

    if (subcollection) {
      crumbs.push({ name: subcollection.name, slug: subcollection.slug });
    }

    return crumbs;
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const drawerWidth = getDrawerWidth();
  const { collection: currentCollection, subcollection: currentSubcollection } = getCurrentLocation();
  const breadcrumbs = getBreadcrumbs();

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

          {/* Breadcrumbs (Desktop) */}
          {!isMobile && breadcrumbs.length > 1 && (
            <div className="flex items-center gap-2 text-sm text-white/70 ml-4">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.slug} className="flex items-center gap-2">
                  {index > 0 && <span className="text-white/40">/</span>}
                  <button
                    onClick={() => navigateTo(crumb.slug, true)}
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
        className={`fixed top-16 bottom-0 left-0 z-40 bg-black/80 backdrop-blur-lg border-r border-white/20 transition-all duration-300 ${
          isDrawerOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
        style={{ width: `${drawerWidth}px` }}
      >
        <div className="h-full overflow-y-auto p-4">
          <nav className="space-y-1">
            {MOCK_COLLECTIONS.map((collection) => {
              const isExpanded = expandedCollection === collection.id;
              const isActive = currentCollection?.id === collection.id;
              const hasSubcollections = collection.subcollections.length > 0;

              return (
                <div key={collection.id}>
                  {/* Top-level collection */}
                  <button
                    onClick={() => navigateTo(collection.slug)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive && !currentSubcollection
                        ? 'bg-white/10 border border-white/20 text-white font-semibold'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {collection.name}
                  </button>

                  {/* Subcollections (if expanded) */}
                  {isExpanded && hasSubcollections && (
                    <div
                      className={`ml-4 mt-1 space-y-1 transition-all duration-300 ${
                        isAutoCollapsing ? 'animate-ghost-out' : ''
                      }`}
                    >
                      {collection.subcollections.map((subcollection, index) => {
                        const isSubActive = currentSubcollection?.id === subcollection.id;

                        return (
                          <button
                            key={subcollection.id}
                            onClick={() => navigateTo(subcollection.slug)}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                              isSubActive
                                ? 'bg-white/10 border border-white/20 text-white font-medium animate-pulse-color'
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                            }`}
                            style={{
                              transitionDelay: `${index * 30}ms`,
                            }}
                          >
                            {subcollection.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Demo Content Area */}
      <div className="pt-16">
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl font-bold text-white">
                {currentSubcollection?.name || currentCollection?.name || 'Home'}
              </h1>
              {breadcrumbs.length > 1 && (
                <p className="text-white/70">
                  {breadcrumbs.map(c => c.name).join(' > ')}
                </p>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Progressive Disclosure Demo
              </h2>
              <div className="text-white/70 space-y-4">
                <p>
                  <strong>Try this:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Click the hamburger menu in the top-left</li>
                  <li>Click "Love" (has subcollections)</li>
                  <li>Watch the drawer expand to show subcollections!</li>
                  <li>Click a subcollection (e.g., "Cuddling")</li>
                  <li>Navigate between subcollections - drawer stays open</li>
                  <li>Click "Dark Fantasy" (no subcollections) - drawer closes</li>
                  <li>On mobile: Notice the delayed auto-collapse with pulse hint</li>
                </ol>

                <div className="pt-4 border-t border-white/10 mt-6">
                  <p className="text-sm text-white/50">
                    <strong>Current state:</strong><br/>
                    Path: {currentPath}<br/>
                    Drawer: {isDrawerOpen ? 'Open' : 'Closed'}<br/>
                    Expanded: {expandedCollection || 'None'}<br/>
                    Mobile: {isMobile ? 'Yes' : 'No'}<br/>
                    Drawer width: {drawerWidth}px
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

        @keyframes pulse-color {
          0%, 100% {
            background-color: rgba(255, 255, 255, 0.1);
            transform: scale(1);
          }
          50% {
            background-color: rgba(147, 197, 253, 0.2);
            transform: scale(1.02);
          }
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

        .animate-pulse-color {
          animation: pulse-color 2s ease-in-out infinite;
        }

        .animate-ghost-out {
          animation: ghost-out 600ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}
