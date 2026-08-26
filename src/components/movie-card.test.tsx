import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { MovieCard } from "./movie-card";
import type { MovieCardData } from "@/features/movies/types";

vi.mock("@/lib/auth-client", () => ({ useSession: () => ({ data: null }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/discover",
}));

const movie: MovieCardData = {
  id: 1,
  title: "Arrival",
  poster_path: "/poster.jpg",
  release_date: "2016-11-11",
  vote_average: 7.842,
};

describe("MovieCard", () => {
  it("links to the detail page and shows title, year and rating", () => {
    renderWithProviders(<MovieCard movie={movie} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/movie/1");
    expect(screen.getByRole("heading", { name: "Arrival" })).toBeInTheDocument();
    expect(screen.getByText("2016")).toBeInTheDocument();
    expect(screen.getByText("★ 7.8")).toBeInTheDocument();
  });

  it("hides the rating when TMDB has no votes yet", () => {
    renderWithProviders(<MovieCard movie={{ ...movie, vote_average: 0 }} />);

    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  it("falls back to a placeholder when there is no poster", () => {
    renderWithProviders(<MovieCard movie={{ ...movie, poster_path: null }} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("🎬")).toBeInTheDocument();
  });
});
