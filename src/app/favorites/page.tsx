import type { Metadata } from "next";

import { requireUser } from "@/lib/dal";
import { FavoritesList } from "@/components/favorites-list";

export const metadata: Metadata = { title: "Избранное" };

/**
 * Страница избранного. Защищена на сервере (`requireUser` — страховка помимо
 * оптимистичного редиректа в proxy). Данные тянет клиентский `FavoritesList`.
 */
export default async function FavoritesPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Избранное</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Сохранённые фильмы — привязаны к твоему аккаунту.
      </p>

      <div className="mt-6">
        <FavoritesList />
      </div>
    </main>
  );
}
