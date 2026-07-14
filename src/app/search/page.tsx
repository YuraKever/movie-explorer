import type { Metadata } from "next";
import { SearchBar } from "@/components/search-bar";
import { SearchResults } from "@/components/search-results";

export const metadata: Metadata = { title: "Поиск" };

type Props = { searchParams: Promise<{ query?: string }> };

/**
 * Страница поиска. Запрос читаем из URL на сервере (`searchParams`) и передаём
 * вниз пропом — так обходимся без `useSearchParams` и его Suspense-границы.
 * Сам поиск и рендер результатов — клиентские (SearchBar + SearchResults).
 */
export default async function SearchPage({ searchParams }: Props) {
  const { query = "" } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Поиск фильмов
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        Найди фильм по названию — по данным TMDB.
      </p>

      <div className="mt-6 max-w-md">
        <SearchBar initialQuery={query} />
      </div>

      <SearchResults query={query} />
    </main>
  );
}
