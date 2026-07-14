import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

/**
 * Шапка сайта: бренд-ссылка на главную и переключатель темы.
 * Прилипает к верху и слегка размывает фон под собой при скролле контента.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-background/80 backdrop-blur-md dark:border-white/10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span aria-hidden>🎬</span>
          <span>Movie Explorer</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/search"
            className="rounded-md px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
          >
            Поиск
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
