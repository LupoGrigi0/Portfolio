/**
 * Navigation Component - Hamburger menu with drawer and collection tree
 *
 * Polished design based on nav-real-api demo with:
 * - Clean top navigation bar with backdrop blur
 * - Smooth slide-in drawer
 * - Hierarchical collection tree with triangle pips
 * - Professional styling and animations
 *
 * @author Claude (Sonnet 4.5)
 * @created 2025-10-14
 * @based-on nav-real-api by Kai v3
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Collection, NavigationConfig } from '@/lib/api-client';

interface NavigationProps {
  config?: NavigationConfig;
  collections: Collection[];
  currentCollectionName?: string;
  onClose?: () => void;
}

interface CollectionTreeItemProps {
  collection: Collection;
  currentSlug: string | null;
  indent: number;
  indentSpacing: number;
  onNavigate: (slug: string) => void;
  expandedCollections: Set<string>;
  onToggleExpand: (slug: string) => void;
}

function CollectionTreeItem({
  collection,
  currentSlug,
  indent,
  indentSpacing,
  onNavigate,
  expandedCollections,
  onToggleExpand
}: CollectionTreeItemProps) {
  const hasSubcollections = collection.subcollections && collection.subcollections.length > 0;
  const isActive = collection.slug === currentSlug;
  const isExpanded = expandedCollections.has(collection.slug);

  // Debug log
  if (hasSubcollections && indent === 0) {
    console.log(`[Nav] ${collection.name} has ${collection.subcollections?.length} subcollections, expanded:`, isExpanded);
  }

  return (
    <div style={{ marginLeft: indent > 0 ? `${indentSpacing}px` : '0' }}>
      <button
        onClick={() => {
          onNavigate(collection.slug);
          if (hasSubcollections) {
            onToggleExpand(collection.slug);
          }
        }}
        className={`collection-nav-item w-full text-left px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-between ${
          isActive
            ? 'bg-white/10 border border-white/20 text-white font-semibold'
            : 'text-white/80'
        }`}
      >
        <span>{collection.name || collection.title}</span>
        {hasSubcollections && (
          <span className="ml-2 text-white/50 text-sm">▸</span>
        )}
      </button>

      {/* Subcollections */}
      {isExpanded && hasSubcollections && (
        <div className="mt-1 space-y-1">
          {collection.subcollections!.map((subcollection, index) => {
            // Handle Viktor's format: subcollections can be strings (slugs) or full objects
            let subCollectionObj: Collection;

            if (typeof subcollection === 'string') {
              // Convert slug string to minimal Collection object
              subCollectionObj = {
                slug: subcollection,
                name: subcollection
                  .replace(/^[^-]+-/, '') // Remove "gynoids-" prefix
                  .replace(/-/g, ' ')     // Replace dashes with spaces
                  .replace(/\b\w/g, l => l.toUpperCase()), // Title case
                id: subcollection,
                imageCount: 0,
                videoCount: 0,
                subcollections: [],
              };
            } else {
              // Already a full object, use title or name
              subCollectionObj = {
                ...subcollection,
                name: subcollection.title || subcollection.name || subcollection.slug,
              };
            }

            return (
              <CollectionTreeItem
                key={`${subCollectionObj.slug}-${index}`}
                collection={subCollectionObj}
                currentSlug={currentSlug}
                indent={indent + 1}
                indentSpacing={indentSpacing}
                onNavigate={onNavigate}
                expandedCollections={expandedCollections}
                onToggleExpand={onToggleExpand}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Navigation({ config, collections, currentCollectionName, onClose }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const router = useRouter();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Extract current collection slug from pathname
  const currentSlug = pathname?.startsWith('/collections/')
    ? pathname.split('/')[2]
    : pathname === '/' ? 'home' : null;

  // Config values (with defaults matching nav-real-api)
  const indentSpacing = config?.styling?.subcollectionIndent || 16;
  const drawerWidth = config?.styling?.drawerWidth || 240;
  const transitionMs = config?.timing?.drawerTransitionMs || 300;

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // ESC to close
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleNavigate = (slug: string) => {
    if (slug === 'home') {
      router.push('/');
    } else {
      router.push(`/collections/${slug}`);
    }
    // Keep drawer open for easier navigation
    // User can close manually or click outside
  };

  const handleToggleExpand = (slug: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  return (
    <>
      {/* Top Navigation Bar - matches nav-real-api styling */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center h-16 px-4 gap-4">
          {/* Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-all duration-300 ${
              !isOpen ? 'animate-pulse-subtle' : ''
            }`}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                  isOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                  isOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                  isOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>

          {/* Logo/Site Name */}
          <button
            onClick={() => handleNavigate('home')}
            className="text-white text-xl font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            Lupo Grigio
          </button>

          {/* Breadcrumbs (Desktop) */}
          {currentCollectionName && (
            <div className="hidden md:flex items-center gap-2 text-sm text-white/70">
              <span className="text-white/40">/</span>
              <span className="text-white font-semibold">{currentCollectionName}</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />
        </div>
      </div>

      {/* Drawer Overlay (for click-outside) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          style={{ top: '64px' }} // Below top bar
        />
      )}

      {/* Drawer - matches nav-real-api styling */}
      <div
        ref={drawerRef}
        className={`fixed top-16 bottom-0 left-0 z-40 bg-black/80 backdrop-blur-lg border-r border-white/20 transition-all ${
          isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
        style={{
          width: `${drawerWidth}px`,
          transitionDuration: `${transitionMs}ms`,
        }}
      >
        <div className="h-full overflow-y-auto p-4">
          <nav className="space-y-1">
            {/* Home link (when viewing a collection) */}
            {currentSlug && currentSlug !== 'home' && (
              <>
                <button
                  onClick={() => handleNavigate('home')}
                  className="collection-nav-item w-full text-left px-4 py-2 rounded-lg transition-all duration-200 text-white/80 flex items-center gap-2"
                >
                  <img src="/favicon.ico" alt="Home" className="w-4 h-4" />
                  <span>Home</span>
                </button>
                <div className="border-b border-white/10 my-2" />
              </>
            )}

            {/* Collections tree */}
            {collections.map((collection, index) => (
              <CollectionTreeItem
                key={`${collection.slug}-${index}`}
                collection={collection}
                currentSlug={currentSlug}
                indent={0}
                indentSpacing={indentSpacing}
                onNavigate={handleNavigate}
                expandedCollections={expandedCollections}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Custom animations and styles - matching nav-real-api */}
      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        /* Pure CSS hover - no JS, no re-renders, instant performance */
        :global(.collection-nav-item:not(.bg-white\/10):hover) {
          background-color: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 1);
        }
      `}</style>
    </>
  );
}
