import { embed } from "ai";
import { cosineDistance, desc, sql } from "drizzle-orm";
import { embeddingModel, embeddingQuery } from "@/lib/ai";
import { db } from "@/lib/db";
import { contentTsv, movieEmbeddings } from "@/lib/db/schema";
import { fuseRankings, passesThreshold } from "./hybrid";

/**
 * Beyond this a hit found only by meaning is not really about the query; text
 * matches pass regardless. `npm run ai:eval`: expected movies found by meaning
 * sit at 0.23–0.53, except a mood-only query's (0.57) and a name in Cyrillic
 * (0.60) — the two hits this cuts; the closest match to nonsense is 0.59
 * ("asdf qwerty"), which 0.6 would let through. Re-run the eval after changing
 * the model or documents.
 */
const MAX_DISTANCE = 0.55;

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
  const { embedding } = await embed({ model: embeddingModel, value: embeddingQuery(query) });
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
