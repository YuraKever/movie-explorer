/**
 * Neon's pooled endpoint is the direct one with `-pooler` on the first host
 * label (ep-x-pooler.region… → ep-x.region…). A bulk copy belongs on the
 * direct endpoint: pooled server connections are shared with the live site,
 * so a long transaction holds one of them and any session state left behind
 * reaches other clients.
 */
export function directConnectionUrl(url: string): { url: string; wasPooled: boolean } {
  const parsed = new URL(url);
  const [first, ...rest] = parsed.hostname.split(".");
  if (!first.endsWith("-pooler")) return { url, wasPooled: false };
  parsed.hostname = [first.slice(0, -"-pooler".length), ...rest].join(".");
  return { url: parsed.toString(), wasPooled: true };
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** Whether two connection strings point at the same database (host, port, name). */
export function isSameDatabase(a: string, b: string): boolean {
  const key = (url: string) => {
    const parsed = new URL(url);
    const host = LOCAL_HOSTS.has(parsed.hostname) ? "localhost" : parsed.hostname.toLowerCase();
    return `${host}:${parsed.port || "5432"}${parsed.pathname}`;
  };
  return key(a) === key(b);
}
