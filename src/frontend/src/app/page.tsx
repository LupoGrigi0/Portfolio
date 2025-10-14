/**
 * Home Page
 *
 * Renders the "home" collection using the PageRenderer.
 * The home collection is configured via content/home/config.json
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-13
 */

'use client';

import PageRenderer from '@/components/PageRenderer';

export default function HomePage() {
  return <PageRenderer collectionSlug="home" />;
}
