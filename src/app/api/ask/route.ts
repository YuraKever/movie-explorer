import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { askAdvisor } from "@/features/ai/ask.server";
import { getSession } from "@/lib/dal";
import { createRateLimiter } from "@/lib/rate-limit";

const bodySchema = z.object({
  question: z.string().trim().min(3).max(300),
});

/** A model call holds the machine for seconds — far below the proxy's 60 a minute. */
const rateLimit = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

/**
 * POST /api/ask — the movie advisor: `{ question }` → `{ picks: [{ movie, reason }] }`.
 * Signed-in users only, limited per user rather than per IP: the session is
 * the identity we trust, and an IP can be shared by a whole office.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, retryAfter } = rateLimit(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many questions — try again in a minute." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ask a question of 3 to 300 characters." },
      { status: 400 },
    );
  }

  try {
    const picks = await askAdvisor(parsed.data.question);
    return NextResponse.json({ picks });
  } catch (error) {
    // The message may name internal hosts — log it, answer with something useful.
    console.error("Advisor failed:", error);
    return NextResponse.json(
      { error: "The advisor is unavailable right now. Try search by meaning instead." },
      { status: 503 },
    );
  }
}
