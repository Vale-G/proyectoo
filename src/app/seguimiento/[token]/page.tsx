import { notFound } from "next/navigation";
import { getPublicOrder } from "@/lib/orders";
import { formatDate } from "@/lib/format";
import { statusLabels } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function PublicTrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getPublicOrder(token);
  if (!order) notFound();
  return <main className="tracking-page"><section className="tracking-card"><div className="tracking-brand"><span className="mark"><i /><i /><i /><b>✓</b></span><div><strong>{order.publicName}</strong><small>Servicio técnico de electrónica</small></div></div><p className="eyebrow">Seguimiento de reparación</p><h1>Orden #{order.orderNumber}</h1><p className="device-name">{order.deviceBrand} {order.deviceModel}</p><StatusBadge status={order.status} /><p className="tracking-message">{messageFor(order.status)}</p><dl><div><dt>Fecha de ingreso</dt><dd>{formatDate(order.createdAt)}</dd></div><div><dt>Entrega estimada</dt><dd>{formatDate(order.estimatedCompletion)}</dd></div></dl>{order.whatsapp && <a className="button primary full" href={`https://wa.me/${order.whatsapp.replace(/\D/g, "")}`}>Consultar por WhatsApp</a>}<p className="privacy-note">Por seguridad, esta página no muestra datos personales, números de serie, fotos ni información técnica interna.</p></section></main>;
}

function messageFor(status: keyof typeof statusLabels) {
  const messages: Record<keyof typeof statusLabels, string> = { received: "Recibimos tu equipo. Pronto iniciaremos la revisión.", diagnosing: "Tu equipo está en diagnóstico. Te informaremos el presupuesto cuando esté listo.", awaiting_approval: "El diagnóstico está listo y esperamos tu aprobación para continuar.", awaiting_deposit: "Esperamos la seña acordada para continuar con el trabajo.", awaiting_part: "El repuesto fue solicitado o reservado. Te avisaremos ante cualquier novedad.", repairing: "El técnico está trabajando en tu equipo.", testing: "Estamos realizando las pruebas finales.", ready_for_pickup: "Tu equipo está listo para retirar.", delivered: "Esta orden ya fue entregada. Gracias por elegirnos.", not_repaired: "La orden fue cerrada sin reparación. Consultanos si necesitás más información.", under_warranty: "Tu equipo está siendo revisado dentro de la garantía." };
  return messages[status];
}
