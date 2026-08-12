"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AuthNav } from "./auth-nav";
import { NAV_LINKS, navItemClass } from "./nav-links";

/**
 * Burger menu for narrow screens. Below `sm` the header row cannot hold the
 * brand, three links, the auth control and the theme toggle at once — the auth
 * control used to be clipped off the right edge.
 *
 * The panel stays mounted and is hidden with `display: none`, so `aria-controls`
 * always resolves and hidden links stay out of the tab order.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="relative sm:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground dark:border-white/15 dark:hover:bg-white/10"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      <div
        id="mobile-menu"
        ref={panelRef}
        className={`absolute right-0 top-full mt-2 w-48 rounded-xl border border-black/10 bg-background p-2 shadow-lg dark:border-white/15 ${
          open ? "block" : "hidden"
        }`}
      >
        <nav aria-label="Main" className="flex flex-col">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              // The header survives the navigation, so the panel has to close itself.
              onClick={() => setOpen(false)}
              className={navItemClass}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-1 flex border-t border-black/10 pt-1 dark:border-white/15">
          <AuthNav />
        </div>
      </div>
    </div>
  );
}
