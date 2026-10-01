/**
 * Copies the movie index (`movie_embeddings`) from the local database to
 * production, so production never spends its own embedding quota: the model is
 * the same, so the vectors are the same.
 *
 *   npm run ai:sync-prod
 *
 * Source: DATABASE_URL from .env.local. Target: DATABASE_URL from
 * .env.production.local, or SYNC_TARGET_URL to rehearse against a scratch
 * database. The target is replaced in one transaction and committed only when
 * its row count and checksum match the source's — a failed run changes nothing.
 */
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { Client } from "pg";
import { directConnectionUrl, isSameDatabase } from "@/lib/db/connection-url";

const TABLE = "public.movie_embeddings";
/** Rows per INSERT: ~1000 parameters, far under Postgres's 65535. */
const INSERT_BATCH = 200;

/** Order-independent of physical layout: every row's id, hash and vector, sorted by id. */
const CHECKSUM_SQL = `
  select count(*)::int as rows,
         coalesce(md5(string_agg(movie_id || ':' || content_hash || ':' || md5(embedding::text), ','
                                 order by movie_id)), '') as checksum
  from ${TABLE}`;

type Row = {
  movie_id: number;
  content: string;
  content_hash: string;
  embedding: string;
  updated_at: Date;
};

function targetUrl(): string {
  if (process.env.SYNC_TARGET_URL) return process.env.SYNC_TARGET_URL;
  let file: string;
  try {
    file = readFileSync(".env.production.local", "utf8");
  } catch {
    throw new Error("No target: create .env.production.local with the production DATABASE_URL.");
  }
  const url = parseEnv(file).DATABASE_URL;
  if (!url) throw new Error(".env.production.local has no DATABASE_URL.");
  return url;
}

/** Host and database only — never print credentials. */
const describe = (url: string) => {
  const parsed = new URL(url);
  return `${parsed.hostname}${parsed.pathname}`;
};

async function columnType(client: Client): Promise<string | null> {
  const { rows } = await client.query<{ type: string | null }>(
    `select format_type(atttypid, atttypmod) as type
     from pg_attribute
     where attrelid = to_regclass($1) and attname = 'embedding' and not attisdropped`,
    [TABLE],
  );
  return rows[0]?.type ?? null;
}

async function main() {
  const sourceUrl = process.env.DATABASE_URL;
  if (!sourceUrl) throw new Error("No source: DATABASE_URL is not set (.env.local).");

  const target = directConnectionUrl(targetUrl());
  if (isSameDatabase(sourceUrl, target.url)) {
    throw new Error("Source and target are the same database — refusing to copy it onto itself.");
  }
  if (target.wasPooled) {
    console.log("Target is Neon's pooled endpoint — using the direct one for the bulk copy.");
  }
  console.log(`Source: ${describe(sourceUrl)}\nTarget: ${describe(target.url)}`);

  const source = new Client({ connectionString: sourceUrl });
  const dest = new Client({ connectionString: target.url });
  await source.connect();
  await dest.connect();

  try {
    const [sourceType, destType] = await Promise.all([columnType(source), columnType(dest)]);
    if (!destType) {
      throw new Error(`${TABLE} does not exist on the target — run db:migrate against it first.`);
    }
    if (sourceType !== destType) {
      throw new Error(`Embedding column differs: source ${sourceType}, target ${destType}.`);
    }

    const { rows } = await source.query<Row>(
      `select movie_id, content, content_hash, embedding::text as embedding, updated_at
       from ${TABLE} order by movie_id`,
    );
    // An empty source would wipe production's index.
    if (rows.length === 0) throw new Error("The local index is empty — run ai:index first.");
    const expected = (await source.query<{ rows: number; checksum: string }>(CHECKSUM_SQL)).rows[0];
    console.log(`Source: ${expected.rows} rows, checksum ${expected.checksum}`);

    await dest.query("begin");
    await dest.query(`truncate ${TABLE}`);
    for (let i = 0; i < rows.length; i += INSERT_BATCH) {
      const batch = rows.slice(i, i + INSERT_BATCH);
      const values = batch.map((_, j) => {
        const p = j * 5;
        return `($${p + 1}, $${p + 2}, $${p + 3}, $${p + 4}::vector, $${p + 5})`;
      });
      await dest.query(
        `insert into ${TABLE} (movie_id, content, content_hash, embedding, updated_at)
         values ${values.join(", ")}`,
        batch.flatMap((r) => [r.movie_id, r.content, r.content_hash, r.embedding, r.updated_at]),
      );
    }

    const actual = (await dest.query<{ rows: number; checksum: string }>(CHECKSUM_SQL)).rows[0];
    console.log(`Target: ${actual.rows} rows, checksum ${actual.checksum}`);
    if (actual.rows !== expected.rows || actual.checksum !== expected.checksum) {
      await dest.query("rollback");
      throw new Error("Target does not match the source — rolled back, production is unchanged.");
    }
    await dest.query("commit");
    console.log("Committed: production has the local index.");
  } catch (error) {
    await dest.query("rollback").catch(() => {});
    throw error;
  } finally {
    await Promise.all([source.end(), dest.end()]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
