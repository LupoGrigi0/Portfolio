/**
 * Breadcrumbs Component
 *
 * Shows breadcrumb navigation trail (Home > Collections > Current)
 * Configurable via site config
 *
 * @author Claude (Sonnet 4.5)
 * @created 2025-10-14
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { NavigationConfig } from '@/lib/api-client';

interface BreadcrumbsProps {
  config?: NavigationConfig['breadcrumbs'];
  currentCollectionName?: string;
}

export default function Breadcrumbs({ config, currentCollectionName }: BreadcrumbsProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Default config
  const enabled = config?.enabled !== false;
  const separator = config?.separator || '/';
  const showHome = config?.showHome !== false;
  const homeLabel = config?.homeLabel || 'Home';

  if (!enabled) {
    return null;
  }

  // Build breadcrumb trail
  const crumbs: Array<{ label: string; path: string | null }> = [];

  // Always add Home if enabled
  if (showHome) {
    crumbs.push({ label: homeLabel, path: '/' });
  }

  // Parse current path
  if (pathname && pathname !== '/') {
    if (pathname.startsWith('/collections/')) {
      crumbs.push({ label: 'Collections', path: null });

      if (currentCollectionName) {
        crumbs.push({ label: currentCollectionName, path: null });
      }
    }
  }

  // Don't render if only one crumb (Home)
  if (crumbs.length <= 1) {
    return null;
  }

  const crumbStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#ffffff',
    opacity: 0.8,
  };

  const linkStyle: React.CSSProperties = {
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'opacity 0.2s ease',
  };

  const separatorStyle: React.CSSProperties = {
    opacity: 0.5,
    userSelect: 'none',
  };

  const currentStyle: React.CSSProperties = {
    opacity: 1,
    fontWeight: '500',
  };

  return (
    <nav style={crumbStyle} aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const isClickable = crumb.path !== null;

        return (
          <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isClickable ? (
              <span
                style={{ ...linkStyle, ...(isLast ? currentStyle : {}) }}
                onClick={() => router.push(crumb.path!)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  if (!isLast) {
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
              >
                {crumb.label}
              </span>
            ) : (
              <span style={isLast ? currentStyle : {}}>{crumb.label}</span>
            )}

            {!isLast && (
              <span style={separatorStyle}>{separator}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
