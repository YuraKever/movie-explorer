"use client";

/**
 * Minimal toast: one transient message at the bottom of the screen, used for
 * failures the UI would otherwise swallow (an optimistic update rolling back).
 * A live region announces it to screen readers; a new message replaces the old.
 */
import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext<((message: string) => void) | null>(null);

const VISIBLE_MS = 5000;

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), VISIBLE_MS);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      >
        {message && (
          <p className="rounded-lg border border-amber-500/30 bg-background px-4 py-2 text-sm shadow-lg">
            {message}
          </p>
        )}
      </div>
    </ToastContext>
  );
}
