import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";

/**
 * TMDB proxy. Any client request shaped like
 *   /api/tmdb/<TMDB path>?<query>
 * is proxied to https://api.themoviedb.org/3/<TMDB path> with the key injected
 * on the server. The client never sees the key.
 *
 * Example: GET /api/tmdb/trending/movie/week
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const search = Object.fromEntries(request.nextUrl.searchParams.entries());

  try {
    const data = await tmdbFetch(path.join("/"), search);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
