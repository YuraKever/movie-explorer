import { generateText, Output } from "ai";
import { getMovie } from "@/features/movies/api.server";
import type { MovieCardData } from "@/features/movies/types";
import { chatModel, chatOptions } from "@/lib/ai";
import { askAnswerSchema, ASK_SYSTEM, buildAskPrompt, keepRetrievedPicks } from "./ask";
import { findSimilarMovies } from "./retrieve.server";

export type AdvisorPick = { movie: MovieCardData; reason: string };

/**
 * RAG end to end: retrieve the closest movies, let the model choose among them
 * and explain, keep only picks search actually returned, dress them as cards.
 */
export async function askAdvisor(question: string): Promise<AdvisorPick[]> {
  const candidates = await findSimilarMovies(question);
  // Nothing close enough — skip a slow model call that could only say so.
  if (candidates.length === 0) return [];

  const { output } = await generateText({
    model: chatModel,
    system: ASK_SYSTEM,
    prompt: buildAskPrompt(question, candidates),
    output: Output.object({ schema: askAnswerSchema }),
    // Choosing from a list wants the same answer every time, not variety.
    temperature: 0,
    providerOptions: chatOptions,
    // A model can loop inside structured output (a local 4B one ran past 6000
    // tokens); five one-line reasons fit in ~400.
    maxOutputTokens: 600,
    timeout: 30_000,
  });

  const picks = keepRetrievedPicks(output, candidates);
  const movies = await Promise.all(picks.map((pick) => getMovie(pick.movieId)));
  return picks.map((pick, i) => ({ movie: movies[i], reason: pick.reason }));
}
