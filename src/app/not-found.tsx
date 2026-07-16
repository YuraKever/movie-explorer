import Link from "next/link";

/**
 * Корневой not-found: ловит и `notFound()` (например, несуществующий фильм),
 * и любые несовпавшие URL по всему приложению.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-foreground/20" aria-hidden>
        404
      </p>
      <h1 className="mt-4 text-xl font-bold">Страница не найдена</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Возможно, фильм не существует или ссылка устарела.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          На главную
        </Link>
        <Link
          href="/discover"
          className="rounded-lg border border-black/10 px-4 py-2 text-sm transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          В каталог
        </Link>
      </div>
    </main>
  );
}
