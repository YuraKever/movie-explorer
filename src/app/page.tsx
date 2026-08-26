import { tmdbFetch } from "@/lib/tmdb";
import { getMovieList } from "@/features/movies/api.server";
import { MovieGrid } from "@/components/movie-grid";
import type { Movie, PaginatedResponse } from "@/features/movies/types";

/**
 * Home page (RSC): trending this week, then TMDB's curated lists. The server
 * component fetches through the server-side TMDB client directly — no extra
 * network hop through our own /api route — and all four lists in parallel.
 */
const RAIL_SIZE = 10;

export default async function HomePage() {
  const [trending, nowPlaying, topRated, upcoming] = await Promise.all([
    settle(tmdbFetch<PaginatedResponse<Movie>>("trending/movie/week")),
    settle(getMovieList("now_playing")),
    settle(getMovieList("top_rated")),
    settle(getMovieList("upcoming")),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Trending this week
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        Popular movies right now — data by TMDB.
      </p>

      {trending.error ? (
        <ErrorState message={trending.error} />
      ) : (
        <div className="mt-6">
          <MovieGrid movies={trending.data?.results ?? []} priority />
        </div>
      )}

      <Rail title="In theaters" movies={nowPlaying.data?.results} />
      <Rail title="Top rated" movies={topRated.data?.results} />
      <Rail title="Coming soon" movies={upcoming.data?.results} />
    </main>
  );
}

/**
 * A secondary list. A rail TMDB could not serve is left out rather than
 * announced — trending above already carries the error message.
 */
function Rail({ title, movies }: { title: string; movies?: Movie[] }) {
  if (!movies?.length) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4">
        <MovieGrid movies={movies.slice(0, RAIL_SIZE)} />
      </div>
    </section>
  );
}

type Settled<T> = { data: T | null; error: string | null };

/** One failing list must not take the whole page down with it. */
async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  try {
    return { data: await promise, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
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
