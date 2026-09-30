import { describe, expect, it } from "vitest";
import { buildAskPrompt, keepRetrievedPicks } from "./ask";
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
  it("fences the candidates and the request, and ends with the language rule", () => {
    const prompt = buildAskPrompt("мир — это симуляция", candidates);

    expect(prompt).toContain('<movie id="603">\nThe Matrix (1999).\n</movie>');
    expect(prompt).toContain("<request>\nмир — это симуляция\n</request>");
    expect(prompt.trimEnd().endsWith("Write every reason in the language of the request.")).toBe(true);
  });
});
