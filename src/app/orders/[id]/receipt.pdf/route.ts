import { getOrder } from "@/lib/orders";
import { buildReceipt } from "@/lib/receipt";
import { publicOrigin } from "@/lib/public-origin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  if (!order) return new Response("Orden no encontrada.", { status: 404 });
  const kind = new URL(request.url).searchParams.get("kind") === "delivery" ? "delivery" : "intake";
  if (kind === "delivery" && !order.deliveredAt) return new Response("La orden no fue entregada.", { status: 409 });
  const { bytes } = await buildReceipt(order, await publicOrigin(), kind);
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="OmniFix-${order.orderNumber}-${kind}.pdf"`, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" } });
}
