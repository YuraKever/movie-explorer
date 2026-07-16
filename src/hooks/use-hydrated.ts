"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * true только после гидрации на клиенте; на сервере и в первый клиентский рендер
 * — false. Нужен там, где UI зависит от данных, которых нет на сервере
 * (localStorage через zustand/persist): до гидрации рендерим «серверный» вариант.
 *
 * Реализован через useSyncExternalStore (серверный снапшот false, клиентский true),
 * а не setState в эффекте — так нет лишнего каскадного рендера и hydration-ошибок.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
