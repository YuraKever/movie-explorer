import { vi } from "vitest";

type Route = (url: string, init?: RequestInit) => Response | Promise<Response>;

/**
 * Replace global fetch with a tiny router. Components under test talk to
 * `/api/favorites` through the real client code, so the seam stays at the
 * network boundary rather than inside the query layer.
 *
 * Keys are `"<METHOD> <path>"`; an unrouted request fails the test loudly.
 */
export function stubFetch(routes: Record<string, Route>) {
  const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const key = `${init?.method ?? "GET"} ${url}`;
    const route = routes[key];
    if (!route) throw new Error(`Unrouted request: ${key}`);
    return route(url, init);
  });

  vi.stubGlobal("fetch", mock);
  return mock;
}

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status });
