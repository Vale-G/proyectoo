import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import type { Database } from "@/db/client";
import { customers, devices, repairOrderEvents, repairOrders, repairPhotos, workshops, type RepairStatus } from "@/db/schema";
import { formatMoney } from "./format";
import { intakeOrderSchema, SERVICE_TERMS, TERMS_VERSION, UserInputError, type IntakeOrder } from "./intake";
import { canTransition } from "./status";

export const validOrderId = (id: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id);
const conflict = () => new UserInputError("La orden cambió en otra ventana. Recargá la página antes de guardar; no se aplicó este cambio.");
export function repairStore(database: Database) {
  async function ensureWorkshop() {
    return database.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(837401)`);
      const [existing] = await tx.select().from(workshops).limit(1);
      if (existing) return existing;
      const [created] = await tx.insert(workshops).values({ name: "OmniFix", publicName: "OmniFix" }).returning();
      return created;
    });
  }
  async function getOrder(workshopId: string, id: string) {
    if (!validOrderId(id)) return null;
    const [order] = await database.select({ ...getTableColumns(repairOrders), customerName: customers.fullName, customerPhone: customers.phone, customerEmail: customers.email,
      deviceCategory: devices.category, deviceBrand: devices.brand, deviceModel: devices.model, deviceColor: devices.color, deviceSerial: devices.serialNumber,
    }).from(repairOrders).innerJoin(devices, eq(repairOrders.deviceId, devices.id)).innerJoin(customers, eq(devices.customerId, customers.id))
      .where(and(eq(repairOrders.id, id), eq(repairOrders.workshopId, workshopId))).limit(1);
    if (!order) return null;
    const [events, photos] = await Promise.all([
      database.select().from(repairOrderEvents).where(eq(repairOrderEvents.orderId, id)).orderBy(desc(repairOrderEvents.createdAt)),
      database.select({ id: repairPhotos.id, description: repairPhotos.description, createdAt: repairPhotos.createdAt }).from(repairPhotos).where(eq(repairPhotos.orderId, id)).orderBy(desc(repairPhotos.createdAt)),
    ]);
    return { ...order, events, photos };
  }
  async function listOrders(workshopId: string, query = "", status?: RepairStatus) {
    const conditions = [eq(repairOrders.workshopId, workshopId)];
    if (status) conditions.push(eq(repairOrders.status, status));
    if (query) { const term = `%${query.slice(0, 150)}%`; conditions.push(or(ilike(repairOrders.orderNumber, term), ilike(customers.fullName, term), ilike(customers.phone, term), ilike(devices.model, term))!); }
    return database.select({ id: repairOrders.id, orderNumber: repairOrders.orderNumber, status: repairOrders.status, reportedIssue: repairOrders.reportedIssue, estimatedCompletion: repairOrders.estimatedCompletion,
      estimateCents: repairOrders.estimateCents, depositCents: repairOrders.depositCents, createdAt: repairOrders.createdAt, customerName: customers.fullName, customerPhone: customers.phone, deviceCategory: devices.category, deviceBrand: devices.brand, deviceModel: devices.model,
    }).from(repairOrders).innerJoin(devices, eq(repairOrders.deviceId, devices.id)).innerJoin(customers, eq(devices.customerId, customers.id)).where(and(...conditions)).orderBy(desc(repairOrders.createdAt));
  }
  async function getPublicOrder(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) return null;
    const [order] = await database.select({ orderNumber: repairOrders.orderNumber, status: repairOrders.status, publicSummary: repairOrders.publicSummary, estimatedCompletion: repairOrders.estimatedCompletion,
      createdAt: repairOrders.createdAt, publicName: workshops.publicName, whatsapp: workshops.whatsapp, deviceCategory: devices.category, deviceBrand: devices.brand, deviceModel: devices.model,
    }).from(repairOrders).innerJoin(workshops, eq(repairOrders.workshopId, workshops.id)).innerJoin(devices, eq(repairOrders.deviceId, devices.id)).where(eq(repairOrders.publicToken, token)).limit(1);
    return order ?? null;
  }
  async function createOrder(workshopId: string, raw: IntakeOrder) {
    const input = intakeOrderSchema.parse(raw);
    return database.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${workshopId}))`);
      const [customer] = await tx.insert(customers).values({ workshopId, fullName: input.customerName, phone: input.phone, email: input.email || null }).returning();
      const [device] = await tx.insert(devices).values({ workshopId, customerId: customer.id, category: input.category, brand: input.brand || null, model: input.model, color: input.color || null, serialNumber: input.serialNumber || null }).returning();
      const [number] = await tx.select({ last: sql<string>`coalesce(max(case when ${repairOrders.orderNumber} ~ '^[0-9]+$' then ${repairOrders.orderNumber}::numeric else 0 end),0)` }).from(repairOrders).where(eq(repairOrders.workshopId, workshopId));
      const now = new Date().toISOString();
      const [order] = await tx.insert(repairOrders).values({ workshopId, deviceId: device.id, orderNumber: String(BigInt(number.last) + 1n).padStart(5, "0"), publicToken: randomBytes(32).toString("hex"), status: input.status, initialStatus: input.status, initialEstimateCents: input.estimateCents, initialDepositCents: input.depositCents,
        reportedIssue: input.reportedIssue, intakeCondition: input.intakeCondition || null, accessories: input.accessories || null, proposedSolution: input.proposedSolution || null, estimateCents: input.estimateCents, depositCents: input.depositCents, intakeData: input.intake, estimatedCompletion: input.estimatedCompletion ? new Date(`${input.estimatedCompletion}T12:00:00Z`) : null,
        consent: { version: TERMS_VERSION, text: SERVICE_TERMS, acceptedAt: now, acceptedName: input.acceptedName, method: input.acceptanceMethod, eraseAuthorized: input.eraseAuthorized, eraseAcceptedAt: input.eraseAuthorized ? now : null },
      }).returning();
      await tx.insert(repairOrderEvents).values({ orderId: order.id, toStatus: input.status, note: "Orden creada y recepción registrada." });
      return order;
    });
  }
  async function changeStatus(workshopId: string, id: string, expectedRevision: number, next: RepairStatus, note: string, delivery?: { recipient: string; accessories: string }) {
    const order = await getOrder(workshopId, id);
    if (!order) throw new UserInputError("Orden no encontrada.");
    if (order.revision !== expectedRevision) throw conflict();
    if (!canTransition(order.status, next)) throw new UserInputError("Ese cambio de estado no está permitido. Revisá el estado actual.");
    if (next === "delivered" && !delivery?.recipient.trim()) throw new UserInputError("Registrá quién recibe el equipo antes de marcarlo entregado.");
    return database.transaction(async tx => {
      const [changed] = await tx.update(repairOrders).set({ status: next, updatedAt: new Date(), revision: sql`${repairOrders.revision} + 1`, ...(next === "delivered" ? { deliveredAt: new Date(), deliveredTo: delivery!.recipient.trim(), deliveryAccessories: delivery!.accessories } : {}) })
        .where(and(eq(repairOrders.id, id), eq(repairOrders.workshopId, workshopId), eq(repairOrders.revision, expectedRevision))).returning();
      if (!changed) throw conflict();
      await tx.insert(repairOrderEvents).values({ orderId: id, fromStatus: order.status, toStatus: next, note: [note, ...(next === "delivered" ? [`Entrega registrada: recibió ${delivery!.recipient.trim()}. Accesorios: ${delivery!.accessories || "Sin registrar"}.`] : [])].filter(Boolean).join("\n") || null });
      return changed;
    });
  }
  async function updateTechnical(workshopId: string, id: string, expectedRevision: number, input: { partsDescription?: string; laborDescription?: string; estimatedCompletion?: Date | null; diagnosis: string; proposedSolution: string; publicSummary: string; partsCents: string | null; laborCents: string | null; estimateCents: string | null; paidCents: string | null; approvalReference: string; warrantyUntil: Date | null }) {
    return database.transaction(async tx => {
      const [changed] = await tx.update(repairOrders).set({ ...input, revision: sql`${repairOrders.revision} + 1`, updatedAt: new Date() }).where(and(eq(repairOrders.id, id), eq(repairOrders.workshopId, workshopId), eq(repairOrders.revision, expectedRevision))).returning();
      if (!changed) throw conflict();
      await tx.insert(repairOrderEvents).values({ orderId: id, fromStatus: changed.status, toStatus: changed.status, note: `Actualización técnica. Presupuesto: ${formatMoney(changed.estimateCents)}. Pagos posteriores a la seña: ${formatMoney(changed.paidCents)}. Aprobación registrada: ${changed.approvalReference || "Sin registrar"}. Repuestos: ${changed.partsDescription || "Sin registrar"}. Trabajo: ${changed.laborDescription || "Sin registrar"}.` });
      return changed;
    });
  }
  async function rotateToken(workshopId: string, id: string, expectedRevision: number) {
    return database.transaction(async tx => {
      const [changed] = await tx.update(repairOrders).set({ publicToken: randomBytes(32).toString("hex"), revision: sql`${repairOrders.revision} + 1`, updatedAt: new Date() }).where(and(eq(repairOrders.id, id), eq(repairOrders.workshopId, workshopId), eq(repairOrders.revision, expectedRevision))).returning();
      if (!changed) throw conflict();
      await tx.insert(repairOrderEvents).values({ orderId: id, fromStatus: changed.status, toStatus: changed.status, note: "Enlace de seguimiento revocado y reemplazado. Los comprobantes anteriores tienen un QR inválido." });
      return changed;
    });
  }
  async function addPhoto(workshopId: string, id: string, content: Buffer, mimeType: string, description: string) {
    const formats: Record<string, boolean> = { "image/jpeg": content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff, "image/png": content.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])), "image/webp": content.subarray(0,4).toString() === "RIFF" && content.subarray(8,12).toString() === "WEBP" };
    if (!content.length || content.length > 2 * 1024 * 1024 || !formats[mimeType]) throw new UserInputError("La foto debe ser JPEG, PNG o WebP y ocupar hasta 2 MB.");
    return database.transaction(async tx => {
      const locked = await tx.select({ id: repairOrders.id }).from(repairOrders).where(and(eq(repairOrders.id, id), eq(repairOrders.workshopId, workshopId))).for("update");
      if (!locked.length) throw new UserInputError("Orden no encontrada.");
      const photos = await tx.select({ id: repairPhotos.id }).from(repairPhotos).where(eq(repairPhotos.orderId, id));
      if (photos.length >= 6) throw new UserInputError("Se permiten hasta 6 fotos por orden.");
      const [photo] = await tx.insert(repairPhotos).values({ orderId: id, content: content.toString("base64"), mimeType, description: description.slice(0,300) }).returning({ id: repairPhotos.id });
      return photo;
    });
  }
  async function getPhoto(workshopId: string, orderId: string, id: string) {
    if (!validOrderId(orderId) || !validOrderId(id)) return null;
    const [photo] = await database.select({ ...getTableColumns(repairPhotos) }).from(repairPhotos).innerJoin(repairOrders, eq(repairPhotos.orderId, repairOrders.id)).where(and(eq(repairPhotos.id, id), eq(repairPhotos.orderId, orderId), eq(repairOrders.workshopId, workshopId))).limit(1);
    return photo ?? null;
  }
  return { ensureWorkshop, getOrder, listOrders, getPublicOrder, createOrder, changeStatus, updateTechnical, rotateToken, addPhoto, getPhoto };
}
export type RepairStore = ReturnType<typeof repairStore>;
export type RepairOrder = NonNullable<Awaited<ReturnType<RepairStore["getOrder"]>>>;
