/**
 * Navigation Component
 *
 * Responsive hamburger menu with scroll-based fade behavior.
 * Features smooth animations and mobile-first design.
 *
 * @author Zara (UI/UX & React Components Specialist)
 * @created 2025-09-29
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NavigationProps {
  logoSrc?: string;
  menuItems?: NavMenuItem[];
}

interface NavMenuItem {
  label: string;
  href: string;
  featured?: boolean;
}

export default function Navigation({ logoSrc, menuItems = [] }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Scroll-based fade behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show nav when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsVisible(false);
        setIsMenuOpen(false); // Close menu when hiding nav
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Navigation Bar */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start h-16 gap-4">
            {/* Hamburger Menu Button - Now on the left */}
            <button
              onClick={toggleMenu}
              className="relative w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
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

            {/* Logo / Home Link */}
            <Link
              href="/"
              className="flex items-center hover:opacity-80 transition-opacity"
              aria-label="Go to homepage"
            >
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Lupo Grigio Portfolio"
                  className="h-10 w-auto"
                />
              ) : (
                <div className="text-white text-xl font-semibold tracking-tight">
                  Lupo Grigio
                </div>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 top-16 bg-black/95 backdrop-blur-xl transition-all duration-300 ${
          isMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <ul className="space-y-2">
            {menuItems.length > 0 ? (
              menuItems.map((item, index) => (
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
              ))
            ) : (
              <li className="text-white/60 px-4 py-3">
                No menu items available
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}