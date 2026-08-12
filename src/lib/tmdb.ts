/**
 * Server-side TMDB client. Used ONLY on the server (RSC, Route Handlers): the
 * key/token comes from env vars and never reaches the browser.
 *
 * Two TMDB auth methods are supported:
 *  - TMDB_ACCESS_TOKEN — v4 Read Access Token (preferred), sent as a Bearer header
 *  - TMDB_API_KEY      — v3 API key, sent as the api_key query param
 */
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type TmdbFetchOptions = {
  /** How many seconds to cache the response (Next.js fetch cache). Default 1 hour. */
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
    "TMDB credentials are missing. Set TMDB_ACCESS_TOKEN (v4) or TMDB_API_KEY (v3) in .env.local",
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
      `TMDB responded ${res.status} ${res.statusText} for /${path.replace(/^\//, "")}`,
    );
  }

  return res.json() as Promise<T>;
}

/** Base URL for TMDB images (posters, backdrops). */
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type PosterSize = "w185" | "w342" | "w500" | "w780";

/**
 * Builds a poster URL of the requested size. Returns null when there is no
 * poster — the component shows a placeholder instead of a broken image.
 * The image.tmdb.org host is allowed in next.config.ts (images.remotePatterns).
 */
export function posterUrl(
  path: string | null | undefined,
  size: PosterSize = "w500",
): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export type BackdropSize = "w780" | "w1280" | "original";

/** URL of a movie's backdrop. null when there is none. */
export function backdropUrl(
  path: string | null | undefined,
  size: BackdropSize = "w1280",
): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export type ProfileSize = "w45" | "w185" | "h632";

/** URL of a cast member's photo. null when there is none. */
export function profileUrl(
  path: string | null | undefined,
  size: ProfileSize = "w185",
): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}
