import { tmdbFetch } from "@/lib/tmdb";

/**
 * Фаза 0 — «светящийся путь».
 * Серверный компонент тянет тренды напрямую через серверный клиент TMDB
 * (для RSC это правильнее, чем ходить в собственный /api-роут: без лишнего
 * сетевого хопа и абсолютного URL). Тот же ключ, тот же сервер.
 * Клиентские фичи (поиск, лента) в следующих фазах пойдут через /api/tmdb.
 */

type TrendingMovie = {
  id: number;
  title: string;
  release_date?: string;
  vote_average?: number;
};

type TrendingResponse = {
  results: TrendingMovie[];
};

export default async function HomePage() {
  let movies: TrendingMovie[] = [];
  let error: string | null = null;

  try {
    const data = await tmdbFetch<TrendingResponse>("trending/movie/week");
    movies = data.results;
  } catch (e) {
    error = e instanceof Error ? e.message : "Неизвестная ошибка";
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <h1>🎬 Movie Explorer</h1>
      <p style={{ color: "#888" }}>
        Фаза 0 — светящийся путь: страница → серверный клиент → TMDB → рендер.
      </p>

      {error ? (
        <div
          style={{
            border: "1px solid #e0b400",
            background: "rgba(224, 180, 0, 0.08)",
            borderRadius: 8,
            padding: 16,
            marginTop: 16,
          }}
        >
          <p style={{ margin: 0 }}>⚠️ Не удалось загрузить данные:</p>
          <pre style={{ whiteSpace: "pre-wrap", margin: "8px 0" }}>{error}</pre>
          <p style={{ margin: 0 }}>
            Добавь ключ TMDB в <code>.env.local</code> (шаблон — в{" "}
            <code>.env.example</code>) и перезапусти dev-сервер.
          </p>
        </div>
      ) : (
        <ol>
          {movies.map((movie) => (
            <li key={movie.id}>
              {movie.title}
              {movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : ""}
              {typeof movie.vote_average === "number"
                ? ` — ⭐ ${movie.vote_average.toFixed(1)}`
                : ""}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
