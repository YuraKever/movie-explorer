import { z } from "zod";
import type { RetrievedMovie } from "./retrieve.server";

/** What the model must return — enforced by the provider and validated by the SDK. */
export const askAnswerSchema = z.object({
  picks: z
    .array(z.object({ movieId: z.number().int(), reason: z.string() }))
    .max(5),
});

export type AskAnswer = z.infer<typeof askAnswerSchema>;

export const ASK_SYSTEM = `You are a movie advisor.
Search has already found the candidate movies that are closest to the request.
Choose up to 5 candidates that fit the request and give each one short reason, one sentence, that ties the movie to the request.
Fewer good picks beat a full list: leave out a candidate you would have to explain as not matching.
Return an empty list only if none of the candidates fits the request at all.
Use only movie ids from the candidate list.
Base every reason only on that candidate's description; never add plot details it does not contain.
Do not repeat the request; start the reason with what happens in the movie.`;

/** The user turn: candidates first, then the request, each fenced so neither reads as instructions. */
export function buildAskPrompt(question: string, candidates: RetrievedMovie[]): string {
  const list = candidates
    .map((c) => `<movie id="${c.movieId}">\n${c.content}\n</movie>`)
    .join("\n");
  // The language rule comes last: a small model follows the latest instruction best.
  return `<candidates>\n${list}\n</candidates>\n\n<request>\n${question}\n</request>\n\nWrite every reason in the language of the request.`;
}

/**
 * The model's answer is untrusted input: drop ids that search did not return
 * (a hallucinated or recalled-from-memory movie) and repeats.
 */
export function keepRetrievedPicks(
  answer: AskAnswer,
  candidates: RetrievedMovie[],
): AskAnswer["picks"] {
  const allowed = new Set(candidates.map((c) => c.movieId));
  const seen = new Set<number>();
  return answer.picks.filter((pick) => {
    if (!allowed.has(pick.movieId) || seen.has(pick.movieId)) return false;
    seen.add(pick.movieId);
    return true;
  });
}
