import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let cached: ReturnType<typeof createDatabase> | undefined;

function createDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada. Copiá .env.example a .env.local.");
  }

  return drizzle(postgres(connectionString, { max: 1, prepare: false, idle_timeout: 20, connect_timeout: 10 }), { schema });
}

export function db() {
  return cached ??= createDatabase();
}

export type Database = ReturnType<typeof createDatabase>;
