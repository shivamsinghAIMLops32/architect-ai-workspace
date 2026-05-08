'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Thin wrapper around next-themes ThemeProvider.
 * Forces dark mode as the persistent default.
 * Placed in its own file so the root layout stays a Server Component.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
