import type { RepairStatus } from "@/db/schema";

export const statusLabels: Record<RepairStatus, string> = {
  received: "Recibido",
  diagnosing: "En diagnóstico",
  awaiting_approval: "Esperando aprobación",
  awaiting_deposit: "Esperando seña",
  awaiting_part: "Esperando repuesto",
  repairing: "En reparación",
  testing: "En pruebas",
  ready_for_pickup: "Listo para retirar",
  delivered: "Entregado",
  not_repaired: "No reparado",
  under_warranty: "En garantía",
};

const transitions: Record<RepairStatus, RepairStatus[]> = {
  received: ["diagnosing", "awaiting_approval", "awaiting_part", "not_repaired"],
  diagnosing: ["awaiting_approval", "awaiting_part", "repairing", "not_repaired"],
  awaiting_approval: ["awaiting_deposit", "awaiting_part", "repairing", "not_repaired"],
  awaiting_deposit: ["awaiting_part", "repairing", "not_repaired"],
  awaiting_part: ["repairing", "not_repaired"],
  repairing: ["testing", "awaiting_part", "awaiting_approval", "not_repaired"],
  testing: ["repairing", "ready_for_pickup", "not_repaired"],
  ready_for_pickup: ["delivered", "under_warranty"],
  delivered: ["under_warranty"],
  not_repaired: ["delivered"],
  under_warranty: ["repairing", "testing", "ready_for_pickup", "delivered", "not_repaired"],
};

export function allowedTransitions(from: RepairStatus) {
  return transitions[from];
}

export function canTransition(from: RepairStatus, to: RepairStatus) {
  return transitions[from].includes(to);
}
