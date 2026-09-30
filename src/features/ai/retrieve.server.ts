import { embed } from "ai";
import { cosineDistance, desc, sql } from "drizzle-orm";
import { embeddingModel, embeddingOptions } from "@/lib/ai";
import { db } from "@/lib/db";
import { contentTsv, movieEmbeddings } from "@/lib/db/schema";
import { fuseRankings, passesThreshold } from "./hybrid";

/**
 * A safety cap, not a relevance filter. With gemini-embedding-2 distance cannot
 * tell nonsense from a real answer: `npm run ai:eval` puts the closest match to
 * nonsense at 0.39–0.43 and a correct #1 (Up) at 0.53. The advisor rejects
 * nonsense itself (4 of 4); this only drops what is plainly unrelated.
 */
const MAX_DISTANCE = 0.6;

/** How deep each side looks before fusion; pgvector's HNSW returns at most ef_search (40). */
const CANDIDATES = 40;

export type RetrievedMovie = {
  movieId: number;
  content: string;
  /** Cosine distance: 0 = same meaning, 1 = unrelated. */
  distance: number;
  /** The query's words appear in the document (a name, a title). */
  textMatch?: boolean;
};

/**
 * Hybrid search: the nearest movies by meaning and the best full-text matches,
 * fused by rank; empty when nothing is close or literally matches.
 * `maxDistance: Infinity` turns the cut off — for evals that measure the threshold itself.
 */
export async function findSimilarMovies(
  query: string,
  { k = 8, maxDistance = MAX_DISTANCE }: { k?: number; maxDistance?: number } = {},
): Promise<RetrievedMovie[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: query,
    providerOptions: embeddingOptions("RETRIEVAL_QUERY"),
  });
  const distance = cosineDistance(movieEmbeddings.embedding, embedding);
  const tsQuery = sql`websearch_to_tsquery('english', ${query})`;
  const tsv = contentTsv(movieEmbeddings.content);
  const columns = {
    movieId: movieEmbeddings.movieId,
    content: movieEmbeddings.content,
    distance: distance.mapWith(Number),
  };

  const [byMeaning, byText] = await Promise.all([
    // Ascending distance, not descending `1 - distance`: only this form uses the HNSW index.
    db.select(columns).from(movieEmbeddings).orderBy(distance).limit(CANDIDATES),
    db
      .select(columns)
      .from(movieEmbeddings)
      .where(sql`${tsv} @@ ${tsQuery}`)
      // Many documents tie on rank (a name mentioned once); without a tiebreak the
      // order would follow the table's physical layout and change on every re-index.
      .orderBy(desc(sql`ts_rank(${tsv}, ${tsQuery})`), distance)
      .limit(CANDIDATES),
  ]);

  const textMatches = new Set(byText.map((hit) => hit.movieId));
  const hits = new Map(
    [...byMeaning, ...byText].map((hit) => [
      hit.movieId,
      { ...hit, textMatch: textMatches.has(hit.movieId) },
    ]),
  );

  return fuseRankings([byMeaning.map((hit) => hit.movieId), byText.map((hit) => hit.movieId)])
    .map((id) => hits.get(id)!)
    .filter((hit) => passesThreshold(hit, maxDistance))
    .slice(0, k);
}
