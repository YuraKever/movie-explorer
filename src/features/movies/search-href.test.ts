import { describe, expect, it } from "vitest";
import { parseSearchMode, searchHref } from "./search-href";

describe("searchHref", () => {
  it("keeps the default mode out of the URL", () => {
    expect(searchHref("dune", "title")).toBe("/search?query=dune");
    expect(searchHref("", "title")).toBe("/search");
  });

  it("encodes the query and adds a non-default mode", () => {
    expect(searchHref("a dream & a heist", "meaning")).toBe(
      "/search?query=a+dream+%26+a+heist&mode=meaning",
    );
    expect(searchHref("", "meaning")).toBe("/search?mode=meaning");
  });
});

describe("parseSearchMode", () => {
  it("falls back to title for anything unknown", () => {
    expect(parseSearchMode("meaning")).toBe("meaning");
    expect(parseSearchMode(undefined)).toBe("title");
    expect(parseSearchMode("sql-injection")).toBe("title");
  });
});
