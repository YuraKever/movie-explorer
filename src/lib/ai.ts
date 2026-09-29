import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * AI models behind any OpenAI-compatible endpoint. The default is a local Ollama
 * (`brew services start ollama`), so development needs no key and costs nothing.
 */
const provider = createOpenAICompatible({
  name: "ollama",
  baseURL: process.env.AI_BASE_URL ?? "http://localhost:11434/v1",
  supportsStructuredOutputs: true,
});

/**
 * Stored vectors are only comparable with vectors from the same model: changing
 * the model or its dimensions means re-indexing every movie.
 */
export const EMBEDDING_DIMENSIONS = 1024;
export const embeddingModel = provider.embeddingModel("qwen3-embedding:0.6b");

/**
 * Qwen3-Embedding is asymmetric: a query embeds with a task instruction, a
 * document without one. Tied to the model — a different model wants its own.
 */
export const embeddingQuery = (query: string) =>
  `Instruct: Given a description of a movie someone wants to watch, retrieve movies that match it\nQuery: ${query}`;

export const chatModel = provider.chatModel("qwen3:4b-instruct");
