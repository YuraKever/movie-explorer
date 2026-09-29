import { index, integer, pgTable, text, timestamp, vector } from "drizzle-orm/pg-core";
import { EMBEDDING_DIMENSIONS } from "../ai";

/**
 * One vector per movie for semantic search. `content` is exactly the text that
 * was embedded — it goes into the RAG prompt and explains a surprising match;
 * `contentHash` lets re-indexing skip movies whose text has not changed.
 * HNSW with cosine ops: approximate nearest neighbours for `<=>` queries.
 */
export const movieEmbeddings = pgTable(
  "movie_embeddings",
  {
    movieId: integer("movie_id").primaryKey(),
    content: text("content").notNull(),
    contentHash: text("content_hash").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("movie_embeddings_hnsw_idx").using("hnsw", t.embedding.op("vector_cosine_ops")),
  ],
);
