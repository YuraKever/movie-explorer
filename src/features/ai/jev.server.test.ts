import { afterEach, describe, expect, it, vi } from "vitest";
import { buildJevRequest, JevError, rateCandidates } from "./jev.server";
import type { RetrievedMovie } from "./retrieve.server";

const candidates: RetrievedMovie[] = [
  { movieId: 603, content: "The Matrix (1999).\nStarring: Keanu Reeves.", distance: 0.45 },
  { movieId: 37165, content: "The Truman Show (1998).", distance: 0.5 },
];

const answers = {
  answers: {
    "603": { type: "noul", noul: 0.9 },
    "37165": { type: "noul", noul: 0.2 },
  },
  usage: { input_tokens: 400, output_tokens: 80 },
};

const reply = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function stubFetch(...responses: Response[]) {
  const fetch = vi.fn();
  for (const res of responses) fetch.mockResolvedValueOnce(res);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => vi.unstubAllGlobals());

describe("buildJevRequest", () => {
  it("puts the question and the model's view of the candidates in state, one noul per id", () => {
    const request = buildJevRequest("the world is a simulation", candidates);

    expect(request.model).toBe("jev-latest");
    // The same text Gemini sees: no people lines for a candidate found by meaning.
    expect(request.state.candidates).toEqual([
      { id: 603, document: "The Matrix (1999)." },
      { id: 37165, document: "The Truman Show (1998)." },
    ]);
    expect(Object.keys(request.questions)).toEqual(["603", "37165"]);
    expect(request.questions["603"]).toMatchObject({ type: "noul" });
    expect(request.questions["603"].instructions).toContain("The Matrix (1999).");
  });
});

describe("rateCandidates", () => {
  it("returns null without a key and never calls the API", async () => {
    const fetch = stubFetch();
    await expect(rateCandidates("q", candidates, "")).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends a bearer request and maps each answer to its movie id", async () => {
    const fetch = stubFetch(reply(200, answers));

    const ratings = await rateCandidates("q", candidates, "test-key");

    expect(ratings).toEqual(new Map([[603, 0.9], [37165, 0.2]]));
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://api.typesafe.ai/v1/systemone");
    expect(init.headers).toEqual({ Authorization: "Bearer test-key", "Content-Type": "application/json" });
    expect(JSON.parse(init.body)).toEqual(buildJevRequest("q", candidates));
  });

  it("retries an overload once, then gives up", async () => {
    const fetch = stubFetch(reply(529), reply(200, answers));
    await expect(rateCandidates("q", candidates, "k")).resolves.toBeInstanceOf(Map);

    fetch.mockReset();
    fetch.mockResolvedValueOnce(reply(429)).mockResolvedValueOnce(reply(429));
    await expect(rateCandidates("q", candidates, "k")).rejects.toMatchObject({ status: 429 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry a bad key", async () => {
    const fetch = stubFetch(reply(401));
    await expect(rateCandidates("q", candidates, "k")).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("rejects a response that is missing a candidate or has the wrong shape", async () => {
    stubFetch(reply(200, { answers: { "603": { type: "noul", noul: 0.9 } } }));
    await expect(rateCandidates("q", candidates, "k")).rejects.toThrow("no answer for movie 37165");

    stubFetch(reply(200, { answers: { "603": { type: "noul", noul: 1.7 } } }));
    await expect(rateCandidates("q", candidates, "k")).rejects.toThrow("unexpected response shape");
  });

  it("turns a network failure into a JevError without the request details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const error = await rateCandidates("q", candidates, "secret-key").catch((e) => e);

    expect(error).toBeInstanceOf(JevError);
    expect(error.message).not.toContain("secret-key");
  });
});
