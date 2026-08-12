"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { importLocalFavorites } from "@/features/favorites/migrate-local";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-amber-500 dark:border-white/15";

/**
 * Sign-in form (email + password) on the Better Auth client. On success we move
 * favorites from localStorage to the server (one-off migration) and navigate to
 * `redirectTo`. `router.refresh()` — so server components see the new session.
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
      setError(error.message ?? "Could not sign in. Check your email and password.");
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
          Password
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
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-foreground/60">
        No account yet?{" "}
        <Link
          href="/register"
          className="text-amber-600 hover:underline dark:text-amber-400"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
