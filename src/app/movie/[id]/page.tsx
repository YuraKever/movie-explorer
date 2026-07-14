import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMovieDetail } from "@/features/movies/api.server";
import { posterUrl, backdropUrl } from "@/lib/tmdb";

type Props = { params: Promise<{ id: string }> };

/**
 * Метаданные страницы фильма для SEO и превью ссылок (Open Graph).
 * Тот же запрос, что и в самой странице, — Next дедуплицирует его.
 * Если фильма нет, отдаём нейтральный заголовок (страница всё равно уйдёт в 404).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieDetail(id).catch(() => null);
  if (!movie) return { title: "Фильм не найден" };

  const image = posterUrl(movie.poster_path, "w500");
  const description =
    movie.overview?.slice(0, 200) || `Информация о фильме «${movie.title}».`;

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

  // Любая ошибка запроса (в т.ч. несуществующий id → 404 от TMDB) ведёт на
  // страницу 404. Разделение сетевых ошибок и «не найдено» — задача Фазы 6.
  const movie = await getMovieDetail(id).catch(() => null);
  if (!movie) notFound();

  const poster = posterUrl(movie.poster_path, "w500");
  const backdrop = backdropUrl(movie.backdrop_path, "w1280");
  const year = movie.release_date?.slice(0, 4);
  const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;
  const runtime = movie.runtime ? formatRuntime(movie.runtime) : null;

  return (
    <main className="relative">
      {/* Кадр-фон: мягко затухает вниз, служит только атмосферой */}
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
          ← Назад к трендам
        </Link>

        <div className="mt-6 grid gap-8 sm:grid-cols-[220px_1fr]">
          {/* Постер */}
          <div className="relative aspect-[2/3] w-full max-w-[220px] overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
            {poster ? (
              <Image
                src={poster}
                alt={`Постер фильма «${movie.title}»`}
                fill
                sizes="220px"
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

          {/* Информация */}
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
              Описание
            </h2>
            <p className="mt-2 leading-relaxed text-foreground/90">
              {movie.overview || "Описание отсутствует."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/** Минуты → «2 ч 15 мин». */
function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} ч ${m} мин`;
  if (h) return `${h} ч`;
  return `${m} мин`;
}
