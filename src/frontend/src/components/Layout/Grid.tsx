/**
 * Grid Layout Component
 *
 * Mobile-first responsive grid system with progressive transparency.
 * Supports multiple layout variants for different content types.
 *
 * @author Zara (UI/UX & React Components Specialist)
 * @created 2025-09-29
 */

'use client';

import { ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  variant?: 'single' | 'side-by-side' | 'masonry' | 'stacked';
  spacing?: 'tight' | 'normal' | 'loose';
  columns?: number;
  className?: string;
}

export default function Grid({
  children,
  variant = 'single',
  spacing = 'normal',
  columns = 3,
  className = ''
}: GridProps) {
  // Spacing configurations
  const spacingClasses = {
    tight: 'gap-2 sm:gap-3',
    normal: 'gap-4 sm:gap-6 lg:gap-8',
    loose: 'gap-8 sm:gap-12 lg:gap-16'
  };

  // Variant-specific layouts
  const variantClasses = {
    single: 'flex flex-col',
    'side-by-side': 'grid grid-cols-1 md:grid-cols-2',
    masonry: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`,
    stacked: 'flex flex-col'
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${spacingClasses[spacing]}
        ${className}
      `}
      data-layout-variant={variant}
      data-spacing={spacing}
    >
      {children}
    </div>
  );
}

/**
 * ContentBlock Component
 *
 * Individual content container with progressive transparency edges.
 * Creates the floating effect over dynamic backgrounds.
 */
interface ContentBlockProps {
  children: ReactNode;
  backgroundColor?: string;
  backgroundOpacity?: number;
  className?: string;
}

export function ContentBlock({
  children,
  backgroundColor = 'rgba(0, 0, 0, 0.3)',
  backgroundOpacity = 0.8,
  className = ''
}: ContentBlockProps) {
  return (
    <div
      className={`
        relative
        rounded-2xl
        overflow-hidden
        backdrop-blur-md
        ${className}
      `}
      style={{
        backgroundColor: backgroundColor,
        opacity: backgroundOpacity
      }}
    >
      {/* Progressive transparency mask */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              transparent 0%,
              transparent 50%,
              rgba(0, 0, 0, 0.1) 80%,
              rgba(0, 0, 0, 0.3) 100%
            )
          `
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-12">
        {children}
      </div>
    </div>
  );
}

/**
 * ResponsiveContainer Component
 *
 * Main container that manages page-level responsive behavior.
 */
interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  className?: string;
}

export function ResponsiveContainer({
  children,
  maxWidth = 'xl',
  padding = true,
  className = ''
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = padding ? 'px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16' : '';

  return (
    <div
      className={`
        w-full
        mx-auto
        ${maxWidthClasses[maxWidth]}
        ${paddingClasses}
        ${className}
      `}
    >
      {children}
    </div>
  );
}