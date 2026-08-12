"use client";

/**
 * Thin wrapper around next-themes. The provider has to be a client component,
 * so it lives here separately and the root layout can stay a server component.
 * next-themes injects a synchronous script into <head> that sets the theme class
 * before the first paint — hence no flash of the wrong theme on load.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider(
  props: ComponentProps<typeof NextThemesProvider>,
) {
  return <NextThemesProvider {...props} />;
}
