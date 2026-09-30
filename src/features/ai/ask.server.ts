import { generateText, Output } from "ai";
import { getMovie } from "@/features/movies/api.server";
import type { MovieCardData } from "@/features/movies/types";
import { chatModel } from "@/lib/ai";
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
    // A small model can loop inside structured output (seen: 6000+ tokens and
    // counting); five one-line reasons fit in ~400. The timeout still allows a
    // cold start, which loads the model first (~28 s measured).
    maxOutputTokens: 600,
    timeout: 60_000,
  });

  const picks = keepRetrievedPicks(output, candidates);
  const movies = await Promise.all(picks.map((pick) => getMovie(pick.movieId)));
  return picks.map((pick, i) => ({ movie: movies[i], reason: pick.reason }));
}
