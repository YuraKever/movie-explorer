import type { Metadata } from "next";
import { SearchBar } from "@/components/search-bar";
import { SearchResults } from "@/components/search-results";

export const metadata: Metadata = { title: "Search" };

type Props = { searchParams: Promise<{ query?: string }> };

/**
 * Search page. The query is read from the URL on the server (`searchParams`) and
 * passed down as a prop — that avoids `useSearchParams` and its Suspense
 * boundary. Search input and results rendering are client-side
 * (SearchBar + SearchResults).
 */
export default async function SearchPage({ searchParams }: Props) {
  const { query = "" } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Search movies
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        Find a movie by title — data by TMDB.
      </p>

      <div className="mt-6 max-w-md">
        <SearchBar initialQuery={query} />
      </div>

      <SearchResults query={query} />
    </main>
  );
}
