import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";

/**
 * Прокси к TMDB. Любой клиентский запрос вида
 *   /api/tmdb/<путь TMDB>?<query>
 * проксируется на https://api.themoviedb.org/3/<путь TMDB> с подставленным
 * на сервере ключом. Клиент ключа не видит.
 *
 * Пример: GET /api/tmdb/trending/movie/week
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
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
