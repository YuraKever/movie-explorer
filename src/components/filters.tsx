"use client";

import { useRouter } from "next/navigation";
import {
  DEFAULT_SORT,
  MIN_YEAR,
  RATINGS,
  SORTS,
  discoverHref,
  hasActiveFilters,
} from "@/features/movies/filters";
import type { DiscoverFilters, Genre } from "@/features/movies/types";

type Props = {
  genres: Genre[];
  current: DiscoverFilters;
  maxYear: number;
};

const selectClass =
  "rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-amber-500 dark:border-white/15";

/**
 * Discover filter bar. The URL is the source of truth: every change writes
 * `searchParams` via `router.replace`, so a selection is shareable and survives
 * a reload. Only the sort has a default, and it is kept out of the URL to keep
 * links clean.
 *
 * Genres are toggle buttons rather than a multi-select: a native `<select
 * multiple>` needs modifier-clicks that no one discovers on a desktop and
 * collapses to a scroll box on a phone.
 */
export function Filters({ genres, current, maxYear }: Props) {
  const router = useRouter();
  const years = Array.from(
    { length: maxYear - MIN_YEAR + 1 },
    (_, i) => maxYear - i,
  );

  function apply(patch: Partial<DiscoverFilters>) {
    const next = { ...current, ...patch };
    // An inverted range matches nothing; drag the other end along instead.
    if (next.yearFrom && next.yearTo && next.yearTo < next.yearFrom) {
      if (patch.yearFrom) next.yearTo = next.yearFrom;
      else next.yearFrom = next.yearTo;
    }
    router.replace(discoverHref(next), { scroll: false });
  }

  function toggleGenre(id: string) {
    const selected = current.genres ?? [];
    apply({
      genres: selected.includes(id)
        ? selected.filter((value) => value !== id)
        : [...selected, id],
    });
  }

  return (
    <div className="space-y-4">
      <div
        role="group"
        aria-label="Genres"
        className="flex flex-wrap gap-2"
      >
        {genres.map((genre) => {
          const id = String(genre.id);
          const selected = current.genres?.includes(id) ?? false;
          return (
            <button
              key={genre.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleGenre(id)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                selected
                  ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              }`}
            >
              {genre.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Released from"
          value={current.yearFrom ?? ""}
          onChange={(e) => apply({ yearFrom: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">From any year</option>
          {years.map((year) => (
            <option key={year} value={String(year)}>
              From {year}
            </option>
          ))}
        </select>

        <select
          aria-label="Released until"
          value={current.yearTo ?? ""}
          onChange={(e) => apply({ yearTo: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">To any year</option>
          {years.map((year) => (
            <option key={year} value={String(year)}>
              To {year}
            </option>
          ))}
        </select>

        <select
          aria-label="Minimum rating"
          value={current.minRating ?? ""}
          onChange={(e) => apply({ minRating: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">Any rating</option>
          {RATINGS.map((rating) => (
            <option key={rating} value={rating}>
              {rating}+
            </option>
          ))}
        </select>

        <select
          aria-label="Sort by"
          value={current.sort ?? DEFAULT_SORT}
          onChange={(e) =>
            apply({ sort: e.target.value as DiscoverFilters["sort"] })
          }
          className={selectClass}
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>

        {hasActiveFilters(current) && (
          <button
            type="button"
            onClick={() => router.replace("/discover", { scroll: false })}
            className="text-sm text-foreground/60 underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
