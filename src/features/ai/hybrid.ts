/**
 * Reciprocal Rank Fusion: each list adds 1 / (k + rank) to the movies it
 * ranks, so a movie high in either list — or fair in both — comes first. Ranks
 * rather than scores, because a cosine distance and a text rank have no common
 * scale. k = 60 is the constant from the original RRF paper: it keeps one
 * list's first place from drowning the other list out.
 */
export function fuseRankings(rankings: number[][], k = 60): number[] {
  const scores = new Map<number, number>();
  for (const ranking of rankings) {
    ranking.forEach((id, i) => scores.set(id, (scores.get(id) ?? 0) + 1 / (k + i + 1)));
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

/**
 * A hit counts when its meaning is close enough, or when the words of the
 * query literally appear in the movie's document — a name or a title is
 * evidence the distance alone cannot see.
 */
export function passesThreshold(
  hit: { distance: number; textMatch?: boolean },
  maxDistance: number,
): boolean {
  return Boolean(hit.textMatch) || hit.distance <= maxDistance;
}
