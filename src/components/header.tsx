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
        <ThemeToggle />
      </div>
    </header>
  );
}
