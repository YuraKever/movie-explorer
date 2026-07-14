/**
 * Серверный клиент TMDB. Используется ТОЛЬКО на сервере (RSC, Route Handlers):
 * ключ/токен берётся из переменных окружения и никогда не попадает в браузер.
 *
 * Поддерживаются два способа авторизации TMDB:
 *  - TMDB_ACCESS_TOKEN — v4 Read Access Token (рекомендуется), уходит в заголовок Bearer
 *  - TMDB_API_KEY      — v3 API key, уходит в query-параметр api_key
 */
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type TmdbFetchOptions = {
  /** Сколько секунд кэшировать ответ (Next.js fetch cache). По умолчанию 1 час. */
  revalidate?: number;
};

function buildAuth(): { headers: Record<string, string>; apiKeyParam?: string } {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (accessToken) {
    return { headers: { Authorization: `Bearer ${accessToken}` } };
  }
  if (apiKey) {
    return { headers: {}, apiKeyParam: apiKey };
  }

  throw new Error(
    "Не заданы креды TMDB. Укажи TMDB_ACCESS_TOKEN (v4) или TMDB_API_KEY (v3) в .env.local",
  );
}

export async function tmdbFetch<T>(
  path: string,
  searchParams: Record<string, string | number | undefined> = {},
  options: TmdbFetchOptions = {},
): Promise<T> {
  const { headers, apiKeyParam } = buildAuth();

  const url = new URL(`${TMDB_BASE_URL}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  if (apiKeyParam) url.searchParams.set("api_key", apiKeyParam);

  const res = await fetch(url, {
    headers: { accept: "application/json", ...headers },
    next: { revalidate: options.revalidate ?? 60 * 60 },
  });

  if (!res.ok) {
    throw new Error(
      `TMDB ответил ${res.status} ${res.statusText} на /${path.replace(/^\//, "")}`,
    );
  }

  return res.json() as Promise<T>;
}
