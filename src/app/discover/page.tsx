import type { Metadata } from "next";
import { getGenres } from "@/features/movies/api.server";
import { parseDiscoverFilters } from "@/features/movies/filters";
import { Filters } from "@/components/filters";
import { DiscoverFeed } from "@/components/discover-feed";

export const metadata: Metadata = { title: "Discover" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Catalog with filters and an infinite feed. Filters are read from the URL on
 * the server and passed down as props (no `useSearchParams`). The genre list is
 * fetched on the server — it is static and caches well.
 */
export default async function DiscoverPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseDiscoverFilters(
    Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ]),
    ),
  );
  const genres = await getGenres();
  const maxYear = new Date().getFullYear() + 1;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Discover movies
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        Filter by genre, years, rating and sorting — the feed loads as you scroll.
      </p>

      <div className="mt-6">
        <Filters genres={genres} current={filters} maxYear={maxYear} />
      </div>

      <div className="mt-8">
        <DiscoverFeed filters={filters} />
      </div>
    </main>
  );
}
