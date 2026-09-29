import { describe, expect, it } from "vitest";
import { parseSearchMode, searchHref } from "./search-href";

describe("searchHref", () => {
  it("keeps the default mode out of the URL", () => {
    expect(searchHref("dune", "title")).toBe("/search?query=dune");
    expect(searchHref("", "title")).toBe("/search");
  });

  it("encodes the query and adds a non-default mode", () => {
    expect(searchHref("сон во сне", "meaning")).toBe(
      "/search?query=%D1%81%D0%BE%D0%BD+%D0%B2%D0%BE+%D1%81%D0%BD%D0%B5&mode=meaning",
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
