import Image from "next/image";
import { profileUrl } from "@/lib/tmdb";
import type { CastMember } from "@/features/movies/types";

/** Горизонтальная лента актёров: фото, имя, роль. */
export function CastRow({ cast }: { cast: CastMember[] }) {
  return (
    <ul className="flex gap-4 overflow-x-auto pb-2">
      {cast.map((person) => {
        const photo = profileUrl(person.profile_path, "w185");
        return (
          <li key={person.id} className="w-24 shrink-0">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-black/5 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
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
            <p className="mt-1 line-clamp-2 text-xs font-medium">{person.name}</p>
            {person.character && (
              <p className="line-clamp-1 text-xs text-foreground/50">
                {person.character}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
