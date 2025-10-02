/**
 * Reaction Display Component
 *
 * Displays reaction counts as an overlay in the top-right corner of the carousel image.
 * Shows emoji and count with a subtle faded background.
 *
 * Visual Design:
 * ┌─────────────────────────────────┐
 * │                        [3❤️ 2🔥]│ ← This component
 * │                                 │
 * │         Image Here              │
 * │                                 │
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-01
 */

'use client';

import { useEffect, useState } from 'react';
import type { ReactionCounts } from '@/lib/api/reactions-stub';
import { getReactions } from '@/lib/api/reactions-stub';

interface ReactionDisplayProps {
  imageId: string;
  className?: string;
  refreshTrigger?: number; // Increment to force refresh
}

export default function ReactionDisplay({
  imageId,
  className = '',
  refreshTrigger = 0
}: ReactionDisplayProps) {
  const [reactions, setReactions] = useState<ReactionCounts>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reactions when imageId changes or refreshTrigger updates
  useEffect(() => {
    let mounted = true;

    const fetchReactions = async () => {
      setIsLoading(true);
      try {
        const data = await getReactions(imageId);
        if (mounted) {
          setReactions(data);
        }
      } catch (error) {
        console.error('[ReactionDisplay] Failed to fetch reactions:', error);
        if (mounted) {
          setReactions({});
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReactions();

    return () => {
      mounted = false;
    };
  }, [imageId, refreshTrigger]);

  // Get sorted reactions (by count, descending)
  const sortedReactions = Object.entries(reactions)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Show top 5 reactions max

  // Don't render if no reactions or still loading
  if (isLoading || sortedReactions.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        absolute top-4 right-4 z-20
        bg-black/70 backdrop-blur-sm
        border border-white/10
        rounded-lg px-3 py-2
        flex items-center gap-2
        transition-all duration-300
        hover:bg-black/80
        ${className}
      `}
      role="status"
      aria-label="Reaction counts"
    >
      {sortedReactions.map(([emoji, count]) => (
        <div
          key={emoji}
          className="flex items-center gap-1 text-white"
          title={`${count} ${emoji} reaction${count === 1 ? '' : 's'}`}
        >
          <span className="text-lg leading-none">{emoji}</span>
          <span className="text-sm font-medium text-white/90">{count}</span>
        </div>
      ))}
    </div>
  );
}
