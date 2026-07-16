/**
 * Типы TMDB. Описываем только те поля, что реально используем в UI, —
 * ответы TMDB богаче, но узкий тип честнее показывает зависимости кода.
 */

/** Фильм в списочных ответах (тренды, поиск, discover). */
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

/** Обёртка постраничных ответов TMDB (`/trending`, `/search`, `/discover`…). */
export type PaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type Genre = { id: number; name: string };

/**
 * Минимум полей, которого достаточно карточке и избранному. И полный `Movie`,
 * и `MovieDetail` структурно подходят сюда, поэтому карточку можно кормить любым.
 */
export type MovieCardData = Pick<
  Movie,
  "id" | "title" | "poster_path" | "release_date" | "vote_average"
>;

/**
 * Полный ответ TMDB по одному фильму (`/movie/{id}`). Отличается от списочного
 * `Movie`: жанры приходят объектами (`genres`), а не id (`genre_ids`), плюс
 * есть длительность, слоган и т.п. Актёров/трейлер/похожие пока не тянем (Фаза 6).
 */
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

export type MovieDetail = Movie & {
  genres: Genre[];
  runtime: number | null;
  tagline?: string;
  status?: string;
  homepage?: string | null;
  // Приходят только при append_to_response (см. getMovieDetail).
  credits?: { cast: CastMember[] };
  videos?: { results: Video[] };
  similar?: PaginatedResponse<Movie>;
};

export type SortOption =
  | "popularity.desc"
  | "vote_average.desc"
  | "primary_release_date.desc"
  | "revenue.desc";

/** Фильтры каталога (`discover/movie`). Пустые поля не применяются. */
export type DiscoverFilters = {
  genre?: string; // id жанра строкой
  year?: string;
  sort?: SortOption;
};
