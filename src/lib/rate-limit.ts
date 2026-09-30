export type RateLimitResult = { allowed: boolean; retryAfter: number };

/**
 * Per-instance fixed window. Serverless spreads callers across instances, so
 * this is a brake on runaway clients, not a quota — a real quota would need
 * shared storage.
 */
export function createRateLimiter({
  windowMs,
  maxRequests,
}: {
  windowMs: number;
  maxRequests: number;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function rateLimit(key: string): RateLimitResult {
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
      }
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfter: 0 };
    }

    entry.count += 1;
    return entry.count > maxRequests
      ? { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
      : { allowed: true, retryAfter: 0 };
  };
}

/** The caller's IP as the proxy in front of us reports it. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
