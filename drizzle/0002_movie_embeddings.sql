CREATE TABLE "movie_embeddings" (
	"movie_id" integer PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"embedding" vector(1024) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "movie_embeddings_hnsw_idx" ON "movie_embeddings" USING hnsw ("embedding" vector_cosine_ops);