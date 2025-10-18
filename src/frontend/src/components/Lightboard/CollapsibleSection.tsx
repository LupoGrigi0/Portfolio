/**
 * CollapsibleSection Component
 *
 * Accordion-style collapsible section for organizing Lightboard settings.
 * Features smooth animations, persistent state in localStorage, and chevron indicators.
 *
 * @author Agent Team 3 - Advanced Features
 * @created 2025-10-14
 */

'use client';

import React, { useState, useEffect } from 'react';

export interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  storageKey?: string; // Optional localStorage key for persistence
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  storageKey,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    // Load from localStorage if storageKey is provided
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`collapsible-${storageKey}`);
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return defaultOpen;
  });

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`collapsible-${storageKey}`, String(isOpen));
    }
  }, [isOpen, storageKey]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border-b border-zinc-700 last:border-b-0">
      {/* Header Button */}
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-800/50 transition-colors duration-150"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title} section`}
      >
        <h4 className="text-cyan-400 font-semibold text-base">
          {title}
        </h4>
        <span
          className={`text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-0' : '-rotate-90'
          }`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
