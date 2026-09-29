import type { MovieDetail } from "@/features/movies/types";

/** Enough to name the theme without drowning the overview in tags. */
const MAX_KEYWORDS = 20;

/**
 * The text a movie is embedded as — whatever is missing here is invisible to
 * semantic search. Labelled lines in English, the language of TMDB's data.
 * Returns null without an overview: a title alone embeds as noise.
 */
export function buildMovieDocument(movie: MovieDetail): string | null {
  const overview = movie.overview?.trim();
  if (!overview) return null;

  const year = movie.release_date?.slice(0, 4);
  const keywords = movie.keywords?.keywords.slice(0, MAX_KEYWORDS).map((k) => k.name);

  return [
    year ? `${movie.title} (${year}).` : `${movie.title}.`,
    movie.genres.length > 0 && `Genres: ${movie.genres.map((g) => g.name).join(", ")}.`,
    movie.tagline && `Tagline: ${movie.tagline}`,
    keywords?.length && `Keywords: ${keywords.join(", ")}.`,
    movie.runtime && `Runtime: ${movie.runtime} min.`,
    `Overview: ${overview}`,
  ]
    .filter(Boolean)
    .join("\n");
}
