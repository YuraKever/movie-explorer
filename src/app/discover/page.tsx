import type { Metadata } from "next";
import { getGenres } from "@/features/movies/api.server";
import { Filters } from "@/components/filters";
import { DiscoverFeed } from "@/components/discover-feed";
import type { DiscoverFilters, SortOption } from "@/features/movies/types";

export const metadata: Metadata = { title: "Каталог" };

type Props = {
  searchParams: Promise<{ genre?: string; year?: string; sort?: string }>;
};

/**
 * Каталог с фильтрами и бесконечной лентой. Фильтры читаем из URL на сервере и
 * передаём вниз пропами (без `useSearchParams`). Справочник жанров тянем на
 * сервере — он статичен и хорошо кэшируется.
 */
export default async function DiscoverPage({ searchParams }: Props) {
  const { genre, year, sort } = await searchParams;
  const genres = await getGenres();
  const maxYear = new Date().getFullYear();

  const filters: DiscoverFilters = {
    genre,
    year,
    sort: (sort as SortOption) || "popularity.desc",
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Каталог фильмов
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        Фильтруй по жанру, году и сортировке — лента подгружается по мере прокрутки.
      </p>

      <div className="mt-6">
        <Filters genres={genres} current={{ genre, year, sort }} maxYear={maxYear} />
      </div>

      <div className="mt-8">
        <DiscoverFeed filters={filters} />
      </div>
    </main>
  );
}
