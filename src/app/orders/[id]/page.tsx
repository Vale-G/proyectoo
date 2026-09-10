import Link from "next/link";
import { notFound } from "next/navigation";
import { changeRepairStatus } from "@/app/actions";
import { AppFrame } from "@/app/page";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import { getOrder } from "@/lib/orders";
import { allowedTransitions, statusLabels } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const publicUrl = `/seguimiento/${order.publicToken}`;
  return <AppFrame><Link className="back-link" href="/orders">← Volver a órdenes</Link><section className="order-header"><div><p className="eyebrow">Orden #{order.orderNumber}</p><h1>{order.deviceBrand} {order.deviceModel}</h1><p>{order.customerName} · {order.customerPhone}</p></div><div className="order-actions"><StatusBadge status={order.status} /><Link className="button secondary" href={publicUrl} target="_blank">Abrir seguimiento público ↗</Link></div><div className="order-meta"><span>Ingreso <b>{formatDate(order.createdAt)}</b></span><span>Entrega estimada <b>{formatDate(order.estimatedCompletion)}</b></span><span>Presupuesto <b>{formatMoney(order.estimateCents)}</b></span><span>Seña <b>{formatMoney(order.depositCents)}</b></span></div></section>
    <section className="detail-layout"><article className="panel padded"><h2>Resumen técnico</h2><Info label="Falla declarada" value={order.reportedIssue} /><Info label="Estado físico y recepción" value={order.intakeCondition} /><Info label="Diagnóstico" value={order.diagnosis} /><Info label="Solución propuesta" value={order.proposedSolution} /><Info label="Accesorios recibidos" value={order.accessories} /><Info label="IMEI / serie" value={order.deviceSerial} /></article><aside className="stack"><article className="panel padded"><h2>Actualizar avance</h2><p className="muted">Solo se muestran los siguientes estados permitidos para evitar saltos inválidos.</p><form action={changeRepairStatus} className="status-form"><input type="hidden" name="orderId" value={order.id} /><label><span>Estado nuevo</span><select name="status">{allowedTransitions(order.status).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label><label><span>Nota de seguimiento</span><textarea name="note" placeholder="Ej.: Repuesto recibido y listo para instalar." /></label><button className="button primary">Guardar avance</button></form></article><article className="panel padded"><h2>Historial</h2><ol className="timeline">{order.events.map((event) => <li key={event.id}><span>{formatDate(event.createdAt)}</span><strong>{event.fromStatus ? `${statusLabels[event.fromStatus]} → ` : ""}{statusLabels[event.toStatus]}</strong>{event.note && <p>{event.note}</p>}</li>)}</ol></article></aside></section>
  </AppFrame>;
}

function Info({ label, value }: { label: string; value: string | null }) { return <div className="info"><span>{label}</span><p>{value || "Sin registrar"}</p></div>; }
