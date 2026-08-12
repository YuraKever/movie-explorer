"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * YouTube trailer. Until play is pressed we show a lightweight facade (a movie
 * still + a button) and load the heavy iframe only on click. That keeps the
 * metrics clean — no third-party player on every page load.
 */
export function TrailerEmbed({
  videoKey,
  title,
  backdrop,
}: {
  videoKey: string;
  title: string;
  backdrop: string | null;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
          title={`Trailer: ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play trailer: ${title}`}
      className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      {backdrop && (
        <Image
          src={backdrop}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover opacity-60 transition group-hover:opacity-40"
        />
      )}
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition group-hover:scale-110">
        <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
