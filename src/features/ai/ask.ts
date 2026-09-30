import { z } from "zod";
import { PEOPLE_LABELS } from "./movie-document";
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
Do not repeat the request; start the reason with what happens in the movie.
Write every reason in English.`;

const isPeopleLine = (line: string) =>
  Object.values(PEOPLE_LABELS).some((label) => line.startsWith(`${label}: `));

/**
 * A candidate as the model sees it. Names help search find a movie but not the
 * model explain it: with director and cast lines the 4B model opened a reasoning
 * block it never closed and looped until the token limit. They stay only when
 * the query matched the document's text — for "Keanu Reeves" they are the reason.
 */
export function candidateForModel(candidate: RetrievedMovie): string {
  if (candidate.textMatch) return candidate.content;
  return candidate.content
    .split("\n")
    .filter((line) => !isPeopleLine(line))
    .join("\n");
}

/** The user turn: candidates first, then the request, each fenced so neither reads as instructions. */
export function buildAskPrompt(question: string, candidates: RetrievedMovie[]): string {
  const list = candidates
    .map((c) => `<movie id="${c.movieId}">\n${candidateForModel(c)}\n</movie>`)
    .join("\n");
  return `<candidates>\n${list}\n</candidates>\n\n<request>\n${question}\n</request>`;
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
