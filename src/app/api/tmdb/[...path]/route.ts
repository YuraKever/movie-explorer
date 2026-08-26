import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";

/**
 * TMDB proxy. A client request shaped like
 *   /api/tmdb/<TMDB path>?<query>
 * is forwarded to https://api.themoviedb.org/3/<TMDB path> with the credentials
 * injected on the server, so the key never reaches the browser.
 *
 * Because the credentials are ours, the route is not a general-purpose relay:
 * only the endpoints the client actually calls are forwarded, responses are
 * cacheable by the CDN, and a single caller cannot spend the whole quota.
 *
 * Example: GET /api/tmdb/trending/movie/week
 */

/** Everything the client is allowed to ask for, anchored end to end. */
const ALLOWED_PATHS = [
  /^trending\/movie\/(day|week)$/,
  /^search\/movie$/,
  /^discover\/movie$/,
  /^movie\/\d+$/,
  /^genre\/movie\/list$/,
];

const CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

const RATE_LIMIT = { windowMs: 60_000, maxRequests: 60 };

/**
 * Per-instance fixed window. Serverless spreads callers across instances, so
 * this is a brake on runaway clients, not a quota — a real quota would need
 * shared storage.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now >= entry.resetAt) {
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
    }
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT.maxRequests
    ? { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
    : { allowed: true, retryAfter: 0 };
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const tmdbPath = path.join("/");

  if (!ALLOWED_PATHS.some((allowed) => allowed.test(tmdbPath))) {
    return NextResponse.json({ error: "Unsupported path" }, { status: 404 });
  }

  const { allowed, retryAfter } = rateLimit(clientKey(request));
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const search = new URLSearchParams(request.nextUrl.searchParams);
  search.delete("api_key");

  try {
    const data = await tmdbFetch(tmdbPath, search);
    return NextResponse.json(data, {
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
