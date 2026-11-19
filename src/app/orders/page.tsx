import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { formatDate, formatMoney } from "@/lib/format";
import { repairStatus, type RepairStatus } from "@/db/schema";
import { statusLabels } from "@/lib/status";
import { AppFrame } from "@/app/page";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

const filters: Array<[RepairStatus | "", string]> = [["", "Todas"], ...repairStatus.enumValues.map(status => [status, statusLabels[status]] as [RepairStatus, string])];

function requestTime(){return Date.now()}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: RepairStatus }> }) {
  const now=requestTime();
  const { q, status } = await searchParams;
  const orders = await listOrders(q, status);
  return <AppFrame><header className="page-header"><div><p className="eyebrow">Gestión del taller</p><h1>Órdenes de reparación</h1><p>Buscá equipos, revisá garantías y registrá cada avance.</p></div><Link className="button primary" href="/orders/new">+ Nueva orden</Link></header>
    <form className="searchbar"><input type="hidden" name="status" value={status ?? ""} /><input aria-label="Buscar órdenes" name="q" defaultValue={q} placeholder="Buscar cliente, teléfono, orden o equipo…" /><button className="button secondary">Buscar</button></form>
    <nav className="filters">{filters.map(([value, label]) => <Link key={label} className={!value && !status || status === value ? "active" : ""} href={`/orders?${new URLSearchParams({ ...(q ? { q } : {}), ...(value ? { status: value } : {}) })}`}>{label}</Link>)}</nav>
    <p className="orders-result-count" role="status">{orders.length} órdenes encontradas</p>
    <ul className="orders-mobile-list">{orders.map(order=><li key={order.id}><Link href={`/orders/${order.id}`}><div className="mobile-order-top"><strong>#{order.orderNumber}</strong><StatusBadge status={order.status}/></div><h2>{order.deviceBrand} {order.deviceModel}</h2><p>{order.customerName}</p><p className="muted">{order.reportedIssue}</p><div className="mobile-order-bottom"><span>Entrega · {formatDate(order.estimatedCompletion)}</span><Priority now={now} status={order.status} due={order.estimatedCompletion}/></div></Link></li>)}</ul>
    {!orders.length && <p className="workshop-empty">No hay órdenes para esta búsqueda. Probá otro cliente, equipo o estado.</p>}
    <section className="table-panel orders-desktop"><table><thead><tr><th>Orden</th><th>Cliente</th><th>Equipo</th><th>Estado</th><th>Atención</th><th>Entrega</th><th>Presupuesto</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><Link href={`/orders/${order.id}`}><strong>#{order.orderNumber}</strong></Link></td><td><strong>{order.customerName}</strong><small>{order.customerPhone}</small></td><td><strong>{order.deviceBrand} {order.deviceModel}</strong><small>{order.reportedIssue}</small></td><td><StatusBadge status={order.status} /></td><td><Priority now={now} status={order.status} due={order.estimatedCompletion}/></td><td>{formatDate(order.estimatedCompletion)}</td><td>{formatMoney(order.estimateCents)}</td></tr>)}{!orders.length && <tr><td colSpan={7} className="empty">No hay órdenes para esta búsqueda.</td></tr>}</tbody></table></section>
  </AppFrame>;
}


function Priority({status,due,now}:{status:string;due:Date|null;now:number}){
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Argentina/Buenos_Aires"}).format(new Date(now));
  if(due && due.toISOString().slice(0,10)<today && !["delivered","not_repaired"].includes(status)) return <span className="priority overdue">Plazo estimado vencido</span>;
  if(status==="ready_for_pickup") return <span className="priority ready">Coordinar entrega</span>;
  if(status==="awaiting_approval") return <span className="priority">Requiere aprobación</span>;
  if(status==="awaiting_part") return <span className="priority">Esperando repuesto</span>;
  return <span className="muted">En seguimiento</span>;
}
