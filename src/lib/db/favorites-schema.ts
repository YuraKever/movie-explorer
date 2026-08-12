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
 * A user's favorites. We store the same minimal movie slice (`MovieCardData`)
 * that used to live in localStorage, so /favorites renders without hitting TMDB.
 * UNIQUE(user_id, movie_id): a movie cannot be duplicated for a user.
 * ON DELETE CASCADE: deleting a user takes their favorites with it.
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
