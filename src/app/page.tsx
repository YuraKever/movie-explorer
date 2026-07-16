import { tmdbFetch } from "@/lib/tmdb";
import { MovieGrid } from "@/components/movie-grid";
import type { Movie, PaginatedResponse } from "@/features/movies/types";

/**
 * Главная (RSC): недельные тренды в виде сетки постеров.
 * Серверный компонент тянет данные напрямую через серверный клиент TMDB —
 * без лишнего сетевого хопа в собственный /api-роут.
 */
export default async function HomePage() {
  let movies: Movie[] = [];
  let error: string | null = null;

  try {
    const data =
      await tmdbFetch<PaginatedResponse<Movie>>("trending/movie/week");
    movies = data.results;
  } catch (e) {
    error = e instanceof Error ? e.message : "Неизвестная ошибка";
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        В тренде за неделю
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        Популярные фильмы прямо сейчас — по данным TMDB.
      </p>

      {error ? (
        <ErrorState message={error} />
      ) : (
        <div className="mt-6">
          <MovieGrid movies={movies} priority />
        </div>
      )}
    </main>
  );
}

/** Аккуратное состояние ошибки: чаще всего это отсутствующий ключ TMDB. */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
      <p className="font-medium">⚠️ Не удалось загрузить фильмы</p>
      <pre className="mt-2 whitespace-pre-wrap text-foreground/70">
        {message}
      </pre>
      <p className="mt-2 text-foreground/70">
        Проверь, что в <code>.env.local</code> задан ключ TMDB (шаблон —{" "}
        <code>.env.example</code>), и перезапусти dev-сервер.
      </p>
    </div>
  );
}
