import { listOrders } from "@/lib/orders";
export const dynamic="force-dynamic";
const cell=(value:unknown)=>`"${String(value ?? "").replaceAll('"','""')}"`;
export async function GET(){
  const orders=await listOrders();
  const rows=[["Orden","Ingreso","Cliente","Teléfono","Equipo","Estado","Presupuesto","Seña inicial","Pagos posteriores"],...orders.map(order=>[order.orderNumber,order.createdAt.toISOString(),order.customerName,order.customerPhone,`${order.deviceBrand ?? ''} ${order.deviceModel}`.trim(),order.status,order.estimateCents,order.initialDepositCents,order.paidCents])];
  const csv="\uFEFF"+rows.map(row=>row.map(cell).join(",")).join("\r\n");
  return new Response(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="OmniFix-ordenes.csv"`,"Cache-Control":"private, no-store"}});
}
