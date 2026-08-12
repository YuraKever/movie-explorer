import type { Metadata } from "next";

import { requireUser } from "@/lib/dal";
import { FavoritesList } from "@/components/favorites-list";

export const metadata: Metadata = { title: "Favorites" };

/**
 * Favorites page. Protected on the server (`requireUser` — a safety net beyond
 * the optimistic redirect in proxy). Data is fetched by the client-side
 * `FavoritesList`.
 */
export default async function FavoritesPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Favorites</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Saved movies — tied to your account.
      </p>

      <div className="mt-6">
        <FavoritesList />
      </div>
    </main>
  );
}
