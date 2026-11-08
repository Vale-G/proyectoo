import { cache } from "react";
import { after } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está configurada. Copiá .env.example a .env.local.");
  // A request owns its transport. Supavisor pools the database side; do not keep
  // a TCP socket in a global variable across suspended Vercel invocations.
  const client = postgres(connectionString, { max: 1, prepare: false, idle_timeout: 5, connect_timeout: 10 });
  after(async () => { await client.end({ timeout: 5 }); });
  return drizzle(client, { schema });
}

// React cache deduplicates within the server request, never across users/requests.
export const db = cache(createDatabase);
export type Database = ReturnType<typeof createDatabase>;
