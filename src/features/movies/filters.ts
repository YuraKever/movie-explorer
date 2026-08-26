import type { DiscoverFilters, SortOption } from "./types";

export const DEFAULT_SORT: SortOption = "popularity.desc";
export const MIN_YEAR = 1950;

export const SORTS: { value: SortOption; label: string }[] = [
  { value: "popularity.desc", label: "Popular" },
  { value: "vote_average.desc", label: "Top rated" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "revenue.desc", label: "Highest grossing" },
];

export const RATINGS = ["6", "7", "8"] as const;

const SORT_VALUES = new Set<string>(SORTS.map((sort) => sort.value));

type RawParams = Record<string, string | undefined>;

/**
 * The URL is the source of truth for discover, so both directions live here:
 * the page parses `searchParams` on the server, the filter bar builds the next
 * href on the client, and neither can drift from the other.
 *
 * Anything unparseable is dropped rather than passed to TMDB — a hand-edited
 * `?rating=banana` should narrow nothing, not 500.
 */
export function parseDiscoverFilters(params: RawParams): DiscoverFilters {
  const maxYear = new Date().getFullYear() + 1;
  const year = (raw: string | undefined) => {
    const value = Number(raw);
    return Number.isInteger(value) && value >= MIN_YEAR && value <= maxYear
      ? String(value)
      : undefined;
  };

  const yearFrom = year(params.from);
  const yearTo = year(params.to);

  return {
    genres: params.genres
      ?.split(",")
      .filter((id) => /^\d+$/.test(id))
      .slice(0, 10),
    yearFrom,
    // An inverted range matches nothing; treat it as a single year instead.
    yearTo: yearFrom && yearTo && yearTo < yearFrom ? yearFrom : yearTo,
    minRating: RATINGS.includes(params.rating as (typeof RATINGS)[number])
      ? params.rating
      : undefined,
    sort: SORT_VALUES.has(params.sort ?? "")
      ? (params.sort as SortOption)
      : DEFAULT_SORT,
  };
}

/** `/discover` with the filters applied. The default sort is left out. */
export function discoverHref(filters: DiscoverFilters): string {
  const params = new URLSearchParams();
  if (filters.genres?.length) params.set("genres", filters.genres.join(","));
  if (filters.yearFrom) params.set("from", filters.yearFrom);
  if (filters.yearTo) params.set("to", filters.yearTo);
  if (filters.minRating) params.set("rating", filters.minRating);
  if (filters.sort && filters.sort !== DEFAULT_SORT) params.set("sort", filters.sort);

  // Commas are legal in a query value and every value here is ours (digits and
  // known sort keys), so decoding them back keeps shared links readable.
  const qs = params.toString().replaceAll("%2C", ",");
  return qs ? `/discover?${qs}` : "/discover";
}

/** Whether anything narrows the feed — drives the reset control. */
export function hasActiveFilters(filters: DiscoverFilters): boolean {
  return discoverHref(filters) !== "/discover";
}
