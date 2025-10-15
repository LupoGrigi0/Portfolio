/**
 * TopBar Component - Breadcrumbs in top navigation bar
 *
 * Displays breadcrumb trail next to the logo, matching nav-real-api styling.
 * Integrated into the Navigation component's top bar.
 *
 * @author Claude (Sonnet 4.5)
 * @created 2025-10-14
 * @based-on nav-real-api by Kai v3
 */

'use client';

import { useRouter } from 'next/navigation';
import type { NavigationConfig } from '@/lib/api-client';

interface BreadcrumbItem {
  name: string;
  slug: string;
}

interface TopBarProps {
  config?: NavigationConfig;
  breadcrumbs: BreadcrumbItem[];
}

export default function TopBar({ config, breadcrumbs }: TopBarProps) {
  const router = useRouter();

  const enabled = config?.breadcrumbs?.enabled !== false;

  if (!enabled || breadcrumbs.length <= 1) {
    return null;
  }

  const handleNavigate = (slug: string) => {
    if (slug === '/') {
      router.push('/');
    } else {
      router.push(`/collections/${slug}`);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-white/70">
      {breadcrumbs.map((crumb, index) => (
        <div key={`breadcrumb-${index}-${crumb.slug}`} className="flex items-center gap-2">
          <span className="text-white/40">/</span>
          <button
            onClick={() => handleNavigate(crumb.slug)}
            className={`hover:text-white transition-colors ${
              index === breadcrumbs.length - 1 ? 'text-white font-semibold' : ''
            }`}
          >
            {crumb.name}
          </button>
        </div>
      ))}
    </div>
  );
}
