import { getOrder } from "@/lib/orders";
import { buildCycleReceipt, buildIntakeLayout, buildReceipt, type IntakeLayout } from "@/lib/receipt";
import { publicOrigin } from "@/lib/public-origin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  if (!order) return new Response("Orden no encontrada.", { status: 404 });
  const requestedKind = new URL(request.url).searchParams.get("kind") ?? "intake";
  if (!["intake", "delivery", "quote", "cycle"].includes(requestedKind)) return new Response("Tipo de comprobante inválido.", { status: 400 });
  const kind = requestedKind as "intake" | "delivery" | "quote" | "cycle";
  if (kind === "delivery" && !order.deliveredAt) return new Response("La orden no fue entregada.", { status: 409 });
  const requestedLayout = new URL(request.url).searchParams.get("layout") ?? "a4";
  if (!["a4","a5","double","label"].includes(requestedLayout)) return new Response("Formato de impresión inválido.",{status:400});
  const layout=requestedLayout as IntakeLayout;
  const base=await publicOrigin();
  const result=layout==="label" ? await buildIntakeLayout(order,base,layout)
    : kind==="cycle" ? await buildCycleReceipt(order,base,layout)
    : kind==="intake" ? await buildIntakeLayout(order,base,layout) : await buildReceipt(order,base,kind);
  const {bytes}=result;
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Orden-${order.orderNumber}-${kind}${kind === 'intake' ? `-${layout}` : ''}.pdf"`, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" } });
}
