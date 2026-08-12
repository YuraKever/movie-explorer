import type { MovieCardData } from "@/features/movies/types";
import { importFavoritesRequest } from "./api";

/** Key of the old storage (Zustand persist, before accounts existed). */
const LOCAL_KEY = "movie-explorer:favorites";

/**
 * One-off transfer of favorites from localStorage to the server. Called after a
 * successful sign-in/sign-up. localStorage is cleared ONLY after a successful
 * import — if the network or server fails, the data stays and moves over on the
 * next sign-in.
 */
export async function importLocalFavorites(): Promise<void> {
  if (typeof window === "undefined") return;

  const raw = window.localStorage.getItem(LOCAL_KEY);
  if (!raw) return;

  let items: MovieCardData[] = [];
  try {
    // Zustand persist format: { state: { items: [...] }, version }.
    const parsed = JSON.parse(raw) as { state?: { items?: MovieCardData[] } };
    items = parsed?.state?.items ?? [];
  } catch {
    window.localStorage.removeItem(LOCAL_KEY); // corrupted data — wipe it
    return;
  }

  try {
    if (items.length > 0) await importFavoritesRequest(items);
    window.localStorage.removeItem(LOCAL_KEY);
  } catch {
    // leave localStorage as is — we retry on the next sign-in
  }
}
