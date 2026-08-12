import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

/** Open-redirect guard: only internal paths pass (a single leading /). */
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
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mb-6 mt-1 text-sm text-foreground/60">
        Sign in to keep your favorites available on any device.
      </p>
      <LoginForm redirectTo={safeRedirect(redirect)} />
    </>
  );
}
