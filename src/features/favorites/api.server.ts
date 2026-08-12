import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { favorites } from "@/lib/db/favorites-schema";
import type { MovieCardData } from "@/features/movies/types";

/**
 * Server-side favorites operations (server only — pulls in the DB client).
 * The browser reaches them through the `/api/favorites/*` route handlers.
 */

/** Validation for the incoming movie slice from a request body. */
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

/** A user's favorites, newest first. */
export async function listFavorites(userId: string): Promise<MovieCardData[]> {
  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
  return rows.map(toCard);
}

/** Add a movie. Adding the same one twice is a no-op (UNIQUE). */
export async function addFavorite(userId: string, movie: MovieCardInput) {
  await db
    .insert(favorites)
    .values(toValues(userId, movie))
    .onConflictDoNothing({ target: [favorites.userId, favorites.movieId] });
}

/** Remove a movie from favorites. */
export async function removeFavorite(userId: string, movieId: number) {
  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.movieId, movieId)));
}

/** Bulk import (migration from localStorage). Duplicates are ignored. */
export async function importFavorites(userId: string, movies: MovieCardInput[]) {
  if (movies.length === 0) return;
  await db
    .insert(favorites)
    .values(movies.map((m) => toValues(userId, m)))
    .onConflictDoNothing({ target: [favorites.userId, favorites.movieId] });
}
