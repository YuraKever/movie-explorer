import { describe, expect, it } from "vitest";
import { directConnectionUrl, isSameDatabase } from "./connection-url";

const POOLED =
  "postgres://app:secret@ep-flat-recipe-123-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require";

describe("directConnectionUrl", () => {
  it("swaps Neon's pooled host for the direct one and keeps everything else", () => {
    expect(directConnectionUrl(POOLED)).toEqual({
      url: "postgres://app:secret@ep-flat-recipe-123.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require",
      wasPooled: true,
    });
  });

  it("leaves a direct or local URL alone", () => {
    const local = "postgres://movie:movie@localhost:5432/movie_explorer";
    expect(directConnectionUrl(local)).toEqual({ url: local, wasPooled: false });
  });
});

describe("isSameDatabase", () => {
  it("matches on host, port and database name, not on credentials", () => {
    expect(
      isSameDatabase(
        "postgres://movie:movie@localhost:5432/movie_explorer",
        "postgres://other:pw@127.0.0.1/movie_explorer",
      ),
    ).toBe(true);
  });

  it("tells a scratch database and a remote host apart from the local one", () => {
    const local = "postgres://movie:movie@localhost:5432/movie_explorer";
    expect(isSameDatabase(local, "postgres://movie:movie@localhost:5432/movie_explorer_synctest")).toBe(false);
    expect(isSameDatabase(local, POOLED)).toBe(false);
  });
});
