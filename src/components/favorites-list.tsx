"use client";

import Link from "next/link";
import { useFavorites } from "@/store/favorites";
import { useHydrated } from "@/hooks/use-hydrated";
import { MovieGrid } from "@/components/movie-grid";

/**
 * Список избранного из localStorage. До гидрации показываем skeleton, совпадающий
 * с серверным «пусто», — иначе рассинхрон. После — реальная сетка либо приглашение.
 */
export function FavoritesList() {
  const hydrated = useHydrated();
  const items = useFavorites((s) => s.items);

  if (!hydrated) return <SkeletonGrid />;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-foreground/60">Пока пусто.</p>
        <p className="mt-1 text-sm text-foreground/50">
          Нажми ♥ на постере, чтобы сохранить фильм. Начни с{" "}
          <Link href="/discover" className="text-amber-600 hover:underline dark:text-amber-400">
            каталога
          </Link>
          .
        </p>
      </div>
    );
  }

  return <MovieGrid movies={items} priority />;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] animate-pulse rounded-xl bg-black/5 dark:bg-white/10"
        />
      ))}
    </div>
  );
}
