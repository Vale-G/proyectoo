import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { formatDate } from "@/lib/format";
import { statusLabels } from "@/lib/status";
import { AppFrame } from "@/components/workshop/frame";
import { MetricCard } from "@/components/workshop/metric-card";
import { StatusBadge } from "@/components/status-badge";
export { AppFrame } from "@/components/workshop/frame";
export const dynamic="force-dynamic";

export default async function Dashboard(){
  const orders=await listOrders();
  const count=(status:string)=>orders.filter(o=>o.status===status).length;
  const attention=orders.filter(o=>["awaiting_approval","awaiting_part","ready_for_pickup"].includes(o.status));
  return <AppFrame>
    <header className="workshop-page-header"><div><p className="workshop-eyebrow">Resumen del taller</p><h1>Inicio</h1><p className="muted">El taller, bajo control.</p></div><Link href="/orders/new" className="button primary">＋ Nueva orden</Link></header>
    <section className="workshop-metrics" aria-label="Estado de las órdenes">
      <MetricCard href="/orders?status=received" count={count("received")} label="Equipos recibidos" tone="info" icon="▯"/>
      <MetricCard href="/orders?status=diagnosing" count={count("diagnosing")} label="En diagnóstico" tone="warning" icon="⌕"/>
      <MetricCard href="/orders?status=awaiting_approval" count={count("awaiting_approval")} label="Presupuestos por aprobar" tone="quote" icon="◇"/>
      <MetricCard href="/orders?status=ready_for_pickup" count={count("ready_for_pickup")} label="Listos para entregar" tone="success" icon="✓"/>
    </section>
    <section className="workshop-panel recent-orders"><div className="workshop-panel-heading"><div><h2>Órdenes recientes</h2><p className="muted">Últimos equipos ingresados</p></div><Link href="/orders">Ver todas →</Link></div>
      {orders.length ? <><ul className="recent-mobile-list">{orders.slice(0,8).map(o=><li key={o.id}><Link href={"/orders/"+o.id}><span className="mobile-order-top"><strong>#{o.orderNumber}</strong><StatusBadge status={o.status}/></span><span className="mobile-order-device">{o.deviceBrand} {o.deviceModel}</span><span className="muted">{o.customerName} · {formatDate(o.createdAt)}</span></Link></li>)}</ul><div className="workshop-table-scroll" role="region" aria-label="Órdenes recientes" tabIndex={0}><table className="workshop-table"><thead><tr><th scope="col">Nº</th><th scope="col">Cliente</th><th scope="col">Equipo</th><th scope="col">Estado</th><th scope="col">Ingreso</th></tr></thead><tbody>{orders.slice(0,8).map(o=><tr key={o.id}><td><Link href={"/orders/"+o.id}>#{o.orderNumber}</Link></td><td>{o.customerName}</td><td>{o.deviceBrand} {o.deviceModel}</td><td><StatusBadge status={o.status}/></td><td>{formatDate(o.createdAt)}</td></tr>)}</tbody></table></div></>
      : <div className="workshop-empty"><span aria-hidden="true">▤</span><h3>Tu taller empieza con una orden</h3><p>Registrá el primer equipo para ver su avance acá.</p><Link className="button primary" href="/orders/new">Recibir equipo</Link></div>}
    </section>
    <div className="workshop-lower-grid"><section className="workshop-panel"><div className="workshop-panel-heading"><h2>Para continuar hoy</h2><span className="muted">{attention.length} órdenes</span></div>
      {attention.length ? <ul className="workshop-attention">{attention.slice(0,4).map(o=><li key={o.id}><Link href={"/orders/"+o.id}><span><strong>{o.deviceBrand} {o.deviceModel}</strong><small>#{o.orderNumber} · {o.customerName}</small></span><StatusBadge status={o.status}/></Link></li>)}</ul>:<p className="workshop-panel-body muted">Sin presupuestos, repuestos o entregas pendientes.</p>}
    </section><section className="workshop-panel"><div className="workshop-panel-heading"><h2>Trabajo en curso</h2></div><div className="workshop-queue">
      {(["repairing","awaiting_part"] as const).map(status=><Link key={status} href={"/orders?status="+status}><span>{statusLabels[status]}</span><strong>{count(status)}</strong><span aria-hidden="true">→</span></Link>)}
    </div><Link className="workshop-inline-link" href="/estadisticas">Consultar estadísticas →</Link></section></div>
  </AppFrame>;
}
