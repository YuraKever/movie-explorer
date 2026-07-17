import { NextResponse } from "next/server";
import { getSession } from "@/lib/dal";
import { removeFavorite } from "@/features/favorites/api.server";

/** DELETE /api/favorites/:movieId — убрать фильм из избранного. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ movieId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { movieId } = await params;
  const id = Number(movieId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  await removeFavorite(session.user.id, id);
  return NextResponse.json({ ok: true });
}
