"use client";

import { useRouter } from "next/navigation";
import type { Genre, SortOption } from "@/features/movies/types";

const SORTS: { value: SortOption; label: string }[] = [
  { value: "popularity.desc", label: "Популярные" },
  { value: "vote_average.desc", label: "По рейтингу" },
  { value: "primary_release_date.desc", label: "Новинки" },
  { value: "revenue.desc", label: "По сборам" },
];

const DEFAULT_SORT: SortOption = "popularity.desc";

type Props = {
  genres: Genre[];
  current: { genre?: string; year?: string; sort?: string };
  maxYear: number;
};

/**
 * Панель фильтров каталога. Источник правды — URL: каждое изменение пишет
 * `searchParams` через `router.replace`, поэтому подборку можно расшарить и она
 * переживает перезагрузку. Год по умолчанию не ставим (sort — единственный
 * фильтр со значением по умолчанию, его в URL не пишем ради чистых ссылок).
 */
export function Filters({ genres, current, maxYear }: Props) {
  const router = useRouter();
  const years = Array.from({ length: maxYear - 1950 + 1 }, (_, i) => maxYear - i);

  function apply(patch: Partial<{ genre: string; year: string; sort: string }>) {
    const next = { ...current, ...patch };
    const params = new URLSearchParams();
    if (next.genre) params.set("genre", next.genre);
    if (next.year) params.set("year", next.year);
    if (next.sort && next.sort !== DEFAULT_SORT) params.set("sort", next.sort);

    const qs = params.toString();
    router.replace(qs ? `/discover?${qs}` : "/discover", { scroll: false });
  }

  const hasFilters = Boolean(
    current.genre ||
      current.year ||
      (current.sort && current.sort !== DEFAULT_SORT),
  );

  const selectClass =
    "rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-amber-500 dark:border-white/15";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        aria-label="Жанр"
        value={current.genre ?? ""}
        onChange={(e) => apply({ genre: e.target.value || undefined })}
        className={selectClass}
      >
        <option value="">Все жанры</option>
        {genres.map((genre) => (
          <option key={genre.id} value={String(genre.id)}>
            {genre.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Год выпуска"
        value={current.year ?? ""}
        onChange={(e) => apply({ year: e.target.value || undefined })}
        className={selectClass}
      >
        <option value="">Любой год</option>
        {years.map((year) => (
          <option key={year} value={String(year)}>
            {year}
          </option>
        ))}
      </select>

      <select
        aria-label="Сортировка"
        value={current.sort ?? DEFAULT_SORT}
        onChange={(e) => apply({ sort: e.target.value })}
        className={selectClass}
      >
        {SORTS.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.replace("/discover", { scroll: false })}
          className="text-sm text-foreground/60 underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
