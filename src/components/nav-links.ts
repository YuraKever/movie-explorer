/** Main navigation, shared by the desktop row and the mobile menu. */
export const NAV_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/search", label: "Search" },
  { href: "/favorites", label: "Favorites" },
] as const;

export const navItemClass =
  "rounded-md px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10";
