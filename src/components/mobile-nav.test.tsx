import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNav } from "./mobile-nav";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/auth-client", () => ({
  authClient: { signOut: vi.fn() },
  useSession: () => ({ data: null, isPending: false }),
}));

const openButton = () => screen.getByRole("button", { name: "Open menu" });

describe("MobileNav", () => {
  it("keeps the links out of the tab order until it is opened", async () => {
    render(<MobileNav />);

    expect(openButton()).toHaveAttribute("aria-expanded", "false");
    // Hidden with display:none, so it is out of both the a11y tree and the tab order.
    expect(screen.queryByRole("link", { name: "Discover" })).not.toBeInTheDocument();

    await userEvent.click(openButton());

    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("link", { name: "Discover" })).toBeVisible();
  });

  it("closes on Escape and hands focus back to the button", async () => {
    render(<MobileNav />);
    await userEvent.click(openButton());

    await userEvent.keyboard("{Escape}");

    expect(openButton()).toHaveAttribute("aria-expanded", "false");
    expect(openButton()).toHaveFocus();
  });

  it("closes when the pointer goes down outside the panel", async () => {
    render(
      <div>
        <MobileNav />
        <p>outside</p>
      </div>,
    );
    await userEvent.click(openButton());

    await userEvent.click(screen.getByText("outside"));

    expect(openButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("stays open while the pointer goes down inside the panel", async () => {
    render(<MobileNav />);
    await userEvent.click(openButton());

    await userEvent.click(screen.getByRole("navigation", { name: "Main" }));

    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });
});
