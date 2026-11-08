export function formatMoney(cents: string | null) {
  if (!cents) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: Number(cents) % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(Number(cents) / 100);
}

export function formatDate(date: Date | null, time = false) {
  if (!date) return "Pendiente";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", ...(time ? { timeStyle: "short" as const } : {}), timeZone: "America/Argentina/Buenos_Aires" }).format(date);
}
