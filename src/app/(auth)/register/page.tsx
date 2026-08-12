import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Sign up" };

/** Open-redirect guard: only internal paths pass (a single leading /). */
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
      <h1 className="text-2xl font-bold tracking-tight">Sign up</h1>
      <p className="mb-6 mt-1 text-sm text-foreground/60">
        Create an account — your favorites will stay with you.
      </p>
      <RegisterForm redirectTo={safeRedirect(redirect)} />
    </>
  );
}
