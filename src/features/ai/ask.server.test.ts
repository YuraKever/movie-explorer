import { afterEach, describe, expect, it, vi } from "vitest";
import { generateText } from "ai";
import { askAdvisor } from "./ask.server";
import { JevError, rateCandidates } from "./jev.server";
import { findSimilarMovies } from "./retrieve.server";

vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  generateText: vi.fn(),
}));
vi.mock("@/lib/ai", () => ({ chatModel: {}, chatOptions: {} }));
vi.mock("@/features/movies/api.server", () => ({
  getMovie: vi.fn(async (id: number) => ({ id, title: `movie ${id}` })),
}));
vi.mock("./retrieve.server", () => ({ findSimilarMovies: vi.fn() }));
vi.mock("./jev.server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./jev.server")>()),
  rateCandidates: vi.fn(),
}));

const candidates = [1, 2, 3].map((movieId) => ({ movieId, content: `Movie ${movieId}.`, distance: 0.5 }));

afterEach(() => vi.mocked(generateText).mockReset());

describe("askAdvisor", () => {
  it("returns Jev's likely candidates, most likely first, without a model call", async () => {
    vi.mocked(findSimilarMovies).mockResolvedValue(candidates);
    vi.mocked(rateCandidates).mockResolvedValue(new Map([[1, 0.6], [2, 0.1], [3, 0.95]]));

    const answer = await askAdvisor("q");

    expect(answer).toEqual({
      engine: "jev",
      picks: [
        { movie: { id: 3, title: "movie 3" }, reason: undefined },
        { movie: { id: 1, title: "movie 1" }, reason: undefined },
      ],
    });
    expect(generateText).not.toHaveBeenCalled();
  });

  it("answers nothing when Jev finds no candidate likely", async () => {
    vi.mocked(findSimilarMovies).mockResolvedValue(candidates);
    vi.mocked(rateCandidates).mockResolvedValue(new Map([[1, 0.1], [2, 0.1], [3, 0.2]]));

    await expect(askAdvisor("asdf qwerty")).resolves.toEqual({ engine: "jev", picks: [] });
  });

  it.each([
    ["no key", () => vi.mocked(rateCandidates).mockResolvedValue(null)],
    ["an error", () => vi.mocked(rateCandidates).mockRejectedValue(new JevError("HTTP 529", 529))],
  ])("falls back to Gemini choosing and explaining on %s", async (_, setUp) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(findSimilarMovies).mockResolvedValue(candidates);
    setUp();
    vi.mocked(generateText).mockResolvedValueOnce({
      output: { picks: [{ movieId: 2, reason: "why 2" }, { movieId: 99, reason: "not a candidate" }] },
    } as unknown as Awaited<ReturnType<typeof generateText>>);

    const answer = await askAdvisor("q");

    expect(answer).toEqual({
      engine: "gemini",
      picks: [{ movie: { id: 2, title: "movie 2" }, reason: "why 2" }],
    });
  });

  it("skips Jev when Gemini is asked for", async () => {
    vi.mocked(findSimilarMovies).mockResolvedValue(candidates);
    vi.mocked(rateCandidates).mockClear();
    vi.mocked(generateText).mockResolvedValueOnce({
      output: { picks: [{ movieId: 1, reason: "why 1" }] },
    } as unknown as Awaited<ReturnType<typeof generateText>>);

    const answer = await askAdvisor("q", "gemini");

    expect(rateCandidates).not.toHaveBeenCalled();
    expect(answer).toEqual({ engine: "gemini", picks: [{ movie: { id: 1, title: "movie 1" }, reason: "why 1" }] });
  });
});
