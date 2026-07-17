import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Вход" };

/** Защита от open-redirect: пускаем только внутренние пути (одиночный ведущий /). */
function safeRedirect(target: string | undefined): string {
  return target && /^\/(?!\/)/.test(target) ? target : "/favorites";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Вход</h1>
      <p className="mb-6 mt-1 text-sm text-foreground/60">
        Войди, чтобы избранное было доступно на любом устройстве.
      </p>
      <LoginForm redirectTo={safeRedirect(redirect)} />
    </>
  );
}
