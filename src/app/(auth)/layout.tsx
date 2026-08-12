/**
 * Shared shell for /login and /register: a narrow centered column.
 * The (auth) route group does not affect the URL — it only groups these screens.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-col px-4 py-16">
      {children}
    </main>
  );
}
