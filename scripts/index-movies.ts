/**
 * Fills `movie_embeddings` for semantic search: TMDB's most-voted and top rated
 * movies plus what is popular now, and every movie already indexed → one text
 * document per movie → vectors → upsert. Re-runs are cheap: a movie whose
 * document hash has not changed is skipped. When Gemini's daily quota runs out
 * the run stops cleanly; the next day's run picks up where it left off.
 *
 *   npm run ai:index            # 25 pages of the deep lists, ~1000 movies
 *   npm run ai:index -- 100     # grow the catalog, ~4000 movies over a few days
 */
import { createHash } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { embedMany } from "ai";
import { classifyQuotaError } from "@/features/ai/gemini-quota";
import { sql } from "drizzle-orm";
import { buildMovieDocument } from "@/features/ai/movie-document";
import type { Movie, MovieDetail, PaginatedResponse } from "@/features/movies/types";
import { EMBEDDING_DIMENSIONS, embeddingModel, embeddingOptions } from "@/lib/ai";
import { db } from "@/lib/db";
import { movieEmbeddings } from "@/lib/db/schema";
import { tmdbFetch } from "@/lib/tmdb";

/** TMDB serves at most 500 pages of any list. */
const PAGES = Math.min(Number(process.argv[2] ?? 25), 500);

/**
 * Most-voted is the catalog people actually know and search for, and stays put
 * page after page. Popular is a short-term signal: its deep pages fill with
 * this month's obscure releases, so it only contributes what is hot right now.
 */
const SOURCES = [
  { path: "discover/movie", params: { sort_by: "vote_count.desc", include_adult: "false" }, pages: PAGES },
  { path: "movie/top_rated", params: {}, pages: PAGES },
  { path: "movie/popular", params: {}, pages: Math.min(PAGES, 5) },
];
/** Parallel TMDB requests — well under its rate limit. */
const TMDB_CONCURRENCY = 8;
/**
 * Gemini's free tier counts every embedded text as a request and allows 100 a
 * minute, so batches stay under it with a minute between them.
 */
const EMBED_BATCH = 90;
const EMBED_PAUSE_MS = 60_000;
/** Waits on one batch before the run gives up — the limit is not lifting. */
const MAX_WAITS_PER_BATCH = 3;

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
  const requests = SOURCES.flatMap(({ path, params, pages }) =>
    Array.from({ length: pages }, (_, i) => ({ path, params: { ...params, page: i + 1 } })),
  );
  const pages = await mapLimit(requests, TMDB_CONCURRENCY, ({ path, params }) =>
    tmdbFetch<PaginatedResponse<Movie>>(path, params),
  );
  // The lists overlap: a much-voted classic is also top rated.
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
  console.log(`TMDB: ${listed.length} listed (${PAGES} pages of the deep lists), ${ids.length} with the index`);

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

  let waits = 0;
  for (let i = 0; i < changed.length; ) {
    const batch = changed.slice(i, i + EMBED_BATCH);
    let embeddings: number[][];
    try {
      ({ embeddings } = await embedMany({
        model: embeddingModel,
        values: batch.map((d) => d.content),
        providerOptions: embeddingOptions("RETRIEVAL_DOCUMENT"),
        // The SDK's own retries come seconds apart — inside the same quota
        // window, so they would only be refused again. Waiting is decided below.
        maxRetries: 0,
      }));
    } catch (error) {
      const verdict = classifyQuotaError(error);
      if (verdict.kind === "per-day") {
        console.log(
          `Daily quota reached: indexed ${i} of ${changed.length}. ` +
            "Run again tomorrow — finished movies are kept.",
        );
        return;
      }
      if (verdict.kind === "other" || waits >= MAX_WAITS_PER_BATCH) throw error;
      waits += 1;
      console.log(`  ${verdict.kind} limit — waiting ${Math.round(verdict.retryAfterMs / 1000)} s`);
      await sleep(verdict.retryAfterMs);
      continue;
    }
    waits = 0;

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
    i += batch.length;
    console.log(`  ${i}/${changed.length}`);
    if (i < changed.length) await sleep(EMBED_PAUSE_MS);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
