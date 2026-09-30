import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SkeletonGrid } from "@/components/movie-grid";
import { SearchBar } from "@/components/search-bar";
import { SearchResults } from "@/components/search-results";
import { SemanticResults } from "@/components/semantic-results";
import { parseSearchMode, searchHref, type SearchMode } from "@/features/movies/search-href";

export const metadata: Metadata = { title: "Search" };

type Props = { searchParams: Promise<{ query?: string; mode?: string }> };

const MODES: { mode: SearchMode; label: string }[] = [
  { mode: "title", label: "By title" },
  { mode: "meaning", label: "By meaning" },
];

/**
 * Search page. The query and mode are read from the URL on the server
 * (`searchParams`) and passed down as props — that avoids `useSearchParams` and
 * its Suspense boundary. Title search runs on the client through the TMDB
 * proxy; search by meaning (embeddings) runs here on the server and streams in.
 */
export default async function SearchPage({ searchParams }: Props) {
  const { query = "", mode: rawMode } = await searchParams;
  const mode = parseSearchMode(rawMode);
  const q = query.trim();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Search movies
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        {mode === "meaning"
          ? "Describe what you want to watch — the plot, the mood, a theme."
          : "Find a movie by title — data by TMDB."}
      </p>

      <nav aria-label="Search mode" className="mt-6 inline-flex rounded-lg border border-black/10 p-0.5 text-sm dark:border-white/15">
        {MODES.map((m) => (
          <Link
            key={m.mode}
            href={searchHref(q, m.mode)}
            replace
            scroll={false}
            aria-current={m.mode === mode ? "page" : undefined}
            className="rounded-md px-3 py-1.5 text-foreground/70 transition-colors hover:text-foreground aria-[current=page]:bg-amber-500 aria-[current=page]:text-black"
          >
            {m.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 max-w-md">
        <SearchBar initialQuery={q} mode={mode} />
      </div>

      {mode === "title" ? (
        <SearchResults query={q} />
      ) : q ? (
        <div className="mt-6">
          {/* Keyed by query: a new query shows the skeleton instead of stale cards. */}
          <Suspense key={q} fallback={<SkeletonGrid count={8} />}>
            <SemanticResults query={q} />
          </Suspense>
        </div>
      ) : (
        <p className="py-16 text-center text-foreground/60">
          Describe a movie to start searching.
        </p>
      )}
    </main>
  );
}
