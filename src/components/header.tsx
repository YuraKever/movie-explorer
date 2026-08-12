import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { AuthNav } from "./auth-nav";

/**
 * Site header: brand link to the home page and the theme toggle.
 * Sticks to the top and slightly blurs the content scrolling underneath.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-background/80 backdrop-blur-md dark:border-white/10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span aria-hidden>🎬</span>
          <span>Movie Explorer</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/discover"
            className="rounded-md px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
          >
            Discover
          </Link>
          <Link
            href="/search"
            className="rounded-md px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
          >
            Search
          </Link>
          <Link
            href="/favorites"
            className="rounded-md px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
          >
            Favorites
          </Link>
          <AuthNav />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
