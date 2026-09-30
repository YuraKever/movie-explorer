import { embed } from "ai";
import { cosineDistance } from "drizzle-orm";
import { embeddingModel, embeddingQuery } from "@/lib/ai";
import { db } from "@/lib/db";
import { movieEmbeddings } from "@/lib/db/schema";

/**
 * Beyond this nothing is really about the query. `npm run ai:eval`: expected
 * movies in the top 8 sit at 0.22–0.53, a mood-only query's at 0.56 (the one
 * hit this cuts); the closest match to nonsense is 0.59 ("asdf qwerty"), which
 * 0.6 would let through. Re-run the eval after changing the model or documents.
 */
const MAX_DISTANCE = 0.55;

export type RetrievedMovie = {
  movieId: number;
  content: string;
  /** Cosine distance: 0 = same meaning, 1 = unrelated. */
  distance: number;
};

/**
 * Nearest movies to a free-text query, closest first; empty when nothing is close.
 * `maxDistance: Infinity` turns the cut off — for evals that measure the threshold itself.
 */
export async function findSimilarMovies(
  query: string,
  { k = 8, maxDistance = MAX_DISTANCE }: { k?: number; maxDistance?: number } = {},
): Promise<RetrievedMovie[]> {
  const { embedding } = await embed({ model: embeddingModel, value: embeddingQuery(query) });
  const distance = cosineDistance(movieEmbeddings.embedding, embedding);

  // Ascending distance, not descending `1 - distance`: only this form uses the HNSW index.
  const hits = await db
    .select({
      movieId: movieEmbeddings.movieId,
      content: movieEmbeddings.content,
      distance: distance.mapWith(Number),
    })
    .from(movieEmbeddings)
    .orderBy(distance)
    .limit(k);

  return hits.filter((hit) => hit.distance <= maxDistance);
}
