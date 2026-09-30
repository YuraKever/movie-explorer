import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { askAdvisor } from "@/features/ai/ask.server";
import { getSession } from "@/lib/dal";
import { POST } from "./route";

vi.mock("@/lib/dal", () => ({ getSession: vi.fn() }));
vi.mock("@/features/ai/ask.server", () => ({ askAdvisor: vi.fn(async () => []) }));

/** Each test signs in as a fresh user so the per-user window starts clean. */
let user = 0;

function signIn() {
  user += 1;
  vi.mocked(getSession).mockResolvedValue({
    user: { id: `user-${user}` },
  } as Awaited<ReturnType<typeof getSession>>);
}

function ask(body: unknown) {
  return POST(
    new NextRequest("http://localhost:3000/api/ask", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

afterEach(() => {
  vi.mocked(getSession).mockReset();
  vi.mocked(askAdvisor).mockClear();
});

describe("POST /api/ask", () => {
  it("turns a guest away before spending a model call", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    expect((await ask({ question: "a robot in love" })).status).toBe(401);
    expect(askAdvisor).not.toHaveBeenCalled();
  });

  it("rejects a question that is too short, too long or not JSON", async () => {
    signIn();
    for (const body of [{ question: "  a " }, { question: "x".repeat(301) }, "not json"]) {
      expect((await ask(body)).status).toBe(400);
    }
    expect(askAdvisor).not.toHaveBeenCalled();
  });

  it("passes the trimmed question on and returns the picks", async () => {
    signIn();
    const res = await ask({ question: "  a robot in love  " });

    expect(res.status).toBe(200);
    expect(askAdvisor).toHaveBeenCalledWith("a robot in love");
    await expect(res.json()).resolves.toEqual({ picks: [] });
  });

  it("limits each user to ten questions a minute", async () => {
    signIn();
    const statuses = [];
    for (let i = 0; i < 12; i += 1) statuses.push((await ask({ question: "a robot in love" })).status);

    expect(statuses.filter((s) => s === 429)).toHaveLength(2);
  });

  it("answers 503 without leaking the error when the model is down", async () => {
    signIn();
    vi.spyOn(console, "error").mockImplementationOnce(() => {});
    vi.mocked(askAdvisor).mockRejectedValueOnce(new Error("connect ECONNREFUSED 10.0.0.5:11434"));

    const res = await ask({ question: "a robot in love" });

    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain("10.0.0.5");
  });
});
