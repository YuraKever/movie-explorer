import { describe, expect, it } from "vitest";
import { fuseRankings, passesThreshold } from "./hybrid";

describe("fuseRankings", () => {
  it("puts a movie both lists rank ahead of one list's winner", () => {
    // 2 is second in both lists; 1 and 3 are first in only one.
    expect(fuseRankings([[1, 2, 4], [3, 2, 5]])[0]).toBe(2);
  });

  it("keeps movies only one list found, after the shared ones", () => {
    expect(fuseRankings([[1, 2], [2, 3]])).toEqual([2, 1, 3]);
  });

  it("orders ties by the first list, so the result is deterministic", () => {
    expect(fuseRankings([[1], [2]])).toEqual([1, 2]);
  });

  it("returns nothing for empty lists", () => {
    expect(fuseRankings([[], []])).toEqual([]);
  });
});

describe("passesThreshold", () => {
  it("lets a close meaning through", () => {
    expect(passesThreshold({ distance: 0.4 }, 0.55)).toBe(true);
    expect(passesThreshold({ distance: 0.6 }, 0.55)).toBe(false);
  });

  it("lets a literal text match through however far its meaning is", () => {
    expect(passesThreshold({ distance: 0.65, textMatch: true }, 0.55)).toBe(true);
  });
});
