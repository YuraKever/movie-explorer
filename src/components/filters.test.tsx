import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Filters } from "./filters";
import type { DiscoverFilters } from "@/features/movies/types";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const genres = [
  { id: 28, name: "Action" },
  { id: 18, name: "Drama" },
];

function renderFilters(current: DiscoverFilters = {}) {
  return render(<Filters genres={genres} current={current} maxYear={2026} />);
}

describe("Filters", () => {
  it("adds a genre to the URL and takes it back out", async () => {
    const { unmount } = renderFilters();

    await userEvent.click(screen.getByRole("button", { name: "Action" }));
    expect(replace).toHaveBeenCalledWith("/discover?genres=28", { scroll: false });
    unmount();

    renderFilters({ genres: ["28", "18"] });
    await userEvent.click(screen.getByRole("button", { name: "Action" }));

    expect(replace).toHaveBeenCalledWith("/discover?genres=18", { scroll: false });
  });

  it("marks the selected genres as pressed", () => {
    renderFilters({ genres: ["28"] });

    expect(screen.getByRole("button", { name: "Action" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Drama" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("keeps existing filters when another one changes", async () => {
    renderFilters({ genres: ["28"], minRating: "7" });

    await userEvent.selectOptions(screen.getByLabelText("Released from"), "2020");

    expect(replace).toHaveBeenCalledWith("/discover?genres=28&from=2020&rating=7", {
      scroll: false,
    });
  });

  it("drags the far end of the year range along instead of matching nothing", async () => {
    renderFilters({ yearTo: "2000" });

    await userEvent.selectOptions(screen.getByLabelText("Released from"), "2020");

    expect(replace).toHaveBeenCalledWith("/discover?from=2020&to=2020", {
      scroll: false,
    });
  });

  it("leaves the default sort out of the URL", async () => {
    renderFilters({ sort: "vote_average.desc" });

    await userEvent.selectOptions(screen.getByLabelText("Sort by"), "popularity.desc");

    expect(replace).toHaveBeenCalledWith("/discover", { scroll: false });
  });

  it("offers a reset only once something is filtered", async () => {
    const { unmount } = renderFilters();
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
    unmount();

    renderFilters({ genres: ["28"], yearFrom: "2020" });
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(replace).toHaveBeenCalledWith("/discover", { scroll: false });
  });
});
