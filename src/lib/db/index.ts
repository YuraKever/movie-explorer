import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Клиент Drizzle поверх node-postgres (обычный TCP-драйвер `pg`).
 * Работает и с локальным Postgres из docker-compose, и с Neon в проде —
 * меняется только DATABASE_URL. Пул один на процесс.
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
export { schema };
