import {
  pgTable,
  serial,
  integer,
  text,
  real,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/**
 * Избранное пользователя. Храним тот же минимальный срез фильма (`MovieCardData`),
 * что раньше лежал в localStorage, — чтобы /favorites рисовалась без похода в TMDB.
 * UNIQUE(user_id, movie_id): один фильм у пользователя не дублируется.
 * ON DELETE CASCADE: удалили пользователя — ушло и его избранное.
 */
export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    movieId: integer("movie_id").notNull(),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    releaseDate: text("release_date"),
    voteAverage: real("vote_average").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("favorites_user_movie_idx").on(t.userId, t.movieId)],
);
