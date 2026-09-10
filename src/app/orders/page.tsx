import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { formatDate, formatMoney } from "@/lib/format";
import type { RepairStatus } from "@/db/schema";
import { AppFrame } from "@/app/page";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

const filters: Array<[RepairStatus | "", string]> = [["", "Todas"], ["diagnosing", "Diagnóstico"], ["awaiting_approval", "Aprobación"], ["awaiting_part", "Repuesto"], ["repairing", "Reparación"], ["testing", "Pruebas"], ["ready_for_pickup", "Listas"]];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: RepairStatus }> }) {
  const { q, status } = await searchParams;
  const orders = await listOrders(q, status);
  return <AppFrame><header className="page-header"><div><p className="eyebrow">Gestión del taller</p><h1>Órdenes de reparación</h1><p>Buscá, filtrá y actualizá equipos con una fuente de verdad en PostgreSQL.</p></div><Link className="button primary" href="/orders/new">+ Nueva orden</Link></header>
    <form className="searchbar"><input name="q" defaultValue={q} placeholder="Buscar cliente, teléfono, orden o equipo…" /><button className="button secondary">Buscar</button></form>
    <nav className="filters">{filters.map(([value, label]) => <Link key={label} className={!value && !status || status === value ? "active" : ""} href={`/orders${value ? `?status=${value}` : ""}`}>{label}</Link>)}</nav>
    <section className="table-panel"><table><thead><tr><th>Orden</th><th>Cliente</th><th>Equipo</th><th>Estado</th><th>Entrega</th><th>Presupuesto</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><Link href={`/orders/${order.id}`}><strong>#{order.orderNumber}</strong></Link></td><td><strong>{order.customerName}</strong><small>{order.customerPhone}</small></td><td><strong>{order.deviceBrand} {order.deviceModel}</strong><small>{order.reportedIssue}</small></td><td><StatusBadge status={order.status} /></td><td>{formatDate(order.estimatedCompletion)}</td><td>{formatMoney(order.estimateCents)}</td></tr>)}{!orders.length && <tr><td colSpan={6} className="empty">No hay órdenes para esta búsqueda.</td></tr>}</tbody></table></section>
  </AppFrame>;
}
