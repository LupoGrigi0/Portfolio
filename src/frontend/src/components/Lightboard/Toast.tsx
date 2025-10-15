/**
 * Toast
 *
 * Professional toast notification component for Lightboard.
 * Displays non-blocking feedback messages to replace browser alerts.
 *
 * Features:
 * - Type-based color coding (success, error, info, warning)
 * - Icons for each type
 * - Auto-dismiss with smooth animations
 * - Click to dismiss manually
 * - Stacks multiple toasts vertically
 * - Slides in from top-right
 *
 * @author Agent Team 1 (Core Features)
 * @created 2025-10-14
 */

'use client';

import React from 'react';
import { useToast, type Toast as ToastType } from './ToastContext';

const TOAST_ICONS = {
  success: '✓',
  error: '×',
  info: 'ℹ',
  warning: '⚠',
} as const;

const TOAST_STYLES = {
  success: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-500',
    text: 'text-white',
  },
  error: {
    bg: 'bg-red-600',
    border: 'border-red-500',
    text: 'text-white',
  },
  info: {
    bg: 'bg-blue-600',
    border: 'border-blue-500',
    text: 'text-white',
  },
  warning: {
    bg: 'bg-yellow-600',
    border: 'border-yellow-500',
    text: 'text-white',
  },
} as const;

interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const styles = TOAST_STYLES[toast.type];
  const icon = TOAST_ICONS[toast.type];

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} ${styles.text}
        border rounded-lg shadow-2xl
        px-4 py-3 mb-3
        flex items-center gap-3
        cursor-pointer
        transform transition-all duration-300 ease-out
        animate-slide-in-right
        hover:scale-105
        min-w-[300px] max-w-[400px]
      `}
      onClick={() => onDismiss(toast.id)}
    >
      <div className="text-xl font-bold flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 text-sm font-medium">
        {toast.message}
      </div>
      <button
        className="flex-shrink-0 text-white/70 hover:text-white text-lg font-bold ml-2"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-6 right-6 z-[10000] pointer-events-none"
      style={{ marginTop: '60px' }} // Below the Lightboard toggle button
    >
      <div className="pointer-events-auto space-y-0">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={hideToast} />
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
