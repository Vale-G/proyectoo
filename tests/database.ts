import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';

type Engine = { exec: (query:string)=>Promise<unknown>; query: <T extends Record<string,unknown> = Record<string,unknown>>(query:string)=>Promise<{rows:T[]}> };
export async function testDatabase() {
  let server: PGLiteSocketServer | undefined;
  let embedded: PGlite | undefined;
  let admin: ReturnType<typeof postgres> | undefined;
  let createdDatabase: string | undefined;
  const clients: Array<ReturnType<typeof postgres>> = [];
  let url: string;
  const native = process.env.OMNIFIX_TEST_DATABASE_URL;
  if (native) {
    const parsed=new URL(native);
    if (!['127.0.0.1','localhost','[::1]'].includes(parsed.hostname) || parsed.pathname !== '/omnifix_test' || process.env.OMNIFIX_ALLOW_TEST_DATABASE !== '1') throw new Error('Native tests require explicit loopback omnifix_test database and OMNIFIX_ALLOW_TEST_DATABASE=1. DATABASE_URL is never used.');
    admin=postgres(native,{max:1,prepare:false,onnotice:()=>{}});
    createdDatabase=`omnifix_test_${randomBytes(10).toString('hex')}`;
    await admin.unsafe(`CREATE DATABASE "${createdDatabase}"`);
    parsed.pathname=`/${createdDatabase}`;url=parsed.toString();
  } else {
    embedded=await PGlite.create();
    server=new PGLiteSocketServer({db:embedded,port:0,host:'127.0.0.1',maxConnections:10});
    await server.start();url=`postgres://postgres:postgres@${server.getServerConn()}/postgres`;
  }
  function connect() {
    const client=postgres(url,{max:1,prepare:false,connect_timeout:10,onnotice:()=>{}});clients.push(client);
    return {client,database:drizzle(client,{schema})};
  }
  const {client,database}=connect();
  const pg:Engine={async exec(query){return client.unsafe(query)},async query<T extends Record<string,unknown>>(query:string){return {rows:await client.unsafe<T[]>(query)}}};
  try {
    await pg.exec("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF; IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF; END $$;");
    await pg.exec(await readFile('drizzle/0000_initial.sql','utf8'));
    await pg.exec('GRANT USAGE ON SCHEMA public TO anon, authenticated; GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;');
    await pg.exec(await readFile('drizzle/0001_intake_receipts.sql','utf8'));
    await pg.exec(await readFile('drizzle/0002_environment_guard.sql','utf8'));
    await pg.exec("UPDATE public.omnifix_environment SET kind='preview' WHERE id=true");
  } catch(error) {await close();throw error;}
  async function close(){
    await Promise.all(clients.map(c=>c.end({timeout:2})));
    await server?.stop();await embedded?.close();
    if(admin && createdDatabase){await admin.unsafe(`DROP DATABASE "${createdDatabase}" WITH (FORCE)`);await admin.end({timeout:2});}
  }
  return {pg,database,url,connect,close,native:Boolean(native)};
}
