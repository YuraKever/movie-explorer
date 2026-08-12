import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import {
  addFavorite,
  listFavorites,
  movieCardSchema,
} from "@/features/favorites/api.server";

/** GET /api/favorites — the current user's favorites. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await listFavorites(session.user.id);
  return NextResponse.json({ items });
}

/** POST /api/favorites — add a movie (body is a MovieCardData slice). */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = movieCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await addFavorite(session.user.id, parsed.data);
  return NextResponse.json({ ok: true }, { status: 201 });
}
