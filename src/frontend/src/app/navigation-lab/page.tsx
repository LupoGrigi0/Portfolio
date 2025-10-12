/**
 * Navigation Lab
 *
 * Experimental playground for testing navigation styles and behaviors.
 * Design through play - real-time controls for position, style, and interactions.
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-06
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCollections, type Collection } from '@/lib/api-client';

// Mock menu items for testing
const MOCK_MENU_ITEMS = [
  { label: 'Home', href: '/', featured: false },
  { label: 'Collections', href: '/collections', featured: false },
  { label: 'About', href: '/about', featured: false },
  { label: 'Contact', href: '/contact', featured: true },
];

type NavPosition = 'top' | 'bottom' | 'left' | 'right';
type NavStyle = 'glassmorphic' | 'solid' | 'gradient' | 'minimal';
type ScrollBehavior = 'sticky' | 'hide-on-scroll' | 'always-visible' | 'floating';
type MenuType = 'hamburger' | 'full-bar' | 'sidebar' | 'dock';

export default function NavigationLabPage() {
  // Navigation state
  const [navPosition, setNavPosition] = useState<NavPosition>('top');
  const [navStyle, setNavStyle] = useState<NavStyle>('glassmorphic');
  const [scrollBehavior, setScrollBehavior] = useState<ScrollBehavior>('hide-on-scroll');
  const [menuType, setMenuType] = useState<MenuType>('hamburger');
  const [menuItems, setMenuItems] = useState(MOCK_MENU_ITEMS);

  // Visual customization
  const [bgOpacity, setBgOpacity] = useState(30);
  const [borderOpacity, setBorderOpacity] = useState(10);
  const [blur, setBlur] = useState(12);

  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Collections for dynamic menu
  const [collections, setCollections] = useState<Collection[]>([]);
  const [useCollectionsAsMenu, setUseCollectionsAsMenu] = useState(false);

  // Load collections from backend
  useEffect(() => {
    async function loadCollections() {
      const data = await getCollections();
      setCollections(data);
    }
    loadCollections();
  }, []);

  // Scroll behavior
  useEffect(() => {
    if (scrollBehavior !== 'hide-on-scroll') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsVisible(false);
        setIsMenuOpen(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollBehavior, lastScrollY]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Update menu items based on collections
  useEffect(() => {
    if (useCollectionsAsMenu && collections.length > 0) {
      setMenuItems([
        { label: 'Home', href: '/', featured: false },
        ...collections.slice(0, 8).map(c => ({
          label: c.name,
          href: `/collections/${c.slug}`,
          featured: false,
        })),
      ]);
    } else {
      setMenuItems(MOCK_MENU_ITEMS);
    }
  }, [useCollectionsAsMenu, collections]);

  // Get nav container classes based on settings
  const getNavContainerClasses = () => {
    let classes = 'fixed z-50 transition-all duration-300 ';

    // Position
    switch (navPosition) {
      case 'top':
        classes += 'top-0 left-0 right-0 ';
        if (scrollBehavior === 'hide-on-scroll') {
          classes += isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0';
        }
        break;
      case 'bottom':
        classes += 'bottom-0 left-0 right-0 ';
        break;
      case 'left':
        classes += 'top-0 bottom-0 left-0 w-64 ';
        break;
      case 'right':
        classes += 'top-0 bottom-0 right-0 w-64 ';
        break;
    }

    return classes;
  };

  // Get nav bar style classes
  const getNavBarClasses = () => {
    let classes = 'transition-all duration-300 ';

    // Style
    switch (navStyle) {
      case 'glassmorphic':
        classes += `bg-black/${bgOpacity} backdrop-blur-${blur >= 10 ? 'md' : 'sm'} border-white/${borderOpacity} `;
        break;
      case 'solid':
        classes += `bg-black border-white/${borderOpacity} `;
        break;
      case 'gradient':
        classes += `bg-gradient-to-b from-black/${bgOpacity} to-transparent border-white/${borderOpacity} `;
        break;
      case 'minimal':
        classes += `bg-transparent border-white/${borderOpacity} `;
        break;
    }

    // Border
    if (navPosition === 'top') {
      classes += 'border-b ';
    } else if (navPosition === 'bottom') {
      classes += 'border-t ';
    } else if (navPosition === 'left') {
      classes += 'border-r ';
    } else if (navPosition === 'right') {
      classes += 'border-l ';
    }

    return classes;
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      {/* Control Panel */}
      <div className="fixed top-4 right-4 w-80 max-h-[calc(100vh-2rem)] bg-black/80 backdrop-blur-lg border border-white/20 rounded-lg overflow-hidden shadow-2xl z-[60]">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">🧭 Navigation Lab</h2>
          <p className="text-xs text-white/60 mt-1">Design through play</p>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Position */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-semibold">Position</label>
            <div className="grid grid-cols-2 gap-2">
              {(['top', 'bottom', 'left', 'right'] as NavPosition[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setNavPosition(pos)}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    navPosition === pos
                      ? 'bg-blue-500/30 border border-blue-500/50 text-white'
                      : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-semibold">Visual Style</label>
            <div className="grid grid-cols-2 gap-2">
              {(['glassmorphic', 'solid', 'gradient', 'minimal'] as NavStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => setNavStyle(style)}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    navStyle === style
                      ? 'bg-purple-500/30 border border-purple-500/50 text-white'
                      : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Scroll Behavior */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-semibold">Scroll Behavior</label>
            <select
              value={scrollBehavior}
              onChange={(e) => setScrollBehavior(e.target.value as ScrollBehavior)}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
            >
              <option value="sticky">Sticky</option>
              <option value="hide-on-scroll">Hide on Scroll Down</option>
              <option value="always-visible">Always Visible</option>
              <option value="floating">Floating</option>
            </select>
          </div>

          {/* Menu Type */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-semibold">Menu Type</label>
            <select
              value={menuType}
              onChange={(e) => setMenuType(e.target.value as MenuType)}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
            >
              <option value="hamburger">Hamburger</option>
              <option value="full-bar">Full Nav Bar</option>
              <option value="sidebar">Sidebar</option>
              <option value="dock">Dock (macOS style)</option>
            </select>
          </div>

          {/* Background Opacity */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-semibold">
              Background Opacity: <span className="text-white">{bgOpacity}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={bgOpacity}
              onChange={(e) => setBgOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Border Opacity */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-semibold">
              Border Opacity: <span className="text-white">{borderOpacity}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={borderOpacity}
              onChange={(e) => setBorderOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Blur */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-semibold">
              Blur: <span className="text-white">{blur}px</span>
            </label>
            <input
              type="range"
              min="0"
              max="24"
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Use Collections as Menu */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={useCollectionsAsMenu}
                onChange={(e) => setUseCollectionsAsMenu(e.target.checked)}
                className="rounded"
              />
              Use Collections as Menu Items
            </label>
            {useCollectionsAsMenu && (
              <p className="text-xs text-white/50">
                Loaded {collections.length} collections from backend
              </p>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-white/50 pt-4 border-t border-white/10">
            <p>Scroll the page to test scroll behaviors</p>
            <p className="mt-2">Try different combinations to find your perfect nav!</p>
          </div>
        </div>
      </div>

      {/* Navigation Component */}
      <nav className={getNavContainerClasses()} role="navigation" aria-label="Main navigation">
        <div className={getNavBarClasses()}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo / Brand */}
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <div className="text-white text-xl font-semibold tracking-tight">
                  Lupo Grigio
                </div>
              </Link>

              {/* Hamburger Button (for hamburger menu type) */}
              {menuType === 'hamburger' && (
                <button
                  onClick={toggleMenu}
                  className="relative w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  <div className="w-6 h-5 flex flex-col justify-between">
                    <span
                      className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                        isMenuOpen ? 'rotate-45 translate-y-2' : ''
                      }`}
                    />
                    <span
                      className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                        isMenuOpen ? 'opacity-0' : ''
                      }`}
                    />
                    <span
                      className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                        isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                      }`}
                    />
                  </div>
                </button>
              )}

              {/* Full Nav Bar (for full-bar menu type) */}
              {menuType === 'full-bar' && (
                <div className="flex items-center gap-6">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-white/80 hover:text-white transition-colors text-sm"
                    >
                      {item.label}
                      {item.featured && <span className="ml-1 text-xs">★</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hamburger Menu Overlay */}
        {menuType === 'hamburger' && (
          <div
            className={`fixed inset-0 ${navPosition === 'top' ? 'top-16' : navPosition === 'bottom' ? 'bottom-16' : ''} bg-black/95 backdrop-blur-xl transition-all duration-300 ${
              isMenuOpen
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
              <ul className="space-y-2">
                {menuItems.map((item, index) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block px-4 py-3 text-lg text-white hover:bg-white/10 rounded-lg transition-all duration-200 ${
                        isMenuOpen
                          ? 'translate-x-0 opacity-100'
                          : '-translate-x-4 opacity-0'
                      }`}
                      style={{
                        transitionDelay: isMenuOpen ? `${index * 50}ms` : '0ms'
                      }}
                    >
                      {item.label}
                      {item.featured && (
                        <span className="ml-2 text-xs text-white/60">★</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </nav>

      {/* Demo Content (for scroll testing) */}
      <div className="pr-96 pt-24 pb-24 px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-white">Navigation Lab</h1>
            <p className="text-xl text-white/70">
              Experiment with navigation styles in real-time
            </p>
          </div>

          {/* Scroll content sections */}
          {[1, 2, 3, 4, 5, 6].map((section) => (
            <div
              key={section}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Section {section}
              </h2>
              <p className="text-white/70 leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                commodo consequat.
              </p>
              <p className="text-white/70 leading-relaxed mt-4">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
          ))}

          {/* Scroll indicator */}
          <div className="text-center text-white/50 py-8">
            <p>↓ Keep scrolling to test scroll behaviors ↓</p>
          </div>

          {/* More scroll sections */}
          {[7, 8, 9, 10].map((section) => (
            <div
              key={section}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Section {section}
              </h2>
              <p className="text-white/70 leading-relaxed">
                More content to enable scrolling and testing the navigation behavior.
                Try scrolling up and down to see how the nav responds based on your
                selected scroll behavior setting.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
