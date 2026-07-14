"use client";

/**
 * Тонкая обёртка над next-themes. Провайдер обязан быть клиентским, поэтому
 * выносим его отдельно, чтобы корневой layout мог остаться серверным.
 * next-themes сам вставляет в <head> синхронный скрипт, который выставляет
 * класс темы до первой отрисовки — поэтому нет «мигания» при загрузке.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider(
  props: ComponentProps<typeof NextThemesProvider>,
) {
  return <NextThemesProvider {...props} />;
}
