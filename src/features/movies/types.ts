/**
 * TMDB types. Only the fields the UI actually uses are described — TMDB's
 * responses are richer, but a narrow type states the code's dependencies
 * honestly.
 */

/** A movie in list responses (trending, search, discover). */
export type Movie = {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  popularity?: number;
};

/** Wrapper for paginated TMDB responses (`/trending`, `/search`, `/discover`…). */
export type PaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type Genre = { id: number; name: string };

/**
 * The minimum a card and favorites need. Both a full `Movie` and a `MovieDetail`
 * structurally fit here, so the card can be fed either one.
 */
export type MovieCardData = Pick<
  Movie,
  "id" | "title" | "poster_path" | "release_date" | "vote_average"
>;

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

export type Video = {
  key: string;
  site: string;
  type: string;
  name: string;
  official: boolean;
};

/**
 * Full TMDB response for a single movie (`/movie/{id}`). Differs from the list
 * `Movie`: genres arrive as objects (`genres`) rather than ids (`genre_ids`),
 * plus runtime, tagline and friends.
 */
export type MovieDetail = Movie & {
  genres: Genre[];
  runtime: number | null;
  tagline?: string;
  status?: string;
  homepage?: string | null;
  // Present only with append_to_response (see getMovieDetail).
  credits?: { cast: CastMember[] };
  videos?: { results: Video[] };
  similar?: PaginatedResponse<Movie>;
};

export type SortOption =
  | "popularity.desc"
  | "vote_average.desc"
  | "primary_release_date.desc"
  | "revenue.desc";

/** Discover filters (`discover/movie`). Empty fields are not applied. */
export type DiscoverFilters = {
  genre?: string; // genre id as a string
  year?: string;
  sort?: SortOption;
};
