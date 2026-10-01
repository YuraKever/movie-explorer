import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import { candidateForModel } from "./ask";
import type { RetrievedMovie } from "./retrieve.server";

/**
 * TypeSafe's Jev: a "System One" model that answers typed questions with a
 * probability instead of text. The advisor asks it one yes/no question per
 * candidate — "would this person want this movie?" — and keeps the likely ones.
 * Docs: https://docs.typesafe.ai/api
 */
const JEV_URL = "https://api.typesafe.ai/v1/systemone";

/** Jev answers in well under a second; past this the advisor is better off with Gemini alone. */
const DEADLINE_MS = 5_000;
/** 429 and 529 are "try again later" — one quick retry fits a user's request, more would not. */
const RETRY_STATUSES = new Set([429, 529]);
const RETRY_WAIT_MS = 500;

const responseSchema = z.object({
  answers: z.record(z.string(), z.object({ type: z.literal("noul"), noul: z.number().min(0).max(1) })),
});

export class JevError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "JevError";
  }
}

const titleOf = (candidate: RetrievedMovie) => candidate.content.split("\n")[0];

/** One request: the question and the candidates as state, one `noul` question per movie id. */
export function buildJevRequest(question: string, candidates: RetrievedMovie[]) {
  return {
    model: "jev-latest",
    state: {
      question,
      candidates: candidates.map((c) => ({ id: c.movieId, document: candidateForModel(c) })),
    },
    questions: Object.fromEntries(
      candidates.map((c) => [
        String(c.movieId),
        {
          type: "noul",
          instructions: `Would someone asking this question want to be recommended the movie ${titleOf(c)} (candidate id ${c.movieId})?`,
          criteria: {
            true: "The movie fits what the question asks for.",
            false: "The movie does not fit, or the question is not asking for a movie at all.",
          },
        },
      ]),
    ),
  };
}

/**
 * The probability, per movie id, that the asker wants that movie. `null` when
 * TYPESAFE_API_KEY is not set; throws a JevError when Jev fails or is too slow.
 */
export async function rateCandidates(
  question: string,
  candidates: RetrievedMovie[],
  apiKey = process.env.TYPESAFE_API_KEY,
): Promise<Map<number, number> | null> {
  if (!apiKey) return null;

  const signal = AbortSignal.timeout(DEADLINE_MS);
  const body = JSON.stringify(buildJevRequest(question, candidates));
  let res: Response;
  for (let attempt = 0; ; attempt += 1) {
    res = await fetch(JEV_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body,
      signal,
    }).catch((error: Error) => {
      throw new JevError(`request failed: ${error.name}`);
    });
    if (!RETRY_STATUSES.has(res.status) || attempt === 1) break;
    await sleep(RETRY_WAIT_MS, undefined, { signal }).catch(() => {
      throw new JevError("request failed: TimeoutError");
    });
  }
  if (!res.ok) throw new JevError(`HTTP ${res.status}`, res.status);

  const parsed = responseSchema.safeParse(await res.json().catch(() => null));
  if (!parsed.success) throw new JevError("unexpected response shape");

  const ratings = new Map<number, number>();
  for (const c of candidates) {
    const answer = parsed.data.answers[String(c.movieId)];
    if (!answer) throw new JevError(`no answer for movie ${c.movieId}`);
    ratings.set(c.movieId, answer.noul);
  }
  return ratings;
}
