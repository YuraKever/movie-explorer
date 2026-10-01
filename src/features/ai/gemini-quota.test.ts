import { APICallError, RetryError } from "ai";
import { describe, expect, it } from "vitest";
import { classifyQuotaError } from "./gemini-quota";

/** The body Gemini sends with a 429, as captured from the free tier. */
function quotaBody(quotaId: string, retryDelay?: string) {
  return JSON.stringify({
    error: {
      code: 429,
      message: "You exceeded your current quota, please check your plan and billing details.",
      status: "RESOURCE_EXHAUSTED",
      details: [
        { "@type": "type.googleapis.com/google.rpc.Help", links: [] },
        {
          "@type": "type.googleapis.com/google.rpc.QuotaFailure",
          violations: [
            {
              quotaMetric: "generativelanguage.googleapis.com/embed_content_free_tier_requests",
              quotaId,
              quotaValue: "100",
            },
          ],
        },
        ...(retryDelay ? [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay }] : []),
      ],
    },
  });
}

function apiError(statusCode: number, responseBody?: string) {
  return new APICallError({
    message: "Gemini call failed",
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents",
    requestBodyValues: {},
    statusCode,
    responseBody,
  });
}

const PER_MINUTE = "EmbedContentRequestsPerMinutePerUserPerProjectPerModel-FreeTier";
const PER_DAY = "EmbedContentRequestsPerDayPerProjectPerModel-FreeTier";

describe("classifyQuotaError", () => {
  it("waits out the per-minute quota for as long as the server asks", () => {
    expect(classifyQuotaError(apiError(429, quotaBody(PER_MINUTE, "47s")))).toEqual({
      kind: "per-minute",
      retryAfterMs: 47_000,
    });
  });

  it("stops on the per-day quota, whatever delay comes with it", () => {
    expect(classifyQuotaError(apiError(429, quotaBody(PER_DAY, "43s")))).toEqual({
      kind: "per-day",
    });
  });

  it("sees through the SDK's RetryError to the last provider error", () => {
    const retry = new RetryError({
      message: "Failed after 3 attempts",
      reason: "maxRetriesExceeded",
      errors: [apiError(429, quotaBody(PER_MINUTE, "10s")), apiError(429, quotaBody(PER_DAY))],
    });
    expect(classifyQuotaError(retry)).toEqual({ kind: "per-day" });
  });

  it("falls back to a full minute when a 429 names no delay or has no readable body", () => {
    expect(classifyQuotaError(apiError(429, quotaBody(PER_MINUTE)))).toEqual({
      kind: "per-minute",
      retryAfterMs: 60_000,
    });
    expect(classifyQuotaError(apiError(429, "<html>Too Many Requests</html>"))).toEqual({
      kind: "per-minute",
      retryAfterMs: 60_000,
    });
  });

  it("retries a server error briefly and gives up on anything else", () => {
    expect(classifyQuotaError(apiError(503)).kind).toBe("transient");
    expect(classifyQuotaError(apiError(400)).kind).toBe("other");
    expect(classifyQuotaError(new Error("socket hang up")).kind).toBe("other");
  });
});
