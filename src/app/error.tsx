"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Границы ошибок обязаны быть клиентскими. Ловит непредвиденные ошибки рендера
 * сегмента (например, если серверный запрос к TMDB упал). `reset()` перемонтирует
 * сегмент — для транзиентных сбоев это повторная попытка.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl" aria-hidden>
        😕
      </p>
      <h1 className="mt-4 text-xl font-bold">Что-то пошло не так</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Не удалось загрузить эту страницу. Попробуй ещё раз.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          Повторить
        </button>
        <Link
          href="/"
          className="rounded-lg border border-black/10 px-4 py-2 text-sm transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
