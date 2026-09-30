import type { MovieDetail } from "@/features/movies/types";

/** Enough to name the theme without drowning the overview in tags. */
const MAX_KEYWORDS = 20;
/** The billed leads — the names people search by, not the whole call sheet. */
const MAX_CAST = 5;

/** Labels of the lines that list people; the advisor hides them from the model (see ask.ts). */
export const PEOPLE_LABELS = { director: "Director", cast: "Starring" } as const;

/**
 * TMDB tags about the release, not the story ("aftercreditsstinger"). Dropping
 * wider release tags (sequel, remake…) measured worse: sequels drifted ahead of
 * the originals.
 */
const isMetaKeyword = (name: string) => /creditsstinger$/.test(name);

/**
 * The text a movie is embedded as — whatever is missing here is invisible to
 * semantic search. Labelled lines in English, the language of TMDB's data.
 * Returns null without an overview: a title alone embeds as noise.
 */
export function buildMovieDocument(movie: MovieDetail): string | null {
  const overview = movie.overview?.trim();
  if (!overview) return null;

  const year = movie.release_date?.slice(0, 4);
  const keywords = movie.keywords?.keywords
    .map((k) => k.name)
    .filter((name) => !isMetaKeyword(name))
    .slice(0, MAX_KEYWORDS);
  const directors = movie.credits?.crew?.filter((c) => c.job === "Director").map((c) => c.name);
  const cast = movie.credits?.cast.slice(0, MAX_CAST).map((c) => c.name);

  return [
    year ? `${movie.title} (${year}).` : `${movie.title}.`,
    movie.genres.length > 0 && `Genres: ${movie.genres.map((g) => g.name).join(", ")}.`,
    movie.tagline && `Tagline: ${movie.tagline}`,
    keywords?.length && `Keywords: ${keywords.join(", ")}.`,
    directors?.length && `${PEOPLE_LABELS.director}: ${directors.join(", ")}.`,
    cast?.length && `${PEOPLE_LABELS.cast}: ${cast.join(", ")}.`,
    movie.runtime && `Runtime: ${movie.runtime} min.`,
    `Overview: ${overview}`,
  ]
    .filter(Boolean)
    .join("\n");
}
