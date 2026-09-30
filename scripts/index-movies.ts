/**
 * Fills `movie_embeddings` for semantic search: TMDB top rated + popular, plus
 * every movie already indexed → one text document per movie → vectors → upsert.
 * Re-runs are cheap: a movie whose document hash has not changed is skipped.
 *
 *   npm run ai:index            # 25 pages of each list, up to ~1000 movies
 *   npm run ai:index -- 5       # a quick run
 */
import { createHash } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { embedMany } from "ai";
import { sql } from "drizzle-orm";
import { buildMovieDocument } from "@/features/ai/movie-document";
import type { Movie, MovieDetail, PaginatedResponse } from "@/features/movies/types";
import { EMBEDDING_DIMENSIONS, embeddingModel, embeddingOptions } from "@/lib/ai";
import { db } from "@/lib/db";
import { movieEmbeddings } from "@/lib/db/schema";
import { tmdbFetch } from "@/lib/tmdb";

const PAGES = Number(process.argv[2] ?? 25);
const LISTS = ["movie/top_rated", "movie/popular"] as const;
/** Parallel TMDB requests — well under its rate limit. */
const TMDB_CONCURRENCY = 8;
/**
 * Gemini's free tier counts every embedded text as a request and allows 100 a
 * minute, so batches stay under it with a minute between them.
 */
const EMBED_BATCH = 90;
const EMBED_PAUSE_MS = 60_000;

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

/** The model is part of the hash: a new model must re-embed text that did not change. */
const EMBEDDING_ID = `${embeddingModel.modelId}@${EMBEDDING_DIMENSIONS}`;
const sha256 = (text: string) =>
  createHash("sha256").update(`${EMBEDDING_ID}\n${text}`).digest("hex");

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
  const stored = new Map(
    (await db.select({ movieId: movieEmbeddings.movieId, contentHash: movieEmbeddings.contentHash })
      .from(movieEmbeddings))
      .map((row) => [row.movieId, row.contentHash]),
  );
  const listed = await collectMovieIds();
  // Movies that dropped out of the lists stay indexed and get refreshed too, or a
  // model change would leave them with vectors nothing else is comparable to.
  const ids = [...new Set([...listed, ...stored.keys()])];
  console.log(`TMDB: ${listed.length} listed from ${PAGES} pages of each list, ${ids.length} with the index`);

  const details = await mapLimit(ids, TMDB_CONCURRENCY, (id) =>
    tmdbFetch<MovieDetail>(`movie/${id}`, { append_to_response: "keywords,credits" }),
  );
  const documents = details.flatMap((movie) => {
    const content = buildMovieDocument(movie);
    return content ? [{ movieId: movie.id, content, contentHash: sha256(content) }] : [];
  });
  console.log(`Documents: ${documents.length} (${details.length - documents.length} without an overview)`);

  const changed = documents.filter((d) => stored.get(d.movieId) !== d.contentHash);
  console.log(`To embed: ${changed.length} (${documents.length - changed.length} unchanged)`);

  for (let i = 0; i < changed.length; i += EMBED_BATCH) {
    const batch = changed.slice(i, i + EMBED_BATCH);
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batch.map((d) => d.content),
      providerOptions: embeddingOptions("RETRIEVAL_DOCUMENT"),
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
    if (i + EMBED_BATCH < changed.length) await sleep(EMBED_PAUSE_MS);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
