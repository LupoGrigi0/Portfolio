/**
 * Social Reactions Component
 *
 * Interactive emoji picker for carousel images.
 * Displays as a floating panel at the bottom-left of the carousel.
 *
 * Visual Design:
 * ┌─────────────────────────────────┐
 * │                                 │
 * │         Image Here              │
 * │                                 │
 * │ [❤️💀🍑❤️‍🔥🤢☢️👍👎➕]         │ ← This component
 * └─────────────────────────────────┘
 *
 * Features:
 * - Quick emoji reactions
 * - Animated click feedback
 * - Expandable palette (➕ button - stub for now)
 * - Configurable emoji set
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-01
 */

'use client';

import { useState } from 'react';
import { addReaction } from '@/lib/api/reactions-stub';
import type { ReactionVisibility } from './hooks/useAutoHideReactions';

// Default emoji set
const DEFAULT_EMOJIS = [
  '❤️',      // heart
  '💀',      // skull
  '🍑',      // peach
  '❤️‍🔥',   // flaming heart
  '🤢',      // sick
  '☢️',      // nuke
  '👍',      // thumb up
  '👎',      // thumb down
  '➕'       // plus (opens emoji palette - stub)
];

interface SocialReactionsProps {
  imageId: string;
  emojis?: string[];
  onReaction?: (emoji: string, imageId: string) => void;
  onRefresh?: () => void; // Callback to trigger reaction count refresh
  visibility?: ReactionVisibility; // Auto-hide visibility state
  className?: string;
}

export default function SocialReactions({
  imageId,
  emojis = DEFAULT_EMOJIS,
  onReaction,
  onRefresh,
  visibility = 'visible',
  className = ''
}: SocialReactionsProps) {
  const [clickedEmoji, setClickedEmoji] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get visibility styles based on state
  const getVisibilityStyles = () => {
    switch (visibility) {
      case 'visible':
        return 'opacity-100 translate-y-0';
      case 'semi-faded':
        return 'opacity-50 translate-y-0';
      case 'hidden':
        return 'opacity-0 translate-y-4';
      default:
        return 'opacity-100 translate-y-0';
    }
  };

  const handleEmojiClick = async (emoji: string) => {
    // Handle ➕ special case (emoji palette - stub)
    if (emoji === '➕') {
      console.log('[SocialReactions] ➕ clicked - emoji palette coming soon!');
      alert('📝 Emoji palette expansion coming soon!\n\nFor now, use the default emoji set.');
      return;
    }

    // Prevent double-clicks while submitting
    if (isSubmitting) {
      return;
    }

    // Visual feedback
    setClickedEmoji(emoji);
    setTimeout(() => setClickedEmoji(null), 300);

    // Submit reaction
    setIsSubmitting(true);
    try {
      const result = await addReaction(imageId, emoji);
      console.log('[SocialReactions] Reaction submitted', {
        imageId,
        emoji,
        count: result.count,
        total: result.total
      });

      // Call callback if provided
      onReaction?.(emoji, imageId);

      // Trigger refresh of reaction display
      onRefresh?.();
    } catch (error) {
      console.error('[SocialReactions] Failed to submit reaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`
        absolute bottom-6 left-6 z-20
        bg-black/70 backdrop-blur-sm
        border border-white/10
        rounded-full px-4 py-3
        flex items-center gap-3
        transition-all duration-500 ease-in-out
        hover:bg-black/80 hover:scale-105
        ${getVisibilityStyles()}
        ${className}
      `}
      role="toolbar"
      aria-label="Reaction picker"
    >
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          disabled={isSubmitting}
          className={`
            text-2xl leading-none
            transition-all duration-200
            hover:scale-125
            active:scale-95
            focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full
            disabled:opacity-50 disabled:cursor-not-allowed
            ${clickedEmoji === emoji ? 'scale-150 animate-pulse' : ''}
          `}
          title={emoji === '➕' ? 'More reactions (coming soon)' : `React with ${emoji}`}
          aria-label={emoji === '➕' ? 'More reactions' : `React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}

      {/* Loading indicator (subtle) */}
      {isSubmitting && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
