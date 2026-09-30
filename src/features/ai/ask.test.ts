import { describe, expect, it } from "vitest";
import { buildAskPrompt, candidateForModel, keepRetrievedPicks } from "./ask";
import type { RetrievedMovie } from "./retrieve.server";

const candidates: RetrievedMovie[] = [
  { movieId: 603, content: "The Matrix (1999).", distance: 0.45 },
  { movieId: 37165, content: "The Truman Show (1998).", distance: 0.5 },
];

describe("keepRetrievedPicks", () => {
  it("drops ids search did not return and repeated ids", () => {
    expect(
      keepRetrievedPicks(
        {
          picks: [
            { movieId: 603, reason: "a" },
            { movieId: 999, reason: "recalled from memory" },
            { movieId: 603, reason: "again" },
            { movieId: 37165, reason: "b" },
          ],
        },
        candidates,
      ),
    ).toEqual([
      { movieId: 603, reason: "a" },
      { movieId: 37165, reason: "b" },
    ]);
  });
});

describe("buildAskPrompt", () => {
  it("fences the candidates and ends with the request", () => {
    const prompt = buildAskPrompt("the world is a simulation", candidates);

    expect(prompt).toContain('<movie id="603">\nThe Matrix (1999).\n</movie>');
    expect(prompt.endsWith("<request>\nthe world is a simulation\n</request>")).toBe(true);
  });
});

describe("candidateForModel", () => {
  const content = [
    "Interstellar (2014).",
    "Director: Christopher Nolan.",
    "Starring: Matthew McConaughey, Anne Hathaway.",
    "Overview: Explorers travel through a wormhole.",
  ].join("\n");

  it("hides the people lines from a candidate found by meaning", () => {
    expect(candidateForModel({ movieId: 157336, content, distance: 0.5 })).toBe(
      "Interstellar (2014).\nOverview: Explorers travel through a wormhole.",
    );
  });

  it("keeps them when the query matched the text — the names are why it is there", () => {
    expect(candidateForModel({ movieId: 157336, content, distance: 0.6, textMatch: true })).toBe(content);
  });
});
