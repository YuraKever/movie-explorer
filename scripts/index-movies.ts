/**
 * Fills `movie_embeddings` for semantic search: TMDB top rated + popular →
 * one text document per movie → vectors → upsert. Re-runs are cheap: a movie
 * whose document hash has not changed is skipped.
 *
 *   npm run ai:index            # 25 pages of each list, up to ~1000 movies
 *   npm run ai:index -- 5       # a quick run
 */
import { createHash } from "node:crypto";
import { embedMany } from "ai";
import { sql } from "drizzle-orm";
import { buildMovieDocument } from "@/features/ai/movie-document";
import type { Movie, MovieDetail, PaginatedResponse } from "@/features/movies/types";
import { embeddingModel } from "@/lib/ai";
import { db } from "@/lib/db";
import { movieEmbeddings } from "@/lib/db/schema";
import { tmdbFetch } from "@/lib/tmdb";

const PAGES = Number(process.argv[2] ?? 25);
const LISTS = ["movie/top_rated", "movie/popular"] as const;
/** Parallel TMDB requests — well under its rate limit. */
const TMDB_CONCURRENCY = 8;
const EMBED_BATCH = 64;

/** Runs `fn` over `items` with at most `limit` calls in flight, keeping order. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

async function collectMovieIds(): Promise<number[]> {
  const requests = LISTS.flatMap((list) =>
    Array.from({ length: PAGES }, (_, i) => ({ list, page: i + 1 })),
  );
  const pages = await mapLimit(requests, TMDB_CONCURRENCY, ({ list, page }) =>
    tmdbFetch<PaginatedResponse<Movie>>(list, { page }),
  );
  // The lists overlap: a popular classic is also top rated.
  return [...new Set(pages.flatMap((p) => p.results.map((m) => m.id)))];
}

async function main() {
  const ids = await collectMovieIds();
  console.log(`TMDB: ${ids.length} unique movies from ${PAGES} pages of each list`);

  const details = await mapLimit(ids, TMDB_CONCURRENCY, (id) =>
    tmdbFetch<MovieDetail>(`movie/${id}`, { append_to_response: "keywords,credits" }),
  );
  const documents = details.flatMap((movie) => {
    const content = buildMovieDocument(movie);
    return content ? [{ movieId: movie.id, content, contentHash: sha256(content) }] : [];
  });
  console.log(`Documents: ${documents.length} (${details.length - documents.length} without an overview)`);

  const stored = new Map(
    (await db.select({ movieId: movieEmbeddings.movieId, contentHash: movieEmbeddings.contentHash })
      .from(movieEmbeddings))
      .map((row) => [row.movieId, row.contentHash]),
  );
  const changed = documents.filter((d) => stored.get(d.movieId) !== d.contentHash);
  console.log(`To embed: ${changed.length} (${documents.length - changed.length} unchanged)`);

  for (let i = 0; i < changed.length; i += EMBED_BATCH) {
    const batch = changed.slice(i, i + EMBED_BATCH);
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batch.map((d) => d.content),
    });

    await db
      .insert(movieEmbeddings)
      .values(batch.map((d, j) => ({ ...d, embedding: embeddings[j] })))
      .onConflictDoUpdate({
        target: movieEmbeddings.movieId,
        set: {
          content: sql`excluded.content`,
          contentHash: sql`excluded.content_hash`,
          embedding: sql`excluded.embedding`,
          updatedAt: sql`now()`,
        },
      });
    console.log(`  ${Math.min(i + EMBED_BATCH, changed.length)}/${changed.length}`);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
