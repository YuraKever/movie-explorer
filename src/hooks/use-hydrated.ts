"use client";

import { useEffect, useState } from "react";

/**
 * true только после монтирования на клиенте. Нужен там, где UI зависит от данных,
 * которых нет на сервере (localStorage через zustand/persist): до монтирования
 * рендерим «серверный» вариант, после — реальный. Так избегаем hydration-ошибок.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
