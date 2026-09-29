import { embed } from "ai";
import { cosineDistance } from "drizzle-orm";
import { embeddingModel, embeddingQuery } from "@/lib/ai";
import { db } from "@/lib/db";
import { movieEmbeddings } from "@/lib/db/schema";

/**
 * Beyond this nothing is really about the query. Measured on the current model
 * and index: relevant hits land at 0.34–0.54, keyboard mash at 0.59, "borscht
 * recipe" at 0.67. Re-measure after changing the model or the document format.
 */
const MAX_DISTANCE = 0.55;

export type RetrievedMovie = {
  movieId: number;
  content: string;
  /** Cosine distance: 0 = same meaning, 1 = unrelated. */
  distance: number;
};

/** Nearest movies to a free-text query, closest first; empty when nothing is close. */
export async function findSimilarMovies(
  query: string,
  { k = 8 }: { k?: number } = {},
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

  return hits.filter((hit) => hit.distance <= MAX_DISTANCE);
}
