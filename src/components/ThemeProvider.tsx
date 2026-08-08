'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Wraps the app with next-themes for dark/light mode support.
 *
 * Audit fix 4.1 — the site forced `dark` on <html> with no toggle,
 * limiting accessibility and shareability. A toggle was flagged as a
 * quick win in both audit documents.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
