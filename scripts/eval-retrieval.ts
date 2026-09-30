/**
 * Measures search by meaning against `evals/queries.json`: for every query,
 * where its expected movies rank and how far they sit; then recall@8, MRR and
 * what distance thresholds would cut or let through (queries with no expected
 * movie are nonsense that should find nothing). Retrieval runs without the production
 * threshold so the threshold itself can be judged.
 *
 *   npm run ai:eval               # retrieval only, ~20 s
 *   npm run ai:eval -- --advisor  # plus the chat model on the Russian queries
 */
import { readFileSync } from "node:fs";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { askAdvisor } from "@/features/ai/ask.server";
import {
  cutByThreshold,
  meanReciprocalRank,
  ranksOf,
  recallAt,
  type EvalResult,
} from "@/features/ai/retrieval-metrics";
import { findSimilarMovies } from "@/features/ai/retrieve.server";
import { db } from "@/lib/db";
import { movieEmbeddings } from "@/lib/db/schema";

const K = 8;
/** Deeper than K to show how far a miss is; pgvector's HNSW returns at most ef_search (40) rows. */
const DEPTH = 40;
const THRESHOLDS = [0.5, 0.55, 0.6, 0.65];

const queries = z
  .array(z.object({ q: z.string(), expect: z.array(z.number().int()), hard: z.string().optional() }))
  .parse(JSON.parse(readFileSync("evals/queries.json", "utf8")));

const hasCyrillic = (text: string) => /[а-яё]/i.test(text);
const percent = (x: number) => `${(x * 100).toFixed(1)}%`;

/** An expected movie missing from the index would read as a retrieval failure. */
async function assertIndexed() {
  const expected = [...new Set(queries.flatMap((q) => q.expect))];
  const rows = await db
    .select({ movieId: movieEmbeddings.movieId })
    .from(movieEmbeddings)
    .where(inArray(movieEmbeddings.movieId, expected));
  const indexed = new Set(rows.map((r) => r.movieId));
  const missing = expected.filter((id) => !indexed.has(id));
  if (missing.length > 0) throw new Error(`Expected movies not in the index: ${missing.join(", ")}`);
}

async function evalRetrieval() {
  const results: (EvalResult & { q: string; titles: Map<number, string> })[] = [];
  const nonsense: { q: string; top: number }[] = [];
  for (const { q, expect } of queries) {
    if (expect.length === 0) {
      const [top] = await findSimilarMovies(q, { k: 1, maxDistance: Infinity });
      nonsense.push({ q, top: top.distance });
      continue;
    }
    const hits = await findSimilarMovies(q, { k: DEPTH, maxDistance: Infinity });
    results.push({
      q,
      expect,
      ranked: hits,
      titles: new Map(hits.map((h) => [h.movieId, h.content.split("\n")[0]])),
    });
  }

  for (const r of results) {
    const ranks = ranksOf(r);
    const cells = r.expect.map((id, i) => {
      const rank = ranks[i];
      if (rank === null) return `${id}: not in top ${DEPTH}`;
      const mark = rank <= K ? "✓" : "✗";
      return `${mark} ${r.titles.get(id)} #${rank} (${r.ranked[rank - 1].distance.toFixed(3)})`;
    });
    console.log(`«${r.q}»\n   ${cells.join("\n   ")}`);
  }

  for (const n of nonsense) console.log(`«${n.q}» (should find nothing)\n   closest: ${n.top.toFixed(3)}`);

  console.log(`\nrecall@${K}: ${percent(recallAt(results, K))}   MRR: ${meanReciprocalRank(results).toFixed(3)}`);
  const found = results.reduce((n, r) => n + ranksOf(r).filter((x) => x !== null && x <= K).length, 0);
  for (const t of THRESHOLDS) {
    const passed = nonsense.filter((n) => n.top <= t).length;
    console.log(
      `threshold ${t}: cuts ${cutByThreshold(results, K, t)} of ${found} expected hits in the top ${K}, ` +
        `lets ${passed} of ${nonsense.length} nonsense queries through`,
    );
  }
}

async function evalAdvisor() {
  const russian = queries.filter((q) => hasCyrillic(q.q) && q.expect.length > 0);
  let reasons = 0;
  let inRussian = 0;
  let expected = 0;
  let survived = 0;

  for (const { q, expect } of russian) {
    const picks = await askAdvisor(q);
    reasons += picks.length;
    inRussian += picks.filter((p) => hasCyrillic(p.reason)).length;
    expected += expect.length;
    survived += expect.filter((id) => picks.some((p) => p.movie.id === id)).length;
    console.log(`«${q}» → ${picks.map((p) => p.movie.title).join(", ") || "(nothing)"}`);
  }

  console.log(`\nadvisor on ${russian.length} Russian queries:`);
  console.log(`  reasons in Russian: ${inRussian}/${reasons} (${percent(reasons ? inRussian / reasons : 0)})`);
  console.log(`  expected movies picked: ${survived}/${expected}`);
}

async function main() {
  await assertIndexed();
  await evalRetrieval();
  if (process.argv.includes("--advisor")) {
    console.log("");
    await evalAdvisor();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
