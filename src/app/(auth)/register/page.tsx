import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Регистрация" };

/** Защита от open-redirect: пускаем только внутренние пути (одиночный ведущий /). */
function safeRedirect(target: string | undefined): string {
  return target && /^\/(?!\/)/.test(target) ? target : "/favorites";
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Регистрация</h1>
      <p className="mb-6 mt-1 text-sm text-foreground/60">
        Создай аккаунт — избранное будет храниться за тобой.
      </p>
      <RegisterForm redirectTo={safeRedirect(redirect)} />
    </>
  );
}
