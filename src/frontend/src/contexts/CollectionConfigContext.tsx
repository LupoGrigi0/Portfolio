/**
 * CollectionConfigContext
 *
 * Provides collection-specific configuration to the Lightboard and other components.
 * This context tracks which collection/page is currently being viewed and provides
 * access to its configuration.
 *
 * Purpose:
 * - Lightboard needs to know which collection is being edited
 * - Provides read/write access to collection config
 * - Tracks dirty state for unsaved changes
 * - Handles navigation between collections
 *
 * Usage:
 * - PageRenderer wraps its content with CollectionConfigProvider
 * - Lightboard consumes this to know what page it's editing
 * - Widgets read/write collection-specific settings
 *
 * @author Kai (Lightboard Integration Specialist)
 * @created 2025-10-15
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Collection, CollectionConfig } from '@/lib/api-client';

// ============================================================================
// Types
// ============================================================================

export interface CollectionConfigContextType {
  // Current collection data
  collection: Collection | null;
  collectionSlug: string | null;

  // Configuration
  config: CollectionConfig | null;

  // Dirty state tracking
  isDirty: boolean;
  hasUnsavedChanges: boolean;

  // Update methods (for future write integration)
  updateConfig: (updates: Partial<CollectionConfig>) => void;
  updateCarouselDefaults: (updates: any) => void;
  updateProjectionSettings: (updates: any) => void;

  // Persistence (placeholder for future integration)
  saveConfig: () => Promise<void>;
  reloadConfig: () => Promise<void>;
  resetToSaved: () => void;
}

// ============================================================================
// Context
// ============================================================================

const CollectionConfigContext = createContext<CollectionConfigContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export interface CollectionConfigProviderProps {
  collection: Collection;
  children: ReactNode;
}

export function CollectionConfigProvider({
  collection: initialCollection,
  children
}: CollectionConfigProviderProps) {
  // State
  const [collection, setCollection] = useState<Collection>(initialCollection);
  const [savedConfig, setSavedConfig] = useState<CollectionConfig | null>(initialCollection.config || null);
  const [isDirty, setIsDirty] = useState(false);

  // Update collection when prop changes (navigation)
  useEffect(() => {
    setCollection(initialCollection);
    setSavedConfig(initialCollection.config || null);
    setIsDirty(false);
  }, [initialCollection.slug]); // Reset when slug changes

  // Track dirty state
  useEffect(() => {
    const currentConfigStr = JSON.stringify(collection.config);
    const savedConfigStr = JSON.stringify(savedConfig);
    setIsDirty(currentConfigStr !== savedConfigStr);
  }, [collection.config, savedConfig]);

  // ============================================================================
  // Update Methods (Local State Only - No API Writes Yet)
  // ============================================================================

  const updateConfig = (updates: Partial<CollectionConfig>) => {
    setCollection(prev => ({
      ...prev,
      config: {
        ...prev.config,
        ...updates
      } as CollectionConfig
    }));
  };

  const updateCarouselDefaults = (updates: any) => {
    setCollection(prev => ({
      ...prev,
      config: {
        ...prev.config,
        dynamicSettings: {
          ...prev.config?.dynamicSettings,
          carouselDefaults: {
            ...prev.config?.dynamicSettings?.carouselDefaults,
            ...updates
          }
        }
      } as CollectionConfig
    }));
  };

  const updateProjectionSettings = (updates: any) => {
    setCollection(prev => ({
      ...prev,
      config: {
        ...prev.config,
        projection: {
          ...prev.config?.projection,
          ...updates
        }
      } as CollectionConfig
    }));
  };

  // ============================================================================
  // Persistence Methods (Placeholder - To Be Implemented)
  // ============================================================================

  const saveConfig = async () => {
    // TODO: Implement after Kat's performance pass
    // await updateCollectionConfig(collection.slug, collection.config);
    // setSavedConfig(collection.config);
    // setIsDirty(false);
    console.warn('CollectionConfigContext.saveConfig() not yet implemented - waiting for performance optimization');
  };

  const reloadConfig = async () => {
    // TODO: Implement after Kat's performance pass
    // const freshCollection = await getCollection(collection.slug);
    // setCollection(freshCollection);
    // setSavedConfig(freshCollection.config);
    // setIsDirty(false);
    console.warn('CollectionConfigContext.reloadConfig() not yet implemented - waiting for performance optimization');
  };

  const resetToSaved = () => {
    if (savedConfig) {
      setCollection(prev => ({
        ...prev,
        config: savedConfig
      }));
      setIsDirty(false);
    }
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: CollectionConfigContextType = {
    // Current collection
    collection,
    collectionSlug: collection.slug,

    // Configuration
    config: collection.config || null,

    // Dirty state
    isDirty,
    hasUnsavedChanges: isDirty,

    // Update methods
    updateConfig,
    updateCarouselDefaults,
    updateProjectionSettings,

    // Persistence
    saveConfig,
    reloadConfig,
    resetToSaved
  };

  return (
    <CollectionConfigContext.Provider value={contextValue}>
      {children}
    </CollectionConfigContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useCollectionConfig(): CollectionConfigContextType {
  const context = useContext(CollectionConfigContext);

  if (!context) {
    throw new Error(
      'useCollectionConfig must be used within a CollectionConfigProvider. ' +
      'Make sure PageRenderer wraps its content with <CollectionConfigProvider>.'
    );
  }

  return context;
}

// ============================================================================
// Optional Hook (Returns null if no collection context)
// ============================================================================

export function useCollectionConfigOptional(): CollectionConfigContextType | null {
  const context = useContext(CollectionConfigContext);
  return context || null;
}
