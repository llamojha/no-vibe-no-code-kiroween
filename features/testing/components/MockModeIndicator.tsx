'use client';

import React from 'react';
import { resolveMockModeFlag } from '@/lib/testing/config/mock-mode-flags';

/**
 * MockModeIndicator Component
 * 
 * Displays a visual indicator when mock mode is active.
 * Only visible in non-production environments when FF_USE_MOCK_API is enabled.
 * 
 * Requirements: 3.5
 */
export function MockModeIndicator(): React.ReactElement | null {
  // Check if mock mode is enabled via client-side environment variable
  const isMockMode = resolveMockModeFlag(process.env.NEXT_PUBLIC_FF_USE_MOCK_API);
  const isProduction = process.env.NODE_ENV === 'production';

  // Never show in production, even if flag is somehow set
  if (isProduction || !isMockMode) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg border-2 border-yellow-600 animate-pulse"
      role="status"
      aria-live="polite"
      aria-label="Mock mode is active"
    >
      <span className="text-xl" aria-hidden="true">
        🧪
      </span>
      <span className="font-semibold text-sm">Mock Mode Active</span>
    </div>
  );
}
