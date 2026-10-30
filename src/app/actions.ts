"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { repairStatus } from "@/db/schema";
import { createOrder, privateStore } from "@/lib/orders";
import { parseIntake, moneyToCents, validationMessage, UserInputError } from "@/lib/intake";
import { requireWorkshopAccess } from "@/lib/auth";
import type { ActionResult } from "@/lib/action-result";

function refresh(id: string, token?: string) {
  revalidatePath("/"); revalidatePath("/orders"); revalidatePath(`/orders/${id}`);
  if (token) revalidatePath(`/seguimiento/${token}`);
}
const identitySchema = z.object({ orderId: z.uuid(), revision: z.coerce.number().int().nonnegative() });
const short = (max: number) => z.string().trim().max(max);
export async function createRepairOrder(form: FormData): Promise<ActionResult> {
  await requireWorkshopAccess();
  let id: string;
  try { const order = await createOrder(parseIntake(form)); id = order.id; }
  catch (error) { return { error: validationMessage(error) }; }
  refresh(id); redirect(`/orders/${id}`);
}
export async function changeRepairStatus(form: FormData): Promise<ActionResult> {
  const { store, workshop } = await privateStore();
  try {
    const input = identitySchema.extend({ status: z.enum(repairStatus.enumValues), note: short(2000), recipient: short(160), deliveryAccessories: short(1000) }).parse(Object.fromEntries(form));
    const order = await store.changeStatus(workshop.id, input.orderId, input.revision, input.status, input.note, { recipient: input.recipient, accessories: input.deliveryAccessories });
    refresh(order.id, order.publicToken);
    return { success: "Estado guardado. El historial y el seguimiento ya están actualizados." };
  } catch (error) { return { error: validationMessage(error) }; }
}
export async function saveTechnicalDetails(form: FormData): Promise<ActionResult> {
  const { store, workshop } = await privateStore();
  try {
    const input = identitySchema.extend({ diagnosis: short(4000), proposedSolution: short(2000), publicSummary: short(1000), partsDescription: short(2000), laborDescription: short(2000), estimatedCompletion: z.union([z.literal(""), z.iso.date()]), approvalReference: short(1000), warrantyUntil: z.union([z.literal(""), z.iso.date()]) }).parse(Object.fromEntries(form));
    const order = await store.updateTechnical(workshop.id, input.orderId, input.revision, { diagnosis: input.diagnosis, proposedSolution: input.proposedSolution, publicSummary: input.publicSummary, partsDescription: input.partsDescription, laborDescription: input.laborDescription, estimatedCompletion: input.estimatedCompletion ? new Date(`${input.estimatedCompletion}T12:00:00Z`) : null, approvalReference: input.approvalReference,
      partsCents: moneyToCents(String(form.get("parts") ?? "")), laborCents: moneyToCents(String(form.get("labor") ?? "")), estimateCents: moneyToCents(String(form.get("estimate") ?? "")), paidCents: moneyToCents(String(form.get("paid") ?? "")), warrantyUntil: input.warrantyUntil ? new Date(`${input.warrantyUntil}T12:00:00Z`) : null });
    refresh(order.id, order.publicToken); return { success: "Datos técnicos y presupuesto guardados." };
  } catch (error) { return { error: validationMessage(error) }; }
}
export async function rotateTrackingToken(form: FormData): Promise<ActionResult> {
  const { store, workshop } = await privateStore();
  try {
    const input = identitySchema.parse(Object.fromEntries(form));
    if (form.get("confirmRotation") !== "on") throw new UserInputError("Confirmá que se invalidarán el enlace y los QR anteriores.");
    const previous = await store.getOrder(workshop.id, input.orderId);
    const order = await store.rotateToken(workshop.id, input.orderId, input.revision);
    refresh(order.id, previous?.publicToken); revalidatePath(`/seguimiento/${order.publicToken}`);
    return { success: "Enlace reemplazado. Copiá el nuevo enlace y emití nuevamente los comprobantes." };
  } catch (error) { return { error: validationMessage(error) }; }
}
export async function uploadRepairPhoto(form: FormData): Promise<ActionResult> {
  const { store, workshop } = await privateStore();
  try {
    const id = z.uuid().parse(form.get("orderId"));
    const description = short(300).min(1, "Describí qué se registra en la foto.").parse(form.get("description"));
    const file = form.get("photo");
    if (!(file instanceof File)) throw new UserInputError("Elegí una foto.");
    if (file.size > 2 * 1024 * 1024) throw new UserInputError("La foto supera los 2 MB.");
    await store.addPhoto(workshop.id, id, Buffer.from(await file.arrayBuffer()), file.type, description);
    refresh(id); return { success: "Foto guardada de forma privada con fecha y hora." };
  } catch (error) { return { error: validationMessage(error) }; }
}
