import type { Metadata } from "next";
import { FavoritesList } from "@/components/favorites-list";

export const metadata: Metadata = { title: "Избранное" };

/**
 * Страница избранного. Сама статична; данные — из localStorage внутри клиентского
 * `FavoritesList`.
 */
export default function FavoritesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Избранное</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Сохранённые фильмы — живут в этом браузере.
      </p>

      <div className="mt-6">
        <FavoritesList />
      </div>
    </main>
  );
}
