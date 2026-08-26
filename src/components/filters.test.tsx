import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Filters } from "./filters";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const genres = [
  { id: 28, name: "Action" },
  { id: 18, name: "Drama" },
];

function renderFilters(current: { genre?: string; year?: string; sort?: string } = {}) {
  return render(<Filters genres={genres} current={current} maxYear={2026} />);
}

describe("Filters", () => {
  it("writes the chosen genre into the URL", async () => {
    renderFilters();

    await userEvent.selectOptions(screen.getByLabelText("Genre"), "28");

    expect(replace).toHaveBeenCalledWith("/discover?genre=28", { scroll: false });
  });

  it("keeps existing filters when another one changes", async () => {
    renderFilters({ genre: "28" });

    await userEvent.selectOptions(screen.getByLabelText("Release year"), "2020");

    expect(replace).toHaveBeenCalledWith("/discover?genre=28&year=2020", {
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

    renderFilters({ genre: "28", year: "2020" });
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(replace).toHaveBeenCalledWith("/discover", { scroll: false });
  });
});
