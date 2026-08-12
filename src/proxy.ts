import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Proxy (the former middleware in Next 16). Performs an OPTIMISTIC check: it
 * only reads whether a session cookie exists (no DB round-trip — proxy runs on
 * every route, prefetches included). The real check lives in the pages and route
 * handlers themselves, through the DAL (`requireUser`).
 *
 *  - guest on /favorites → redirect to /login?redirect=/favorites
 *  - signed-in user on /login|/register → redirect to /favorites
 */
const protectedRoutes = ["/favorites"];
const authRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  if (!hasSession && protectedRoutes.some((p) => pathname.startsWith(p))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/favorites", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/favorites/:path*", "/login", "/register"],
};
