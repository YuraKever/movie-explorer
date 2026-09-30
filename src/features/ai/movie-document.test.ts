import { describe, expect, it } from "vitest";
import type { MovieDetail } from "@/features/movies/types";
import { buildMovieDocument } from "./movie-document";

const interstellar: MovieDetail = {
  id: 157336,
  title: "Interstellar",
  overview: "The adventures of a group of explorers who make use of a newly discovered wormhole.",
  poster_path: null,
  backdrop_path: null,
  release_date: "2014-11-05",
  vote_average: 8.5,
  vote_count: 38000,
  genres: [
    { id: 12, name: "Adventure" },
    { id: 878, name: "Science Fiction" },
  ],
  runtime: 169,
  tagline: "Mankind was born on Earth. It was never meant to die here.",
  keywords: {
    keywords: [
      { id: 1, name: "wormhole" },
      { id: 2, name: "space travel" },
      { id: 3, name: "aftercreditsstinger" },
    ],
  },
  credits: {
    cast: ["Matthew McConaughey", "Anne Hathaway", "Michael Caine", "Jessica Chastain", "Casey Affleck", "Wes Bentley"].map(
      (name, i) => ({ id: i, name, character: "", profile_path: null }),
    ),
    crew: [
      { name: "Hans Zimmer", job: "Original Music Composer" },
      { name: "Christopher Nolan", job: "Director" },
    ],
  },
};

describe("buildMovieDocument", () => {
  it("lays out every field the search should see", () => {
    expect(buildMovieDocument(interstellar)).toBe(
      [
        "Interstellar (2014).",
        "Genres: Adventure, Science Fiction.",
        "Tagline: Mankind was born on Earth. It was never meant to die here.",
        "Keywords: wormhole, space travel.",
        "Director: Christopher Nolan.",
        "Starring: Matthew McConaughey, Anne Hathaway, Michael Caine, Jessica Chastain, Casey Affleck.",
        "Runtime: 169 min.",
        "Overview: The adventures of a group of explorers who make use of a newly discovered wormhole.",
      ].join("\n"),
    );
  });

  it("keeps release tags like credit stingers out of the keywords", () => {
    expect(buildMovieDocument(interstellar)).not.toContain("stinger");
  });

  it("drops the lines TMDB has no data for", () => {
    expect(
      buildMovieDocument({
        ...interstellar,
        release_date: "",
        genres: [],
        tagline: "",
        keywords: undefined,
        credits: undefined,
        runtime: 0,
      }),
    ).toBe(
      "Interstellar.\nOverview: The adventures of a group of explorers who make use of a newly discovered wormhole.",
    );
  });

  it("skips a movie without an overview", () => {
    expect(buildMovieDocument({ ...interstellar, overview: "  " })).toBeNull();
  });
});
