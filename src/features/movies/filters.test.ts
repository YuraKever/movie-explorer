import { describe, expect, it } from "vitest";
import { DEFAULT_SORT, discoverHref, parseDiscoverFilters } from "./filters";

describe("parseDiscoverFilters", () => {
  it("reads a full query string", () => {
    expect(
      parseDiscoverFilters({
        genres: "28,18",
        from: "2000",
        to: "2010",
        rating: "7",
        sort: "revenue.desc",
      }),
    ).toEqual({
      genres: ["28", "18"],
      yearFrom: "2000",
      yearTo: "2010",
      minRating: "7",
      sort: "revenue.desc",
    });
  });

  it("drops values a hand-edited URL could carry", () => {
    const filters = parseDiscoverFilters({
      genres: "28,drama",
      from: "1800",
      rating: "banana",
      sort: "chaos.desc",
    });

    expect(filters.genres).toEqual(["28"]);
    expect(filters.yearFrom).toBeUndefined();
    expect(filters.minRating).toBeUndefined();
    expect(filters.sort).toBe(DEFAULT_SORT);
  });

  it("collapses an inverted year range rather than matching nothing", () => {
    const filters = parseDiscoverFilters({ from: "2020", to: "2000" });

    expect(filters).toMatchObject({ yearFrom: "2020", yearTo: "2020" });
  });
});

describe("discoverHref", () => {
  it("round-trips through parseDiscoverFilters", () => {
    const href = "/discover?genres=28,18&from=2000&to=2010&rating=7&sort=revenue.desc";
    const query = Object.fromEntries(new URLSearchParams(href.split("?")[1]));

    expect(discoverHref(parseDiscoverFilters(query))).toBe(href);
  });

  it("stays clean when nothing is filtered", () => {
    expect(discoverHref({ sort: DEFAULT_SORT })).toBe("/discover");
  });
});
