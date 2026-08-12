import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/dal";
import {
  importFavorites,
  listFavorites,
  movieCardSchema,
} from "@/features/favorites/api.server";

/** Sane ceiling for a single import, so the DB cannot be flooded. */
const importSchema = z.array(movieCardSchema).max(500);

/**
 * POST /api/favorites/import — bulk transfer of favorites from localStorage.
 * Returns the current list (to prime the client cache).
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await importFavorites(session.user.id, parsed.data);
  const items = await listFavorites(session.user.id);
  return NextResponse.json({ items });
}
