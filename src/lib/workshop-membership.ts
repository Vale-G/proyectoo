import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { workshopMembers, workshops } from "@/db/schema";

export const workshopRoles = ["owner", "admin", "technician", "reception"] as const;
export type WorkshopRole = typeof workshopRoles[number];
export class WorkshopAccessError extends Error {}
export function canManageWorkshop(role: WorkshopRole) {
  return role === "owner" || role === "admin";
}

/** Resolve a verified session identity. Never infer ownership from order or workshop IDs. */
export async function resolveWorkshop(database: Database, userId: string, selectedId?: string) {
  const memberships = await database.select({ workshop: workshops, role: workshopMembers.role })
    .from(workshopMembers).innerJoin(workshops, eq(workshopMembers.workshopId, workshops.id))
    .where(and(eq(workshopMembers.userId, userId), eq(workshopMembers.active, true)));
  const selected = selectedId ? memberships.find(row => row.workshop.id === selectedId)
    : memberships.length === 1 ? memberships[0] : undefined;
  if (!selected) throw new WorkshopAccessError("Seleccioná un taller autorizado.");
  // Detailed order views include financial/private fields. Restricted roles remain closed
  // until assignment-aware projections and operation-specific screens are verified.
  if (!canManageWorkshop(selected.role)) throw new WorkshopAccessError("Este rol todavía no tiene acceso operativo habilitado.");
  return selected;
}
