import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Drizzle client on top of node-postgres (the plain TCP `pg` driver).
 * Works both with the local Postgres from docker-compose and with Neon in
 * production — only DATABASE_URL changes. One pool per process.
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
export { schema };
