/**
 * Общий каркас для /login и /register: узкая центрированная колонка.
 * Route group (auth) не влияет на URL — только группирует эти экраны.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-col px-4 py-16">
      {children}
    </main>
  );
}
