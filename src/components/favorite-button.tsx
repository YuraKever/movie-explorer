"use client";

import { useFavorites } from "@/store/favorites";
import { useHydrated } from "@/hooks/use-hydrated";
import type { MovieCardData } from "@/features/movies/types";

type Props = {
  movie: MovieCardData;
  withLabel?: boolean;
  className?: string;
};

/**
 * Кнопка «в избранное». Живёт и внутри карточки-ссылки (иконка), и на деталях
 * (с подписью). `active` учитывает `useHydrated`: до монтирования всегда false —
 * так вывод совпадает с серверным и нет hydration-ошибки. Внутри `<Link>` гасим
 * переход (preventDefault/stopPropagation), чтобы клик не открывал фильм.
 */
export function FavoriteButton({ movie, withLabel = false, className = "" }: Props) {
  const hydrated = useHydrated();
  const isFav = useFavorites((s) => s.items.some((m) => m.id === movie.id));
  const toggle = useFavorites((s) => s.toggle);
  const active = hydrated && isFav;

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Убрать из избранного" : "Добавить в избранное"}
      title={active ? "Убрать из избранного" : "Добавить в избранное"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(movie);
      }}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 ${active ? "fill-red-500 stroke-red-500" : "fill-none stroke-current"}`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {withLabel && (
        <span className="text-sm">{active ? "В избранном" : "В избранное"}</span>
      )}
    </button>
  );
}
