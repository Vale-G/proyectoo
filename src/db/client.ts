import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada. Copiá .env.example a .env.local.");
  }

  return drizzle(postgres(connectionString, { max: 1 }), { schema });
}
