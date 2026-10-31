import { redirect } from "next/navigation";
import { requireWorkshopAccess } from "./auth";
import { db } from "@/db/client";
import { repairStatus, type RepairStatus } from "@/db/schema";
import { assertDatabaseReady } from "./database-readiness";
import { repairStore } from "./repair-store";
import type { IntakeOrder } from "./intake";

export async function privateStore() {
  await requireWorkshopAccess();
  if (!process.env.DATABASE_URL) redirect("/configuracion");
  const database = db();
  await assertDatabaseReady(database);
  const store = repairStore(database);
  const workshop = await store.ensureWorkshop();
  return { store, workshop };
}
export async function ensureWorkshop() { return (await privateStore()).workshop; }
export async function listOrders(query?: string, status?: RepairStatus) {
  const { store, workshop } = await privateStore();
  return store.listOrders(workshop.id, query, repairStatus.enumValues.includes(status as RepairStatus) ? status : undefined);
}
export async function getOrder(id: string) { const { store, workshop } = await privateStore(); return store.getOrder(workshop.id, id); }
export async function createOrder(input: IntakeOrder) { const { store, workshop } = await privateStore(); return store.createOrder(workshop.id, input); }
export async function getPublicOrder(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const database = db();
  await assertDatabaseReady(database);
  return repairStore(database).getPublicOrder(token);
}
