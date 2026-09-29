import { findSimilarMovies } from "@/features/ai/retrieve.server";
import { getMovie } from "@/features/movies/api.server";
import { ErrorTile } from "./error-tile";
import { MovieGrid } from "./movie-grid";

/**
 * Semantic search results, rendered on the server: the query is embedded and
 * matched against `movie_embeddings`, then each hit is dressed as a card from
 * TMDB (cached by the data cache, so repeat hits are free).
 */
export async function SemanticResults({ query }: { query: string }) {
  let movies;
  try {
    const hits = await findSimilarMovies(query);
    movies = await Promise.all(hits.map((hit) => getMovie(hit.movieId)));
  } catch (error) {
    // The message may name internal hosts — log it, show the user something useful.
    console.error("Semantic search failed:", error);
    return (
      <ErrorTile
        title="Search by meaning is unavailable"
        error={new Error("Try searching by title instead.")}
      />
    );
  }

  if (movies.length === 0) {
    return (
      <p className="py-16 text-center text-foreground/60">
        Nothing close to &ldquo;{query}&rdquo;. Try describing the plot, the mood or a theme.
      </p>
    );
  }

  return <MovieGrid movies={movies} priority />;
}
