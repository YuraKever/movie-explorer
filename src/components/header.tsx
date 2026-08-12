import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { AuthNav } from "./auth-nav";
import { MobileNav } from "./mobile-nav";
import { NAV_LINKS, navItemClass } from "./nav-links";

/**
 * Site header: brand link to the home page, navigation and the theme toggle.
 * Sticks to the top and slightly blurs the content scrolling underneath.
 * Below `sm` the links and the auth control move into `MobileNav`; the theme
 * toggle stays in the row at every width.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-background/80 backdrop-blur-md dark:border-white/10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span aria-hidden>🎬</span>
          <span>Movie Explorer</span>
        </Link>
        <div className="flex items-center gap-1">
          <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={navItemClass}>
                {link.label}
              </Link>
            ))}
            <AuthNav />
          </nav>
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
