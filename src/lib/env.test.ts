import { describe, expect, it } from "vitest";
import { validateEnv } from "./env";

const valid = {
  DATABASE_URL: "postgres://movie:movie@localhost:5432/movie_explorer",
  BETTER_AUTH_SECRET: "a".repeat(44),
  BETTER_AUTH_URL: "http://localhost:3000",
  TMDB_ACCESS_TOKEN: "token",
};

describe("validateEnv", () => {
  it("accepts either TMDB credential", () => {
    expect(() => validateEnv(valid)).not.toThrow();
    expect(() =>
      validateEnv({ ...valid, TMDB_ACCESS_TOKEN: undefined, TMDB_API_KEY: "key" }),
    ).not.toThrow();
  });

  it("rejects an environment with no TMDB credential at all", () => {
    expect(() => validateEnv({ ...valid, TMDB_ACCESS_TOKEN: undefined })).toThrow(
      /TMDB_ACCESS_TOKEN/,
    );
  });

  it("reports every problem at once", () => {
    expect(() =>
      validateEnv({ BETTER_AUTH_SECRET: "short" }),
    ).toThrow(/DATABASE_URL[\s\S]*BETTER_AUTH_SECRET[\s\S]*BETTER_AUTH_URL/);
  });
});
