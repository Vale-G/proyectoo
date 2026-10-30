import { requireWorkshopAccess } from "./auth";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db/client";
import { customers, devices, repairOrderEvents, repairOrders, workshops, type RepairStatus } from "@/db/schema";

export async function ensureWorkshop() {
  await requireWorkshopAccess();
  return db().transaction(async (database) => {
  await database.execute(sql`select pg_advisory_xact_lock(837401)`);
  const existing = await database.select().from(workshops).limit(1);
  if (existing[0]) return existing[0];

  const [workshop] = await database.insert(workshops).values({
    name: "OmniFix",
    publicName: "OmniFix",
  }).returning();
  return workshop;
  });
}

export async function listOrders(query?: string, status?: RepairStatus) {
  const workshop = await ensureWorkshop();
  const database = db();
  const conditions = [eq(repairOrders.workshopId, workshop.id)];

  if (status) conditions.push(eq(repairOrders.status, status));
  if (query) {
    const term = `%${query}%`;
    conditions.push(or(
      ilike(repairOrders.orderNumber, term),
      ilike(customers.fullName, term),
      ilike(customers.phone, term),
      ilike(devices.model, term),
    )!);
  }

  return database.select({
    id: repairOrders.id,
    orderNumber: repairOrders.orderNumber,
    publicToken: repairOrders.publicToken,
    status: repairOrders.status,
    reportedIssue: repairOrders.reportedIssue,
    estimatedCompletion: repairOrders.estimatedCompletion,
    estimateCents: repairOrders.estimateCents,
    depositCents: repairOrders.depositCents,
    createdAt: repairOrders.createdAt,
    customerName: customers.fullName,
    customerPhone: customers.phone,
    deviceCategory: devices.category,
    deviceBrand: devices.brand,
    deviceModel: devices.model,
  }).from(repairOrders)
    .innerJoin(devices, eq(repairOrders.deviceId, devices.id))
    .innerJoin(customers, eq(devices.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(repairOrders.createdAt));
}

export async function getOrder(id: string) {
  const workshop = await ensureWorkshop();
  const database = db();
  const [order] = await database.select({
    id: repairOrders.id,
    orderNumber: repairOrders.orderNumber,
    publicToken: repairOrders.publicToken,
    status: repairOrders.status,
    reportedIssue: repairOrders.reportedIssue,
    intakeCondition: repairOrders.intakeCondition,
    accessories: repairOrders.accessories,
    diagnosis: repairOrders.diagnosis,
    proposedSolution: repairOrders.proposedSolution,
    estimateCents: repairOrders.estimateCents,
    depositCents: repairOrders.depositCents,
    estimatedCompletion: repairOrders.estimatedCompletion,
    createdAt: repairOrders.createdAt,
    customerName: customers.fullName,
    customerPhone: customers.phone,
    deviceCategory: devices.category,
    deviceBrand: devices.brand,
    deviceModel: devices.model,
    deviceColor: devices.color,
    deviceSerial: devices.serialNumber,
  }).from(repairOrders)
    .innerJoin(devices, eq(repairOrders.deviceId, devices.id))
    .innerJoin(customers, eq(devices.customerId, customers.id))
    .where(and(eq(repairOrders.id, id), eq(repairOrders.workshopId, workshop.id)))
    .limit(1);

  if (!order) return null;
  const events = await database.select().from(repairOrderEvents)
    .where(eq(repairOrderEvents.orderId, order.id))
    .orderBy(desc(repairOrderEvents.createdAt));
  return { ...order, events };
}

export async function getPublicOrder(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const database = db();
  const [order] = await database.select({
    orderNumber: repairOrders.orderNumber,
    status: repairOrders.status,
    estimatedCompletion: repairOrders.estimatedCompletion,
    createdAt: repairOrders.createdAt,
    publicName: workshops.publicName,
    whatsapp: workshops.whatsapp,
    deviceCategory: devices.category,
    deviceBrand: devices.brand,
    deviceModel: devices.model,
  }).from(repairOrders)
    .innerJoin(workshops, eq(repairOrders.workshopId, workshops.id))
    .innerJoin(devices, eq(repairOrders.deviceId, devices.id))
    .where(eq(repairOrders.publicToken, token))
    .limit(1);
  return order ?? null;
}

export async function createOrder(input: {
  customerName: string; phone: string; email?: string; category: string; brand?: string;
  model: string; color?: string; serialNumber?: string; reportedIssue: string;
  intakeCondition?: string; accessories?: string; proposedSolution?: string;
  estimateCents?: string; depositCents?: string; status: RepairStatus;
}) {
  const workshop = await ensureWorkshop();
  return db().transaction(async (database) => {
  await database.execute(sql`select pg_advisory_xact_lock(hashtext(${workshop.id}))`);
  const [customer] = await database.insert(customers).values({
    workshopId: workshop.id, fullName: input.customerName, phone: input.phone, email: input.email || null,
  }).returning();
  const [device] = await database.insert(devices).values({
    workshopId: workshop.id, customerId: customer.id, category: input.category, brand: input.brand || null,
    model: input.model, color: input.color || null, serialNumber: input.serialNumber || null,
  }).returning();
  const existing = await database.select({ last: sql<string>`coalesce(max(case when ${repairOrders.orderNumber} ~ '^[0-9]+$' then ${repairOrders.orderNumber}::numeric else 0 end), 0)` }).from(repairOrders)
    .where(eq(repairOrders.workshopId, workshop.id));
  const orderNumber = String(BigInt(existing[0].last) + 1n).padStart(5, "0");
  const publicToken = randomBytes(32).toString("hex");
  const [order] = await database.insert(repairOrders).values({
    workshopId: workshop.id, deviceId: device.id, orderNumber, publicToken, status: input.status,
    reportedIssue: input.reportedIssue, intakeCondition: input.intakeCondition || null,
    accessories: input.accessories || null, proposedSolution: input.proposedSolution || null,
    estimateCents: input.estimateCents || null, depositCents: input.depositCents || null,
  }).returning();
  await database.insert(repairOrderEvents).values({
    orderId: order.id, toStatus: input.status, note: "Orden creada durante la recepción.",
  });
  return order;
  });
}
