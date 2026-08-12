"use client";

import { useRouter } from "next/navigation";
import type { Genre, SortOption } from "@/features/movies/types";

const SORTS: { value: SortOption; label: string }[] = [
  { value: "popularity.desc", label: "Popular" },
  { value: "vote_average.desc", label: "Top rated" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "revenue.desc", label: "Highest grossing" },
];

const DEFAULT_SORT: SortOption = "popularity.desc";

type Props = {
  genres: Genre[];
  current: { genre?: string; year?: string; sort?: string };
  maxYear: number;
};

/**
 * Discover filter bar. The URL is the source of truth: every change writes
 * `searchParams` via `router.replace`, so a selection is shareable and survives
 * a reload. Year has no default (sort is the only filter with one, and it is
 * kept out of the URL to keep links clean).
 */
export function Filters({ genres, current, maxYear }: Props) {
  const router = useRouter();
  const years = Array.from({ length: maxYear - 1950 + 1 }, (_, i) => maxYear - i);

  function apply(patch: Partial<{ genre: string; year: string; sort: string }>) {
    const next = { ...current, ...patch };
    const params = new URLSearchParams();
    if (next.genre) params.set("genre", next.genre);
    if (next.year) params.set("year", next.year);
    if (next.sort && next.sort !== DEFAULT_SORT) params.set("sort", next.sort);

    const qs = params.toString();
    router.replace(qs ? `/discover?${qs}` : "/discover", { scroll: false });
  }

  const hasFilters = Boolean(
    current.genre ||
      current.year ||
      (current.sort && current.sort !== DEFAULT_SORT),
  );

  const selectClass =
    "rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-amber-500 dark:border-white/15";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        aria-label="Genre"
        value={current.genre ?? ""}
        onChange={(e) => apply({ genre: e.target.value || undefined })}
        className={selectClass}
      >
        <option value="">All genres</option>
        {genres.map((genre) => (
          <option key={genre.id} value={String(genre.id)}>
            {genre.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Release year"
        value={current.year ?? ""}
        onChange={(e) => apply({ year: e.target.value || undefined })}
        className={selectClass}
      >
        <option value="">Any year</option>
        {years.map((year) => (
          <option key={year} value={String(year)}>
            {year}
          </option>
        ))}
      </select>

      <select
        aria-label="Sort by"
        value={current.sort ?? DEFAULT_SORT}
        onChange={(e) => apply({ sort: e.target.value })}
        className={selectClass}
      >
        {SORTS.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.replace("/discover", { scroll: false })}
          className="text-sm text-foreground/60 underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Reset
        </button>
      )}
    </div>
  );
}
