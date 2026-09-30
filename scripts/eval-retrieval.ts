/**
 * Measures search by meaning against `evals/queries.json`: for every query,
 * where its expected movies rank and how far they sit; then recall@8, MRR and
 * what distance thresholds would cut or let through (queries with no expected
 * movie are nonsense that should find nothing). Retrieval runs without the production
 * threshold so the threshold itself can be judged.
 *
 *   npm run ai:eval               # retrieval only, ~20 s
 *   npm run ai:eval -- --advisor  # plus the chat model on every query with an expected movie
 */
import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
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
import { passesThreshold } from "@/features/ai/hybrid";
import { findSimilarMovies, type RetrievedMovie } from "@/features/ai/retrieve.server";
import { db } from "@/lib/db";
import { movieEmbeddings } from "@/lib/db/schema";

const K = 8;
/** Keeps the advisor run under the free tier's per-minute limit, so a 429 is not scored as a failure. */
const ADVISOR_PAUSE_MS = 6_000;
/** Deeper than K to show how far a miss is; pgvector's HNSW returns at most ef_search (40) rows. */
const DEPTH = 40;
const THRESHOLDS = [0.35, 0.4, 0.45, 0.5, 0.6];

const queries = z
  .array(
    z.object({
      q: z.string(),
      expect: z.array(z.number().int()),
      /** Names and titles are scored apart: a fix for them must not cost the plot queries. */
      kind: z.literal("name").optional(),
      hard: z.string().optional(),
    }),
  )
  .parse(JSON.parse(readFileSync("evals/queries.json", "utf8")));

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
  const results: (EvalResult & { q: string; kind?: "name"; titles: Map<number, string> })[] = [];
  const nonsense: { q: string; hits: RetrievedMovie[] }[] = [];
  for (const { q, expect, kind } of queries) {
    if (expect.length === 0) {
      nonsense.push({ q, hits: await findSimilarMovies(q, { k: K, maxDistance: Infinity }) });
      continue;
    }
    const hits = await findSimilarMovies(q, { k: DEPTH, maxDistance: Infinity });
    results.push({
      q,
      kind,
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
      const hit = r.ranked[rank - 1];
      return `${mark} ${r.titles.get(id)} #${rank} (${hit.distance.toFixed(3)}${hit.textMatch ? ", text" : ""})`;
    });
    console.log(`«${r.q}»\n   ${cells.join("\n   ")}`);
  }

  for (const n of nonsense) {
    const closest = Math.min(...n.hits.map((h) => h.distance));
    const matched = n.hits.filter((h) => h.textMatch).length;
    console.log(`«${n.q}» (should find nothing)\n   closest: ${closest.toFixed(3)}, text matches: ${matched}`);
  }

  const summary = (label: string, subset: EvalResult[]) =>
    console.log(
      `${label.padEnd(8)} recall@${K}: ${percent(recallAt(subset, K))}   MRR: ${meanReciprocalRank(subset).toFixed(3)}   (${subset.length} queries)`,
    );
  console.log("");
  summary("all", results);
  summary("plot", results.filter((r) => r.kind !== "name"));
  summary("names", results.filter((r) => r.kind === "name"));
  const found = results.reduce((n, r) => n + ranksOf(r).filter((x) => x !== null && x <= K).length, 0);
  for (const t of THRESHOLDS) {
    const passed = nonsense.filter((n) => n.hits.some((h) => passesThreshold(h, t))).length;
    console.log(
      `threshold ${t}: cuts ${cutByThreshold(results, K, t)} of ${found} expected hits in the top ${K}, ` +
        `lets ${passed} of ${nonsense.length} nonsense queries through`,
    );
  }
}

async function evalAdvisor() {
  const asked = queries.filter((q) => q.expect.length > 0);

  // Distance cannot filter nonsense on this model, so the advisor has to.
  let rejected = 0;
  const nonsense = queries.filter((q) => q.expect.length === 0);
  for (const { q } of nonsense) {
    await sleep(ADVISOR_PAUSE_MS);
    const answer = await askAdvisor(q).catch(() => null);
    if (answer?.length === 0) rejected += 1;
    console.log(`«${q}» (nonsense) → ${answer === null ? "(failed)" : answer.map((p) => p.movie.title).join(", ") || "(nothing)"}`);
  }
  console.log(`advisor rejects ${rejected} of ${nonsense.length} nonsense queries\n`);

  let expected = 0;
  let picked = 0;
  let empty = 0;
  let picks = 0;
  let failed = 0;
  let ms = 0;

  for (const { q, expect } of asked) {
    await sleep(ADVISOR_PAUSE_MS);
    const started = Date.now();
    const answer = await askAdvisor(q).catch((error: Error) => {
      failed += 1;
      console.log(`«${q}» → (failed: ${error.name})`);
      return null;
    });
    ms += Date.now() - started;
    if (!answer) continue;
    picks += answer.length;
    empty += answer.length === 0 ? 1 : 0;
    expected += expect.length;
    picked += expect.filter((id) => answer.some((p) => p.movie.id === id)).length;
    console.log(`«${q}» → ${answer.length === 0 ? "(nothing)" : ""}`);
    for (const p of answer) console.log(`   ${p.movie.title} — ${p.reason}`);
  }

  const n = asked.length;
  console.log(
    `\nadvisor (${n} queries): expected picked ${picked}/${expected}, empty ${empty}, failed ${failed}, ` +
      `avg picks ${(picks / n).toFixed(1)}, avg ${Math.round(ms / n)} ms`,
  );
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
