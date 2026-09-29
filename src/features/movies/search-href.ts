/** `title` searches TMDB by name; `meaning` is our semantic search over the plot. */
export type SearchMode = "title" | "meaning";

export function parseSearchMode(value: string | undefined): SearchMode {
  return value === "meaning" ? "meaning" : "title";
}

/** `/search` URL for a query and mode; the default mode stays out of the URL. */
export function searchHref(query: string, mode: SearchMode): string {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (mode !== "title") params.set("mode", mode);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
