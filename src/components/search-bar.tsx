"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Debounced search field. The URL is the source of truth (`/search?query=`), so
 * a result is shareable and survives a reload. Input lives in local state (for
 * responsiveness) and lands in the URL 350 ms after the user stops typing.
 *
 * `initialQuery` — the URL value at page render time. Comparing against it
 * suppresses a redundant navigation on mount and prevents a loop.
 */
export function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    const q = value.trim();
    if (q === initialQuery) return; // already in sync with the URL

    const timer = setTimeout(() => {
      router.replace(q ? `/search?query=${encodeURIComponent(q)}` : "/search", {
        scroll: false,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [value, initialQuery, router]);

  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Movie title…"
        aria-label="Search movies"
        autoFocus
        className="w-full rounded-lg border border-black/10 bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-amber-500 dark:border-white/15"
      />
    </div>
  );
}
