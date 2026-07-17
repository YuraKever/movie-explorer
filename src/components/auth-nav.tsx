"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";

const itemClass =
  "rounded-md px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10";

/**
 * Правая часть шапки: состояние авторизации. Реактивно через `useSession`
 * (обновляется на вход/выход без полной перезагрузки). До ответа — скелет,
 * чтобы не мигать «Войти» у уже залогиненного.
 */
export function AuthNav() {
  const router = useRouter();
  const { data, isPending } = useSession();

  if (isPending) {
    return (
      <div
        className="h-7 w-16 animate-pulse rounded-md bg-black/5 dark:bg-white/10"
        aria-hidden
      />
    );
  }

  if (!data) {
    return (
      <Link href="/login" className={itemClass}>
        Войти
      </Link>
    );
  }

  async function onLogout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <span
        className="hidden max-w-[12rem] truncate text-sm text-foreground/60 sm:inline"
        title={data.user.email}
      >
        {data.user.email}
      </span>
      <button type="button" onClick={onLogout} className={itemClass}>
        Выйти
      </button>
    </div>
  );
}
