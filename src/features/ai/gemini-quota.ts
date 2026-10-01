import { APICallError, RetryError } from "ai";

/**
 * What a failed Gemini call means for a long batch job:
 * - `per-minute`: wait the server's delay and send the same request again;
 * - `per-day`: nothing more gets through until the quota resets — stop cleanly;
 * - `transient`: a server hiccup (5xx) worth a short wait and one more try;
 * - `other`: a real error.
 */
export type QuotaVerdict =
  | { kind: "per-minute"; retryAfterMs: number }
  | { kind: "per-day" }
  | { kind: "transient"; retryAfterMs: number }
  | { kind: "other" };

/** When a 429 names no delay, a full window is the safe guess. */
const DEFAULT_MINUTE_WAIT_MS = 60_000;
const TRANSIENT_WAIT_MS = 5_000;

type GoogleErrorBody = {
  error?: {
    details?: {
      "@type"?: string;
      violations?: { quotaId?: string }[];
      retryDelay?: string;
    }[];
  };
};

export function classifyQuotaError(error: unknown): QuotaVerdict {
  // The SDK wraps the provider error when it gave up after its own retries.
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  if (!APICallError.isInstance(cause)) return { kind: "other" };

  if (cause.statusCode !== undefined && cause.statusCode >= 500) {
    return { kind: "transient", retryAfterMs: TRANSIENT_WAIT_MS };
  }
  if (cause.statusCode !== 429) return { kind: "other" };

  const details = parseBody(cause.responseBody)?.error?.details ?? [];
  const quotaIds = details.flatMap((d) => d.violations?.map((v) => v.quotaId ?? "") ?? []);
  if (quotaIds.some((id) => id.includes("PerDay"))) return { kind: "per-day" };

  const delay = details.find((d) => d.retryDelay)?.retryDelay;
  return { kind: "per-minute", retryAfterMs: parseDelay(delay) ?? DEFAULT_MINUTE_WAIT_MS };
}

function parseBody(body: string | undefined): GoogleErrorBody | null {
  try {
    return body ? (JSON.parse(body) as GoogleErrorBody) : null;
  } catch {
    return null;
  }
}

/** Google's duration format: "47s", "0.5s". */
function parseDelay(delay: string | undefined): number | null {
  const seconds = delay?.match(/^(\d+(?:\.\d+)?)s$/)?.[1];
  return seconds ? Math.ceil(Number(seconds) * 1000) : null;
}
