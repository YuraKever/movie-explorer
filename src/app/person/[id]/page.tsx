import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPerson } from "@/features/movies/api.server";
import { MovieGrid } from "@/components/movie-grid";
import { profileUrl } from "@/lib/tmdb";
import type { Movie } from "@/features/movies/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const person = await getPerson(id).catch(() => null);
  if (!person) return { title: "Person not found" };

  const description =
    person.biography?.slice(0, 200) || `Movies featuring ${person.name}.`;
  const image = profileUrl(person.profile_path, "h632");

  return {
    title: person.name,
    description,
    openGraph: {
      title: person.name,
      description,
      type: "profile",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

/**
 * A person and their filmography. Reached from the cast strip on a movie page,
 * where the names used to be plain text — a dead end in the navigation.
 */
export default async function PersonPage({ params }: Props) {
  const { id } = await params;
  const person = await getPerson(id).catch(() => null);
  if (!person) notFound();

  const photo = profileUrl(person.profile_path, "h632");
  const credits = knownFor(person.movie_credits?.cast ?? []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative aspect-[2/3] w-40 shrink-0 self-start overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
          {photo ? (
            <Image
              src={photo}
              alt={`${person.name} portrait`}
              fill
              sizes="160px"
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="flex h-full items-center justify-center text-4xl opacity-30"
              aria-hidden
            >
              👤
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {person.name}
          </h1>
          <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-foreground/60">
            {person.known_for_department && <span>{person.known_for_department}</span>}
            {person.birthday && <span>Born {person.birthday}</span>}
            {person.deathday && <span>Died {person.deathday}</span>}
            {person.place_of_birth && <span>{person.place_of_birth}</span>}
          </p>

          {person.biography && (
            <>
              <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-foreground/50">
                Biography
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                {person.biography}
              </p>
            </>
          )}
        </div>
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-foreground/50">
        Known for
      </h2>
      <div className="mt-4">
        {credits.length > 0 ? (
          <MovieGrid movies={credits} />
        ) : (
          <p className="py-8 text-center text-foreground/60">
            No movie credits on TMDB.
          </p>
        )}
      </div>
    </main>
  );
}

/**
 * TMDB returns credits in no useful order and includes every walk-on part.
 * Popularity is the closest thing it has to "what this person is known for".
 */
function knownFor(cast: Movie[]): Movie[] {
  return [...cast]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 20);
}
