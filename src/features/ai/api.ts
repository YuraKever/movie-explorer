import type { AdvisorEngine } from "./ask";
import type { AdvisorAnswer } from "./ask.server";

/** Client-side call to the advisor (`/api/ask`); the session rides in the cookie. */
export async function askRequest({
  question,
  engine,
}: {
  question: string;
  engine: AdvisorEngine;
}): Promise<AdvisorAnswer> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, engine }),
  });
  const body = (await res.json().catch(() => null)) as
    | (AdvisorAnswer & { error?: undefined })
    | { error?: string }
    | null;

  if (!res.ok || !body || !("picks" in body)) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body;
}
