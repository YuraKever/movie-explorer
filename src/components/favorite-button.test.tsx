import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { json, stubFetch } from "@/test/fetch-mock";
import { FavoriteButton } from "./favorite-button";
import type { MovieCardData } from "@/features/movies/types";

const push = vi.fn();
const session = { current: null as { user: { id: string } } | null };

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: session.current }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/movie/1",
}));

const movie: MovieCardData = {
  id: 1,
  title: "Arrival",
  poster_path: "/poster.jpg",
  release_date: "2016-11-11",
  vote_average: 7.8,
};

beforeEach(() => {
  session.current = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FavoriteButton", () => {
  it("sends a guest to sign in and back to the page they came from", async () => {
    const fetchMock = stubFetch({});
    renderWithProviders(<FavoriteButton movie={movie} />);

    await userEvent.click(screen.getByRole("button"));

    expect(push).toHaveBeenCalledWith("/login?redirect=%2Fmovie%2F1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("flips to pressed before the request resolves", async () => {
    session.current = { user: { id: "u1" } };
    let settle: () => void = () => {};
    stubFetch({
      "GET /api/favorites": () => json({ items: [] }),
      "POST /api/favorites": () =>
        new Promise<Response>((resolve) => {
          settle = () => resolve(json({}, 201));
        }),
    });

    renderWithProviders(<FavoriteButton movie={movie} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(button);

    expect(button).toHaveAttribute("aria-pressed", "true");
    settle();
  });

  it("rolls back and explains itself when the request fails", async () => {
    session.current = { user: { id: "u1" } };
    // The list failing too is what leaves `onMutate` with no snapshot to restore.
    stubFetch({
      "GET /api/favorites": () => json({ error: "Server error" }, 500),
      "POST /api/favorites": () => json({ error: "Unauthorized" }, 401),
    });

    renderWithProviders(<FavoriteButton movie={movie} />);
    const button = screen.getByRole("button");

    await userEvent.click(button);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Could not add to favorites",
      ),
    );
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});
