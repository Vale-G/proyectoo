"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { repairOrderEvents, repairOrders, repairStatus, type RepairStatus } from "@/db/schema";
import { canTransition } from "@/lib/status";
import { createOrder, ensureWorkshop, getOrder } from "@/lib/orders";

function required(formData: FormData, key: string) {
  const value = formData.get(key)?.toString().trim();
  if (!value) throw new Error(`Falta el campo requerido: ${key}.`);
  return value;
}

function moneyToCents(value: string | undefined) {
  const normalized = value?.replace(/[^0-9]/g, "");
  return normalized ? String(Number(normalized) * 100) : undefined;
}

export async function createRepairOrder(formData: FormData) {
  const status = formData.get("status")?.toString() as RepairStatus;
  if (!repairStatus.enumValues.includes(status)) throw new Error("Estado de orden inválido.");
  const order = await createOrder({
    customerName: required(formData, "customerName"), phone: required(formData, "phone"),
    email: formData.get("email")?.toString(), category: required(formData, "category"),
    brand: formData.get("brand")?.toString(), model: required(formData, "model"),
    color: formData.get("color")?.toString(), serialNumber: formData.get("serialNumber")?.toString(),
    reportedIssue: required(formData, "reportedIssue"), intakeCondition: formData.get("intakeCondition")?.toString(),
    accessories: formData.get("accessories")?.toString(), proposedSolution: formData.get("proposedSolution")?.toString(),
    estimateCents: moneyToCents(formData.get("estimate")?.toString()),
    depositCents: moneyToCents(formData.get("deposit")?.toString()), status,
  });
  revalidatePath("/");
  redirect(`/orders/${order.id}`);
}

export async function changeRepairStatus(formData: FormData) {
  const id = required(formData, "orderId");
  const nextStatus = formData.get("status")?.toString() as RepairStatus;
  if (!repairStatus.enumValues.includes(nextStatus)) throw new Error("Estado de orden inválido.");
  const order = await getOrder(id);
  if (!order) throw new Error("Orden no encontrada.");
  if (!canTransition(order.status, nextStatus)) {
    throw new Error(`No se permite pasar de ${order.status} a ${nextStatus}.`);
  }
  const workshop = await ensureWorkshop();
  const database = db();
  const note = formData.get("note")?.toString().trim() || null;
  await database.update(repairOrders).set({ status: nextStatus, updatedAt: new Date() })
    .where(and(eq(repairOrders.id, id), eq(repairOrders.workshopId, workshop.id)));
  await database.insert(repairOrderEvents).values({ orderId: id, fromStatus: order.status, toStatus: nextStatus, note });
  revalidatePath("/");
  revalidatePath(`/orders/${id}`);
}
