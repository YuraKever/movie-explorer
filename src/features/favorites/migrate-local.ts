import type { MovieCardData } from "@/features/movies/types";
import { importFavoritesRequest } from "./api";

/** Ключ старого хранилища (Zustand persist до появления аккаунтов). */
const LOCAL_KEY = "movie-explorer:favorites";

/**
 * Разовый перенос избранного из localStorage на сервер. Зовётся после успешного
 * входа/регистрации. localStorage чистим ТОЛЬКО после успешного импорта — если
 * сеть/сервер упали, данные останутся и перенесутся при следующем входе.
 */
export async function importLocalFavorites(): Promise<void> {
  if (typeof window === "undefined") return;

  const raw = window.localStorage.getItem(LOCAL_KEY);
  if (!raw) return;

  let items: MovieCardData[] = [];
  try {
    // Формат Zustand persist: { state: { items: [...] }, version }.
    const parsed = JSON.parse(raw) as { state?: { items?: MovieCardData[] } };
    items = parsed?.state?.items ?? [];
  } catch {
    window.localStorage.removeItem(LOCAL_KEY); // повреждённые данные — вычищаем
    return;
  }

  try {
    if (items.length > 0) await importFavoritesRequest(items);
    window.localStorage.removeItem(LOCAL_KEY);
  } catch {
    // оставляем localStorage как есть — повторим при следующем входе
  }
}
