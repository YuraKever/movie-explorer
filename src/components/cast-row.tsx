import Image from "next/image";
import Link from "next/link";
import { profileUrl } from "@/lib/tmdb";
import type { CastMember } from "@/features/movies/types";

/** Horizontal cast strip: photo, name, character — each card links to the person. */
export function CastRow({ cast }: { cast: CastMember[] }) {
  return (
    <ul className="flex gap-4 overflow-x-auto pb-2">
      {cast.map((person) => {
        const photo = profileUrl(person.profile_path, "w185");
        return (
          <li key={person.id} className="w-24 shrink-0">
            <Link
              href={`/person/${person.id}`}
              className="group block focus:outline-none"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-black/5 ring-1 ring-black/5 transition group-hover:ring-black/15 group-focus-visible:ring-2 group-focus-visible:ring-amber-500 dark:bg-white/5 dark:ring-white/10 dark:group-hover:ring-white/25">
                {photo ? (
                  <Image
                    src={photo}
                    alt={person.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full items-center justify-center text-2xl opacity-30"
                    aria-hidden
                  >
                    👤
                  </div>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-medium transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">
                {person.name}
              </p>
              {person.character && (
                <p className="line-clamp-1 text-xs text-foreground/50">
                  {person.character}
                </p>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
