/**
 * Reactions API Stub
 *
 * Stub implementation for social reactions on carousel images.
 * This module provides mock API calls that can be easily replaced
 * with real backend integration later.
 *
 * STUB ONLY - No actual backend calls are made.
 * All data is mock/random for UI testing purposes.
 *
 * TODO: Replace with real API calls when backend is ready:
 * - POST /api/reactions/:imageId - Add reaction
 * - GET /api/reactions/:imageId - Get reaction counts
 * - DELETE /api/reactions/:imageId/:emoji - Remove reaction
 *
 * @author Kai v3 (Carousel & Animation Specialist)
 * @created 2025-10-01
 */

export interface ReactionCounts {
  [emoji: string]: number;
}

export interface ReactionResponse {
  success: boolean;
  count: number;
  total: number;
}

// In-memory storage for demo purposes (resets on page reload)
const mockReactionStorage: Map<string, ReactionCounts> = new Map();

/**
 * Add a reaction to an image
 *
 * @param imageId - The ID of the image
 * @param emoji - The emoji reaction to add
 * @returns Promise with reaction count data
 */
export async function addReaction(
  imageId: string,
  emoji: string
): Promise<ReactionResponse> {
  console.log('[STUB API] Adding reaction', { imageId, emoji });

  // Simulate network delay (100-300ms)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

  // Get or create reaction data for this image
  const reactions = mockReactionStorage.get(imageId) || {};
  reactions[emoji] = (reactions[emoji] || 0) + 1;
  mockReactionStorage.set(imageId, reactions);

  // Calculate total reactions
  const total = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  console.log('[STUB API] Reaction added successfully', {
    imageId,
    emoji,
    count: reactions[emoji],
    total,
    allReactions: reactions
  });

  // TODO: Replace with real API call
  // const response = await fetch(`/api/reactions/${imageId}`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ emoji })
  // });
  // return response.json();

  return {
    success: true,
    count: reactions[emoji],
    total
  };
}

/**
 * Get all reaction counts for an image
 *
 * @param imageId - The ID of the image
 * @returns Promise with reaction counts object
 */
export async function getReactions(imageId: string): Promise<ReactionCounts> {
  console.log('[STUB API] Getting reactions', { imageId });

  // Simulate network delay (50-150ms)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

  // Get stored reactions or generate mock data
  let reactions = mockReactionStorage.get(imageId);

  if (!reactions) {
    // Generate some mock initial data for demo
    reactions = {
      '❤️': Math.floor(Math.random() * 20),
      '🔥': Math.floor(Math.random() * 15),
      '💀': Math.floor(Math.random() * 8),
      '👍': Math.floor(Math.random() * 12),
    };
    mockReactionStorage.set(imageId, reactions);
  }

  console.log('[STUB API] Reactions retrieved', {
    imageId,
    reactions,
    total: Object.values(reactions).reduce((sum, count) => sum + count, 0)
  });

  // TODO: Replace with real API call
  // const response = await fetch(`/api/reactions/${imageId}`);
  // return response.json();

  return reactions;
}

/**
 * Remove a reaction from an image
 *
 * @param imageId - The ID of the image
 * @param emoji - The emoji reaction to remove
 * @returns Promise with updated reaction count
 */
export async function removeReaction(
  imageId: string,
  emoji: string
): Promise<ReactionResponse> {
  console.log('[STUB API] Removing reaction', { imageId, emoji });

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));

  // Get reaction data
  const reactions = mockReactionStorage.get(imageId) || {};

  if (reactions[emoji] && reactions[emoji] > 0) {
    reactions[emoji] -= 1;
    if (reactions[emoji] === 0) {
      delete reactions[emoji];
    }
    mockReactionStorage.set(imageId, reactions);
  }

  // Calculate total reactions
  const total = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  console.log('[STUB API] Reaction removed', {
    imageId,
    emoji,
    count: reactions[emoji] || 0,
    total
  });

  // TODO: Replace with real API call
  // const response = await fetch(`/api/reactions/${imageId}/${emoji}`, {
  //   method: 'DELETE'
  // });
  // return response.json();

  return {
    success: true,
    count: reactions[emoji] || 0,
    total
  };
}

/**
 * Clear all mock data (for testing)
 */
export function clearMockReactions(): void {
  console.log('[STUB API] Clearing all mock reaction data');
  mockReactionStorage.clear();
}

/**
 * Get all stored mock data (for debugging)
 */
export function getMockReactionStorage(): Map<string, ReactionCounts> {
  return mockReactionStorage;
}
