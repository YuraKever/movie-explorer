import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { favorites } from "@/lib/db/favorites-schema";
import type { MovieCardData } from "@/features/movies/types";

/**
 * Серверные операции над избранным (только сервер — тянет клиент БД).
 * Клиент ходит сюда через route handlers `/api/favorites/*`.
 */

/** Валидация входного среза фильма из тела запроса. */
export const movieCardSchema = z.object({
  id: z.number().int(),
  title: z.string().min(1),
  poster_path: z.string().nullable().optional(),
  release_date: z.string().optional(),
  vote_average: z.number().optional(),
});

export type MovieCardInput = z.infer<typeof movieCardSchema>;

type FavoriteRow = typeof favorites.$inferSelect;

function toCard(row: FavoriteRow): MovieCardData {
  return {
    id: row.movieId,
    title: row.title,
    poster_path: row.posterPath,
    release_date: row.releaseDate ?? undefined,
    vote_average: row.voteAverage,
  };
}

function toValues(userId: string, movie: MovieCardInput) {
  return {
    userId,
    movieId: movie.id,
    title: movie.title,
    posterPath: movie.poster_path ?? null,
    releaseDate: movie.release_date ?? null,
    voteAverage: movie.vote_average ?? 0,
  };
}

/** Избранное пользователя, свежие — первыми. */
export async function listFavorites(userId: string): Promise<MovieCardData[]> {
  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
  return rows.map(toCard);
}

/** Добавить фильм. Повторное добавление того же — no-op (UNIQUE). */
export async function addFavorite(userId: string, movie: MovieCardInput) {
  await db
    .insert(favorites)
    .values(toValues(userId, movie))
    .onConflictDoNothing({ target: [favorites.userId, favorites.movieId] });
}

/** Убрать фильм из избранного. */
export async function removeFavorite(userId: string, movieId: number) {
  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.movieId, movieId)));
}

/** Массовый импорт (миграция из localStorage). Дубли игнорируются. */
export async function importFavorites(userId: string, movies: MovieCardInput[]) {
  if (movies.length === 0) return;
  await db
    .insert(favorites)
    .values(movies.map((m) => toValues(userId, m)))
    .onConflictDoNothing({ target: [favorites.userId, favorites.movieId] });
}
