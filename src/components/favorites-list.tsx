"use client";

import Link from "next/link";
import { useFavorites } from "@/features/favorites/queries";
import { MovieGrid } from "@/components/movie-grid";

/**
 * Server-side favorites list. While loading — a skeleton; then either the grid
 * or an invitation to start. The /favorites page is already protected on the
 * server (requireUser), so only signed-in users get here.
 */
export function FavoritesList() {
  const { data, isPending } = useFavorites();

  if (isPending) return <SkeletonGrid />;

  if (!data || data.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-foreground/60">Nothing here yet.</p>
        <p className="mt-1 text-sm text-foreground/50">
          Hit ♥ on a poster to save a movie. Start with{" "}
          <Link href="/discover" className="text-amber-600 hover:underline dark:text-amber-400">
            discover
          </Link>
          .
        </p>
      </div>
    );
  }

  return <MovieGrid movies={data} priority />;
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
