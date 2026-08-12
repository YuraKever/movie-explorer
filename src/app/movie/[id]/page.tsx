import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMovieDetail } from "@/features/movies/api.server";
import { FavoriteButton } from "@/components/favorite-button";
import { TrailerEmbed } from "@/components/trailer-embed";
import { CastRow } from "@/components/cast-row";
import { MovieGrid } from "@/components/movie-grid";
import { posterUrl, backdropUrl } from "@/lib/tmdb";

type Props = { params: Promise<{ id: string }> };

/**
 * Movie page metadata for SEO and link previews (Open Graph).
 * Same request as the page itself — Next dedupes it.
 * If the movie is missing we return a neutral title (the page 404s anyway).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieDetail(id).catch(() => null);
  if (!movie) return { title: "Movie not found" };

  const image = posterUrl(movie.poster_path, "w500");
  const description =
    movie.overview?.slice(0, 200) || `About ${movie.title}.`;

  return {
    title: movie.title,
    description,
    openGraph: {
      title: movie.title,
      description,
      type: "video.movie",
      images: image ? [{ url: image, width: 500, height: 750 }] : undefined,
    },
  };
}

export default async function MoviePage({ params }: Props) {
  const { id } = await params;

  // Any request failure (including an unknown id → 404 from TMDB) leads to the
  // 404 page. Telling network errors apart from "not found" is still pending.
  const movie = await getMovieDetail(id).catch(() => null);
  if (!movie) notFound();

  const poster = posterUrl(movie.poster_path, "w500");
  const backdrop = backdropUrl(movie.backdrop_path, "w1280");
  const year = movie.release_date?.slice(0, 4);
  const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;
  const runtime = movie.runtime ? formatRuntime(movie.runtime) : null;

  const cast = movie.credits?.cast.slice(0, 12) ?? [];
  const similar = movie.similar?.results.slice(0, 12) ?? [];
  const trailer =
    movie.videos?.results.find(
      (v) => v.site === "YouTube" && v.type === "Trailer" && v.official,
    ) ??
    movie.videos?.results.find(
      (v) => v.site === "YouTube" && v.type === "Trailer",
    ) ??
    movie.videos?.results.find((v) => v.site === "YouTube");

  return (
    <main className="relative">
      {/* Backdrop: fades out downwards, purely atmospheric */}
      {backdrop && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]"
          aria-hidden
        >
          <Image src={backdrop} alt="" fill sizes="100vw" className="object-cover" />
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-foreground/60 transition-colors hover:text-foreground"
        >
          ← Back to trending
        </Link>

        <div className="mt-6 grid gap-8 sm:grid-cols-[220px_1fr]">
          {/* Poster */}
          <div className="relative aspect-[2/3] w-full max-w-[220px] overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
            {poster ? (
              <Image
                src={poster}
                alt={`${movie.title} poster`}
                fill
                sizes="220px"
                loading="eager"
                fetchPriority="high"
                className="object-cover"
              />
            ) : (
              <div
                className="flex h-full items-center justify-center text-5xl opacity-30"
                aria-hidden
              >
                🎬
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {movie.title}
              {year && (
                <span className="ml-2 font-normal text-foreground/50">
                  ({year})
                </span>
              )}
            </h1>
            {movie.tagline && (
              <p className="mt-1 italic text-foreground/60">{movie.tagline}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/70">
              {rating && (
                <span className="font-semibold text-amber-500">★ {rating}</span>
              )}
              {runtime && <span>{runtime}</span>}
              {movie.release_date && <span>{movie.release_date}</span>}
            </div>

            <div className="mt-5">
              <FavoriteButton
                movie={movie}
                withLabel
                className="rounded-lg border border-black/10 px-4 py-2 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              />
            </div>

            {movie.genres.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <li
                    key={genre.id}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/80 dark:border-white/15"
                  >
                    {genre.name}
                  </li>
                ))}
              </ul>
            )}

            <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-foreground/50">
              Overview
            </h2>
            <p className="mt-2 leading-relaxed text-foreground/90">
              {movie.overview || "No overview available."}
            </p>
          </div>
        </div>

        {trailer && (
          <section className="mt-10">
            <h2 className="mb-3 text-xl font-bold tracking-tight">Trailer</h2>
            <TrailerEmbed
              videoKey={trailer.key}
              title={movie.title}
              backdrop={backdrop}
            />
          </section>
        )}

        {cast.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-xl font-bold tracking-tight">Cast</h2>
            <CastRow cast={cast} />
          </section>
        )}

        {similar.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold tracking-tight">Similar</h2>
            <MovieGrid movies={similar} />
          </section>
        )}
      </div>
    </main>
  );
}

/** Minutes → "2h 15m". */
function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
