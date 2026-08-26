import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";
import { GET } from "./route";

vi.mock("@/lib/tmdb", () => ({ tmdbFetch: vi.fn(async () => ({ results: [] })) }));

/** Each test gets its own caller so the rate-limit window starts clean. */
let caller = 0;

function call(path: string, query = "") {
  const url = `http://localhost:3000/api/tmdb/${path}${query}`;
  const request = new NextRequest(url, {
    headers: { "x-forwarded-for": `10.0.0.${caller}` },
  });
  return GET(request, { params: Promise.resolve({ path: path.split("/") }) });
}

beforeEach(() => {
  caller += 1;
});

afterEach(() => {
  vi.mocked(tmdbFetch).mockClear();
});

describe("TMDB proxy", () => {
  it("forwards the endpoints the client actually uses", async () => {
    for (const path of [
      "trending/movie/week",
      "search/movie",
      "discover/movie",
      "movie/27205",
      "genre/movie/list",
    ]) {
      expect((await call(path)).status, path).toBe(200);
    }
  });

  it("refuses anything outside the allowlist", async () => {
    for (const path of ["account/lists", "movie/27205/rating", "../3/account"]) {
      expect((await call(path)).status, path).toBe(404);
    }
    expect(tmdbFetch).not.toHaveBeenCalled();
  });

  it("lets the CDN hold the response", async () => {
    const res = await call("trending/movie/week");

    expect(res.headers.get("Cache-Control")).toContain("s-maxage=3600");
  });

  it("keeps repeated query params and drops a caller-supplied key", async () => {
    await call("discover/movie", "?with_genres=28&with_genres=18&api_key=leaked");

    const forwarded = vi.mocked(tmdbFetch).mock.calls[0][1] as URLSearchParams;
    expect(forwarded.getAll("with_genres")).toEqual(["28", "18"]);
    expect(forwarded.has("api_key")).toBe(false);
  });

  it("turns a TMDB failure into a 502 rather than leaking it as a 500", async () => {
    vi.mocked(tmdbFetch).mockRejectedValueOnce(new Error("TMDB responded 500"));

    const res = await call("search/movie", "?query=dune");

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: "TMDB responded 500" });
  });

  it("stops a single caller from spending the quota", async () => {
    const responses = [];
    for (let i = 0; i < 62; i += 1) responses.push(await call("search/movie"));

    expect(responses.filter((res) => res.status === 429)).toHaveLength(2);
    expect(responses.at(-1)?.headers.get("Retry-After")).toBeTruthy();
  });
});
