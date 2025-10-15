/**
 * Collection Detail Page
 *
 * Dynamic route for individual collection pages.
 * Uses PageRenderer to display collection based on its config.json
 *
 * @author Claude (Sonnet 4.5)
 * @created 2025-10-14
 */

'use client';

import PageRenderer from '@/components/PageRenderer';
import { use } from 'react';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = use(params);

  return <PageRenderer collectionSlug={slug} />;
}
