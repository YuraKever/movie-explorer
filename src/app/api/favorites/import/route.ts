import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/dal";
import {
  importFavorites,
  listFavorites,
  movieCardSchema,
} from "@/features/favorites/api.server";

/** Разумный потолок на один импорт, чтобы не залить БД мусором. */
const importSchema = z.array(movieCardSchema).max(500);

/**
 * POST /api/favorites/import — массовый перенос избранного из localStorage.
 * Возвращает актуальный список (для прайминга кеша на клиенте).
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  await importFavorites(session.user.id, parsed.data);
  const items = await listFavorites(session.user.id);
  return NextResponse.json({ items });
}
