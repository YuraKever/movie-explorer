import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/tmdb";
import type { Movie } from "@/features/movies/types";

/**
 * Карточка фильма: постер (next/image, без сдвига макета за счёт aspect-[2/3]),
 * оценка поверх и название с годом под ним. Вся карточка — ссылка на детали
 * (`/movie/[id]`), с состояниями hover и focus-visible для доступности.
 *
 * `sizes` описывает реальную ширину карточки в сетке (2→5 колонок), чтобы
 * браузер тянул постер подходящего размера, а не на весь экран.
 */
const POSTER_SIZES =
  "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw";

export function MovieCard({ movie }: { movie: Movie }) {
  const poster = posterUrl(movie.poster_path, "w500");
  const year = movie.release_date?.slice(0, 4);
  const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;

  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group block focus:outline-none"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/5 transition group-hover:ring-black/15 group-focus-visible:ring-2 group-focus-visible:ring-amber-500 dark:bg-white/5 dark:ring-white/10 dark:group-hover:ring-white/25">
        {poster ? (
          <Image
            src={poster}
            alt={`Постер фильма «${movie.title}»`}
            fill
            sizes={POSTER_SIZES}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-4xl opacity-30"
            aria-hidden
          >
            🎬
          </div>
        )}

        {rating && (
          <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur-sm">
            ★ {rating}
          </span>
        )}
      </div>

      <h3
        className="mt-2 line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400"
        title={movie.title}
      >
        {movie.title}
      </h3>
      {year && <p className="text-xs text-foreground/50">{year}</p>}
    </Link>
  );
}
