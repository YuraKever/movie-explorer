import { describe, expect, it } from "vitest";
import {
  cutByThreshold,
  meanReciprocalRank,
  ranksOf,
  recallAt,
  type EvalResult,
} from "./retrieval-metrics";

const hit = (movieId: number, distance: number) => ({ movieId, distance });

const results: EvalResult[] = [
  // Found first.
  { expect: [1], ranked: [hit(1, 0.4), hit(2, 0.5)] },
  // One of two found, at rank 3.
  { expect: [5, 6], ranked: [hit(3, 0.4), hit(4, 0.45), hit(5, 0.58)] },
  // Not found at all.
  { expect: [9], ranked: [hit(7, 0.5)] },
];

describe("retrieval metrics", () => {
  it("ranks each expected movie, null when missing", () => {
    expect(ranksOf(results[1])).toEqual([3, null]);
  });

  it("averages recall per query, so a two-movie query does not outweigh the others", () => {
    expect(recallAt(results, 8)).toBeCloseTo((1 + 0.5 + 0) / 3);
    expect(recallAt(results, 2)).toBeCloseTo(1 / 3);
  });

  it("scores MRR by the first expected movie", () => {
    expect(meanReciprocalRank(results)).toBeCloseTo((1 + 1 / 3 + 0) / 3);
  });

  it("counts expected hits a threshold would drop", () => {
    expect(cutByThreshold(results, 8, 0.55)).toBe(1);
    expect(cutByThreshold(results, 8, 0.6)).toBe(0);
  });

  it("never counts a text match as cut, whatever its distance", () => {
    expect(
      cutByThreshold([{ expect: [1], ranked: [{ movieId: 1, distance: 0.7, textMatch: true }] }], 8, 0.55),
    ).toBe(0);
  });

  it("returns zero for an empty set instead of NaN", () => {
    expect(recallAt([], 8)).toBe(0);
    expect(meanReciprocalRank([])).toBe(0);
  });
});
