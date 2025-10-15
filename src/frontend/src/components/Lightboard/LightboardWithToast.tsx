/**
 * LightboardWithToast
 *
 * Wrapper component that provides Toast context to Lightboard.
 * This allows Lightboard to use toast notifications globally.
 *
 * @author Agent Team 1 (Core Features)
 * @created 2025-10-14
 */

'use client';

import React from 'react';
import Lightboard from './Lightboard';
import { ToastProvider } from './ToastContext';
import { ToastContainer } from './Toast';
import type { Collection } from '@/lib/api-client';

interface LightboardWithToastProps {
  collection?: Collection | null;
}

export default function LightboardWithToast({ collection }: LightboardWithToastProps) {
  return (
    <ToastProvider>
      <Lightboard collection={collection} />
      <ToastContainer />
    </ToastProvider>
  );
}
