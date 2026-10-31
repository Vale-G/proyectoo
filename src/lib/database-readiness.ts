import { sql } from 'drizzle-orm';
import type { Database } from '@/db/client';

/** Read-only gate: refuse Preview writes unless the database identifies itself as isolated. */
export async function assertDatabaseReady(database: Database, preview = process.env.VERCEL_ENV === 'preview') {
  const columns = await database.execute(sql`select count(*)::int as count from information_schema.columns where table_schema='public' and table_name='repair_orders' and column_name in ('intake_data','consent','revision','initial_status','initial_estimate_cents','initial_deposit_cents')`);
  if (Number(columns[0]?.count) !== 6) throw new Error('OmniFix necesita las migraciones de recepción antes de operar.');
  if (preview) {
    const marker = await database.execute(sql`select kind from public.omnifix_environment where id=true`);
    if (marker[0]?.kind !== 'preview') throw new Error('Preview bloqueado: la base no está identificada como entorno aislado de pruebas.');
  }
}
