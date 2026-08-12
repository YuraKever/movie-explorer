"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  useIsFavorite,
  useToggleFavorite,
} from "@/features/favorites/queries";
import type { MovieCardData } from "@/features/movies/types";

type Props = {
  movie: MovieCardData;
  withLabel?: boolean;
  className?: string;
};

/**
 * Favorite toggle. Lives both inside a card link (icon only) and on the detail
 * page (with a label). Favorites are stored server-side per account:
 *  - guest → the click leads to /login (returning to the current page);
 *  - signed in → optimistic toggle through TanStack Query.
 *
 * `active` depends on the session: false until it resolves (and on the server),
 * which matches the server render and avoids a hydration mismatch. Inside a
 * `<Link>` we swallow the navigation (preventDefault/stopPropagation) so the
 * click does not open the movie.
 */
export function FavoriteButton({ movie, withLabel = false, className = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isFav = useIsFavorite(movie.id);
  const toggle = useToggleFavorite();
  const active = Boolean(session) && isFav;

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    toggle.mutate({ movie, isFav });
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      title={active ? "Remove from favorites" : "Add to favorites"}
      onClick={onClick}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 ${active ? "fill-red-500 stroke-red-500" : "fill-none stroke-current"}`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {withLabel && (
        <span className="text-sm">
          {active ? "In favorites" : "Add to favorites"}
        </span>
      )}
    </button>
  );
}
