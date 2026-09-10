export function formatMoney(cents: string | null) {
  if (!cents) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(cents) / 100);
}

export function formatDate(date: Date | null) {
  if (!date) return "Pendiente";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(date);
}
