import { tmdbFetch } from "@/lib/tmdb";
import { MovieGrid } from "@/components/movie-grid";
import type { Movie, PaginatedResponse } from "@/features/movies/types";

/**
 * Home page (RSC): this week's trending movies as a poster grid.
 * The server component fetches through the server-side TMDB client directly —
 * no extra network hop through our own /api route.
 */
export default async function HomePage() {
  let movies: Movie[] = [];
  let error: string | null = null;

  try {
    const data =
      await tmdbFetch<PaginatedResponse<Movie>>("trending/movie/week");
    movies = data.results;
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Trending this week
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        Popular movies right now — data by TMDB.
      </p>

      {error ? (
        <ErrorState message={error} />
      ) : (
        <div className="mt-6">
          <MovieGrid movies={movies} priority />
        </div>
      )}
    </main>
  );
}

/** Graceful error state: most often this is a missing TMDB key. */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
      <p className="font-medium">⚠️ Could not load movies</p>
      <pre className="mt-2 whitespace-pre-wrap text-foreground/70">
        {message}
      </pre>
      <p className="mt-2 text-foreground/70">
        Check that the TMDB key is set in <code>.env.local</code> (template —{" "}
        <code>.env.example</code>), then restart the dev server.
      </p>
    </div>
  );
}
