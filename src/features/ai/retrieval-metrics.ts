import { passesThreshold } from "./hybrid";

/** One eval query: the movies it should find and what retrieval returned, best first. */
export type EvalResult = {
  expect: number[];
  ranked: { movieId: number; distance: number; textMatch?: boolean }[];
};

/** 1-based rank of each expected movie, or null when retrieval did not return it. */
export function ranksOf({ expect, ranked }: EvalResult): (number | null)[] {
  return expect.map((id) => {
    const i = ranked.findIndex((hit) => hit.movieId === id);
    return i < 0 ? null : i + 1;
  });
}

/** Share of expected movies found in the top k, averaged over queries. */
export function recallAt(results: EvalResult[], k: number): number {
  const perQuery = results.map((r) => {
    const found = ranksOf(r).filter((rank) => rank !== null && rank <= k).length;
    return found / r.expect.length;
  });
  return mean(perQuery);
}

/** 1 / rank of the first expected movie (0 if none), averaged: how high the answer sits. */
export function meanReciprocalRank(results: EvalResult[]): number {
  return mean(
    results.map((r) => {
      const ranks = ranksOf(r).filter((rank): rank is number => rank !== null);
      return ranks.length > 0 ? 1 / Math.min(...ranks) : 0;
    }),
  );
}

/** Expected movies in the top k that a distance threshold would throw away. */
export function cutByThreshold(results: EvalResult[], k: number, maxDistance: number): number {
  return results.reduce(
    (cut, r) =>
      cut +
      r.ranked
        .slice(0, k)
        .filter((hit) => r.expect.includes(hit.movieId) && !passesThreshold(hit, maxDistance))
        .length,
    0,
  );
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}
