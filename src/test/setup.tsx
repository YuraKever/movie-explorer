import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// next/image needs the framework's image config, which the test environment has
// no access to; these tests care about alt text and the fallback, not sizing.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// Tailwind is not compiled for tests, and `hidden` is the one utility these
// tests lean on semantically — it decides visibility and tab order.
const style = document.createElement("style");
style.textContent = ".hidden { display: none }";
document.head.append(style);

afterEach(cleanup);
