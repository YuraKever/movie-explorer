"use client";

import { useTheme } from "next-themes";

/**
 * Переключатель светлой/тёмной темы.
 *
 * Иконка выбирается чисто через CSS (`dark:` варианты), а не через состояние
 * React: класс `.dark` на <html> ставит синхронный скрипт next-themes ещё до
 * гидрации, поэтому нужная иконка видна сразу и без рассинхрона гидрации.
 * aria-label намеренно статичный — иначе разметка сервера и клиента разошлась бы.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Переключить тему"
      title="Переключить тему"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground dark:border-white/15 dark:hover:bg-white/10"
    >
      {/* Солнце — видно в тёмной теме */}
      <svg
        className="hidden h-5 w-5 dark:block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {/* Луна — видно в светлой теме */}
      <svg
        className="block h-5 w-5 dark:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
