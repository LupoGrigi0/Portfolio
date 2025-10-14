'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LightboardContextType {
  selectedCarouselId: string | null;
  selectCarousel: (id: string | null) => void;
}

const LightboardContext = createContext<LightboardContextType | undefined>(undefined);

export function LightboardProvider({ children }: { children: ReactNode }) {
  const [selectedCarouselId, setSelectedCarouselId] = useState<string | null>(null);

  const selectCarousel = (id: string | null) => {
    setSelectedCarouselId(id);
  };

  return (
    <LightboardContext.Provider value={{ selectedCarouselId, selectCarousel }}>
      {children}
    </LightboardContext.Provider>
  );
}

export function useLightboard() {
  const context = useContext(LightboardContext);
  if (context === undefined) {
    throw new Error('useLightboard must be used within a LightboardProvider');
  }
  return context;
}
