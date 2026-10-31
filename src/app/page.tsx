import { Brand } from "@/components/brand";
import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { formatDate, formatMoney } from "@/lib/format";
import { statusLabels } from "@/lib/status";

export const dynamic = "force-dynamic";

const countable = ["diagnosing", "awaiting_approval", "awaiting_part", "repairing", "ready_for_pickup"] as const;

export default async function Dashboard() {
  const orders = await listOrders();
  const counts = Object.fromEntries(countable.map((status) => [status, orders.filter((order) => order.status === status).length]));
  return <AppFrame>
    <header className="page-header"><div><p className="eyebrow">Panel de OmniFix</p><h1>El taller, bajo control.</h1><p>Revisá prioridades, avances y equipos próximos a entregar.</p></div><Link className="button primary" href="/orders/new">+ Nueva orden</Link></header>
    <section className="metrics">
      <Metric href="/orders?status=diagnosing" count={counts.diagnosing} label="En diagnóstico" tone="amber" />
      <Metric href="/orders?status=awaiting_approval" count={counts.awaiting_approval} label="Esperando aprobación" tone="violet" />
      <Metric href="/orders?status=awaiting_part" count={counts.awaiting_part} label="Esperando repuesto" tone="orange" />
      <Metric href="/orders?status=repairing" count={counts.repairing} label="En reparación" tone="blue" />
      <Metric href="/orders?status=ready_for_pickup" count={counts.ready_for_pickup} label="Listos para retirar" tone="green" />
    </section>
    <section className="two-columns"><article className="panel"><div className="panel-head"><h2>Necesita atención</h2><Link href="/orders">Ver órdenes</Link></div><div className="attention-list">
      {orders.filter((order) => ["awaiting_approval", "awaiting_part", "repairing", "ready_for_pickup"].includes(order.status)).slice(0, 5).map((order) => <Link className="attention-row" key={order.id} href={`/orders/${order.id}`}><span className={`dot ${order.status}`} /><div><strong>#{order.orderNumber} · {order.deviceBrand} {order.deviceModel}</strong><small>{order.customerName} · {statusLabels[order.status]} · Entrega: {formatDate(order.estimatedCompletion)}</small></div><b>{formatMoney(order.estimateCents)}</b></Link>)}
      {!orders.length && <p className="empty">Todavía no hay equipos ingresados. Creá la primera orden para comenzar.</p>}
    </div></article><aside className="stack"><article className="panel padded"><h2>Una recepción completa</h2><p>Registrá el equipo, sus accesorios y el estado de ingreso. Después entregá el comprobante con seguimiento al cliente.</p><Link className="button primary full" href="/orders/new">Crear orden de reparación</Link></article><article className="panel padded"><h2>Privacidad del QR</h2><p>El enlace público usa un token aleatorio separado del número correlativo de orden. No revela IMEI, notas internas ni costos.</p></article></aside></section>
  </AppFrame>;
}

function Metric({ href, count, label, tone }: { href: string; count: number; label: string; tone: string }) { return <Link className={`metric ${tone}`} href={href}><b>{count}</b><span><i />{label}</span></Link>; }

export function AppFrame({ children }: { children: React.ReactNode }) { return <div className="app-shell"><aside className="sidebar"><Link className="brand" href="/"><Brand /></Link><nav><Link href="/">▦ <span>Inicio</span></Link><Link href="/orders">▤ <span>Órdenes</span></Link><Link className="nav-new" href="/orders/new">＋ <span>Nueva orden</span></Link><span className="nav-disabled">◉ <span>Clientes</span></span><span className="nav-disabled">▧ <span>Garantías</span></span></nav><div className="sidebar-footer"><span className="avatar">OF</span><div><strong>OmniFix</strong><small>Propietario</small></div></div><form action="/auth/logout" method="post" className="sidebar-logout"><button type="submit">Cerrar sesión</button></form></aside><div className="mobile-nav"><Link href="/">OmniFix</Link><Link href="/orders">Órdenes</Link><Link href="/orders/new">+ Ingreso</Link><form action="/auth/logout" method="post"><button>Salir</button></form></div><main className="content">{children}</main></div>; }
