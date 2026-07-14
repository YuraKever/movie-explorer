"use client";

/**
 * Провайдер TanStack Query. Клиентский: держит единственный QueryClient на
 * всё приложение. `useState`-инициализатор гарантирует, что клиент создаётся
 * один раз на монтирование, а не на каждый рендер.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
