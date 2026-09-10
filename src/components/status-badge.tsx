import type { RepairStatus } from "@/db/schema";
import { statusLabels } from "@/lib/status";

export function StatusBadge({ status }: { status: RepairStatus }) {
  return <span className={`status ${status}`}>{statusLabels[status]}</span>;
}
