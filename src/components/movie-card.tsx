import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/tmdb";
import { FavoriteButton } from "./favorite-button";
import type { MovieCardData } from "@/features/movies/types";

/**
 * Movie card: poster (next/image, no layout shift thanks to aspect-[2/3]),
 * rating on top and title with year underneath. The whole card is a link to the
 * detail page (`/movie/[id]`), with hover and focus-visible states for a11y.
 *
 * `sizes` describes the card's real width in the grid (2→5 columns) so the
 * browser fetches a properly sized poster instead of a full-screen one.
 */
const POSTER_SIZES =
  "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw";

export function MovieCard({
  movie,
  priority = false,
}: {
  movie: MovieCardData;
  priority?: boolean;
}) {
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
            alt={`${movie.title} poster`}
            fill
            sizes={POSTER_SIZES}
            // First row is above the fold: load eagerly, it is the LCP candidate.
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
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

        <FavoriteButton
          movie={movie}
          className="absolute left-2 top-2 h-8 w-8 justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75"
        />
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
