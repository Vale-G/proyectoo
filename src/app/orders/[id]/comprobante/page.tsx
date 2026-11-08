import { notFound } from "next/navigation";
import QRCode from "qrcode";
import Image from "next/image";
import { getOrder } from "@/lib/orders";
import { receiptSections } from "@/lib/receipt";
import { publicOrigin } from "@/lib/public-origin";
import { trackingUrl } from "@/lib/tracking-url";
import { PrintButton } from "@/components/print-button";
export const dynamic = "force-dynamic";
export const metadata = { title: "Comprobante · OmniFix", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function PrintReceipt({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{kind?:string}>}) {
  const order = await getOrder((await params).id); if (!order) notFound();
  const kind = (await searchParams).kind === 'delivery' && order.deliveredAt ? 'delivery' : 'intake';
  const url = trackingUrl(order.publicToken,await publicOrigin());
  const qr = await QRCode.toDataURL(url,{errorCorrectionLevel:'M',margin:4,width:240});
  return <main className="print-receipt"><div className="no-print receipt-controls"><PrintButton /><a className="button secondary" href={`/orders/${order.id}/receipt.pdf?kind=${kind}`}>Descargar PDF</a></div><header><Image src="/brand/omnifix-original.jpg" alt="OmniFix" width={90} height={90} /><div><h1>OmniFix</h1><p>Comprobante de {kind === 'delivery' ? 'entrega' : 'ingreso'} · Orden #{order.orderNumber}</p></div></header><dl>{receiptSections(order,kind).map(([title,value])=><div key={title}><dt>{title}</dt><dd>{value}</dd></div>)}</dl><div className="receipt-qr"><Image unoptimized src={qr} alt="QR para consultar el estado de la orden" width={150} height={150} /><p>Seguimiento privado:<br /><a href={url}>{url}</a></p></div>{order.consent ? <section><h2>Condiciones y aceptación · {order.consent.version}</h2><p>Aceptó: {order.consent.acceptedName} · {order.consent.acceptedAt} · {order.consent.method}</p><p>Borrado/restauración: {order.consent.eraseAuthorized ? 'autorizado expresamente' : 'NO AUTORIZADO'}.</p><p className="terms-text">{order.consent.text}</p></section> : <p>Sin consentimiento registrado. No se presume aceptación retroactiva.</p>}<footer className="receipt-signatures"><p>Firma / aclaración del cliente</p><p>Firma / aclaración de OmniFix</p></footer></main>;
}
