"use client";

import { useToast } from "@/providers/toast-provider";

/**
 * Share the current page. Uses the Web Share API where it exists (the share
 * sheet on mobile is what people expect) and falls back to copying the link,
 * which is the whole feature on a desktop browser.
 */
export function ShareButton({ title, className = "" }: { title: string; className?: string }) {
  const toast = useToast();

  async function onClick() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Dismissing the share sheet is a choice, not a failure.
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied to the clipboard.");
    } catch {
      toast("Could not copy the link.");
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 fill-none stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      <span className="text-sm">Share</span>
    </button>
  );
}
