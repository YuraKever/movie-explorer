import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Proxy (в Next 16 — бывший middleware). Делает ОПТИМИСТИЧНУЮ проверку:
 * читает только наличие session-cookie (без похода в БД — proxy бежит на каждом
 * роуте, включая prefetch). Настоящая проверка — в самих страницах/роут-хендлерах
 * через DAL (`requireUser`).
 *
 *  - гость на /favorites  → редирект на /login?redirect=/favorites
 *  - залогиненный на /login|/register → редирект на /favorites
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
