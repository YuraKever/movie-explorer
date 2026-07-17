import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import {
  addFavorite,
  listFavorites,
  movieCardSchema,
} from "@/features/favorites/api.server";

/** GET /api/favorites — избранное текущего пользователя. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const items = await listFavorites(session.user.id);
  return NextResponse.json({ items });
}

/** POST /api/favorites — добавить фильм (тело — срез MovieCardData). */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = movieCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  await addFavorite(session.user.id, parsed.data);
  return NextResponse.json({ ok: true }, { status: 201 });
}
