"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { importLocalFavorites } from "@/features/favorites/migrate-local";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-amber-500 dark:border-white/15";

/**
 * Форма входа (email + пароль) на клиенте Better Auth. При успехе переносим
 * избранное из localStorage на сервер (разовая миграция) и уходим на `redirectTo`.
 * `router.refresh()` — чтобы серверные компоненты увидели новую сессию.
 */
export function LoginForm({ redirectTo = "/favorites" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message ?? "Не удалось войти. Проверь почту и пароль.");
      setPending(false);
      return;
    }

    await importLocalFavorites();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Входим…" : "Войти"}
      </button>

      <p className="text-center text-sm text-foreground/60">
        Нет аккаунта?{" "}
        <Link
          href="/register"
          className="text-amber-600 hover:underline dark:text-amber-400"
        >
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}
