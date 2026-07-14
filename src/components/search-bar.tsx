"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Поле поиска с debounce. Источник правды — URL (`/search?query=`), поэтому
 * результат можно расшарить и он переживает перезагрузку. Ввод хранится в
 * локальном состоянии (отзывчивость), а в URL уходит через 350 мс после паузы.
 *
 * `initialQuery` — значение из URL на момент рендера страницы. Сравнение с ним
 * гасит лишнюю навигацию на монтировании и предотвращает цикл.
 */
export function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    const q = value.trim();
    if (q === initialQuery) return; // уже синхронно с URL

    const timer = setTimeout(() => {
      router.replace(q ? `/search?query=${encodeURIComponent(q)}` : "/search", {
        scroll: false,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [value, initialQuery, router]);

  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Название фильма…"
        aria-label="Поиск фильмов"
        autoFocus
        className="w-full rounded-lg border border-black/10 bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-amber-500 dark:border-white/15"
      />
    </div>
  );
}
