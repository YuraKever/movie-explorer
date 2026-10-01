import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { askRequest } from "@/features/ai/api";
import { AskAdvisor } from "./ask-advisor";

vi.mock("@/features/ai/api", () => ({ askRequest: vi.fn() }));
vi.mock("@/lib/auth-client", () => ({ useSession: () => ({ data: null }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/ask",
}));

const movie = (id: number, title: string) => ({
  id,
  title,
  poster_path: null,
  release_date: "2008-06-22",
  vote_average: 8,
});

describe("AskAdvisor", () => {
  it("shows a reason under a card that has one and nothing under a card that has none", async () => {
    vi.mocked(askRequest).mockResolvedValue({
      engine: "gemini",
      picks: [
        { movie: movie(10681, "WALL·E"), reason: "A robot cleans up an empty Earth." },
        { movie: movie(603, "The Matrix") },
      ],
    });
    renderWithProviders(<AskAdvisor />);

    await userEvent.type(screen.getByLabelText("Your question"), "a lonely robot{Enter}");

    const items = await screen.findAllByRole("listitem");
    expect(items[0]).toHaveTextContent("A robot cleans up an empty Earth.");
    expect(items[1].querySelectorAll("li > p")).toHaveLength(0);
  });

  it("asks the engine picked in the switch and says when Jev fell back to Gemini", async () => {
    vi.mocked(askRequest).mockResolvedValue({ engine: "gemini", picks: [{ movie: movie(603, "The Matrix") }] });
    renderWithProviders(<AskAdvisor />);

    await userEvent.type(screen.getByLabelText("Your question"), "a simulated world{Enter}");
    expect(askRequest).toHaveBeenLastCalledWith(
      { question: "a simulated world", engine: "jev" },
      expect.anything(),
    );
    expect(await screen.findByText(/Jev is unavailable/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "Gemini" }));
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(askRequest).toHaveBeenLastCalledWith(
      { question: "a simulated world", engine: "gemini" },
      expect.anything(),
    );
    expect(await screen.findByText("Chosen by Gemini")).toBeInTheDocument();
  });
});
