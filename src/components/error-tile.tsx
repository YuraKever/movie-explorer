type Props = {
  /** What failed, in the user's terms — e.g. "Could not load results". */
  title: string;
  error: unknown;
};

/** Shared failure tile for the movie feeds and the favorites list. */
export function ErrorTile({ title, error }: Props) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
      <p className="font-medium">⚠️ {title}</p>
      <p className="mt-1 text-foreground/70">
        {error instanceof Error ? error.message : "Unknown error"}
      </p>
    </div>
  );
}
