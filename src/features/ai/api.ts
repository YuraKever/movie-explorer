import type { AdvisorPick } from "./ask.server";

/** Client-side call to the advisor (`/api/ask`); the session rides in the cookie. */
export async function askRequest(question: string): Promise<AdvisorPick[]> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const body = (await res.json().catch(() => null)) as
    | { picks: AdvisorPick[]; error?: undefined }
    | { error?: string }
    | null;

  if (!res.ok || !body || !("picks" in body)) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body.picks;
}
