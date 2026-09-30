import {
  google,
  type GoogleEmbeddingModelOptions,
  type GoogleLanguageModelOptions,
} from "@ai-sdk/google";

/**
 * AI models on the Gemini API. The key comes from GOOGLE_GENERATIVE_AI_API_KEY,
 * which the provider reads itself.
 */

/**
 * Stored vectors are only comparable with vectors from the same model: changing
 * the model or its dimensions means re-indexing every movie. 1024 rather than
 * the native 3072: pgvector's HNSW index stops at 2000 dimensions.
 */
export const EMBEDDING_DIMENSIONS = 1024;
export const embeddingModel = google.embedding("gemini-embedding-2");

/** Gemini embeds asymmetrically: a query and a document each get their own task type. */
export function embeddingOptions(taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT") {
  return {
    google: {
      taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    } satisfies GoogleEmbeddingModelOptions,
  };
}

/**
 * Flash-lite: choosing from eight candidates needs no more, and on the free
 * tier the newest flash models answered 503 "high demand" while this one
 * answered in under a second.
 */
export const chatModel = google("gemini-3.5-flash-lite");

/** Choosing from a short list needs no thinking; it only adds latency and tokens. */
export const chatOptions = {
  google: {
    thinkingConfig: { thinkingLevel: "minimal" },
  } satisfies GoogleLanguageModelOptions,
};
