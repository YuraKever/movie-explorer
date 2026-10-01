import { generateText, Output } from "ai";
import { getMovie } from "@/features/movies/api.server";
import type { MovieCardData } from "@/features/movies/types";
import { chatModel, chatOptions } from "@/lib/ai";
import {
  type AdvisorEngine,
  askAnswerSchema,
  ASK_SYSTEM,
  buildAskPrompt,
  chooseByProbability,
  keepRetrievedPicks,
} from "./ask";
import { rateCandidates } from "./jev.server";
import { findSimilarMovies, type RetrievedMovie } from "./retrieve.server";

/** `reason` comes only from Gemini: Jev answers with a probability, not text. */
export type AdvisorPick = { movie: MovieCardData; reason?: string };

/** `engine` is who actually chose: a Jev request falls back to Gemini when Jev is down. */
export type AdvisorAnswer = { engine: AdvisorEngine; picks: AdvisorPick[] };

/**
 * RAG end to end: retrieve the closest movies, let the chosen engine pick among
 * them — Jev keeps the likely ones, Gemini chooses and explains — then dress them as cards.
 */
export async function askAdvisor(
  question: string,
  engine: AdvisorEngine = "jev",
): Promise<AdvisorAnswer> {
  const candidates = await findSimilarMovies(question);
  // Nothing close enough — skip a slow model call that could only say so.
  if (candidates.length === 0) return { engine, picks: [] };

  const ratings =
    engine === "jev"
      ? await rateCandidates(question, candidates).catch((error: Error) => {
          console.warn(`Jev unavailable, Gemini chooses: ${error.message}`);
          return null;
        })
      : null;
  const picks: { movieId: number; reason?: string }[] = ratings
    ? chooseByProbability(candidates, ratings)
    : await askGemini(question, candidates);

  const movies = await Promise.all(picks.map((pick) => getMovie(pick.movieId)));
  return {
    engine: ratings ? "jev" : "gemini",
    picks: picks.map((pick, i) => ({ movie: movies[i], reason: pick.reason })),
  };
}

async function askGemini(question: string, candidates: RetrievedMovie[]) {
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
  return keepRetrievedPicks(output, candidates);
}
