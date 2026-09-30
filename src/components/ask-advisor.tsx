"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { askRequest } from "@/features/ai/api";
import { ErrorTile } from "./error-tile";
import { MovieCard } from "./movie-card";
import { MOVIE_GRID, SkeletonGrid } from "./movie-grid";

const EXAMPLES = [
  "A heist that happens inside a dream",
  "грустный фильм про космос и отца с дочерью",
  "мир — это компьютерная симуляция",
  "something to laugh at with friends",
];

/**
 * The advisor: a question in, up to five cards with the model's reason out.
 * Not kept in the URL like search: a reload or a shared link would re-run a
 * model call of several seconds for an answer nobody asked for again.
 */
export function AskAdvisor() {
  const [question, setQuestion] = useState("");
  const ask = useMutation({ mutationFn: askRequest });

  function submit(text: string) {
    const q = text.trim();
    if (q.length < 3 || ask.isPending) return;
    setQuestion(q);
    ask.mutate(q);
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="flex max-w-2xl flex-col gap-2 sm:flex-row"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={300}
          placeholder="What do you feel like watching?"
          aria-label="Your question"
          autoFocus
          className="w-full rounded-lg border border-black/10 bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-amber-500 dark:border-white/15"
        />
        <button
          type="submit"
          disabled={ask.isPending || question.trim().length < 3}
          className="shrink-0 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {ask.isPending ? "Thinking…" : "Ask"}
        </button>
      </form>

      {ask.isIdle && (
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => submit(example)}
              className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground dark:border-white/15 dark:hover:bg-white/10"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {/* Announces what the grid below cannot: that the wait ended and how. */}
      <p aria-live="polite" className="sr-only">
        {ask.isPending && "Looking for movies"}
        {ask.isSuccess && `${ask.data.length} movies suggested`}
        {ask.isError && "The advisor could not answer"}
      </p>

      <div className="mt-8">
        {ask.isPending && (
          <>
            <p className="mb-4 text-sm text-foreground/60">
              Finding candidates and asking the model — usually 5–15 seconds, longer
              for the first question after a pause while the model loads…
            </p>
            <SkeletonGrid count={5} />
          </>
        )}

        {ask.isError && <ErrorTile title="No answer this time" error={ask.error} />}

        {ask.isSuccess &&
          (ask.data.length === 0 ? (
            <p className="py-16 text-center text-foreground/60">
              Nothing in the catalog fits that. Try describing the plot, the mood or a theme.
            </p>
          ) : (
            <ul className={MOVIE_GRID}>
              {ask.data.map(({ movie, reason }, i) => (
                <li key={movie.id}>
                  <MovieCard movie={movie} priority={i < 5} />
                  <p className="mt-1 text-xs leading-relaxed text-foreground/70">{reason}</p>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}
