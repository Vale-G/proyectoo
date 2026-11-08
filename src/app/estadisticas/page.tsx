import { AppFrame } from "@/app/page";
import { listOrders } from "@/lib/orders";
import { formatMoney } from "@/lib/format";
import { statusLabels } from "@/lib/status";
export const dynamic="force-dynamic";
export default async function StatisticsPage(){
  const orders=await listOrders();const cents=(value:string|null)=>Number(value ?? 0);
  const quoted=orders.reduce((sum,o)=>sum+cents(o.estimateCents),0);const collected=orders.reduce((sum,o)=>sum+cents(o.initialDepositCents)+cents(o.paidCents),0);
  const statusCounts=Object.entries(Object.groupBy(orders,o=>o.status)).map(([status,items])=>[status,items?.length ?? 0] as const).sort((a,b)=>b[1]-a[1]);
  const models=Object.entries(Object.groupBy(orders,o=>`${o.deviceBrand ?? ''} ${o.deviceModel}`.trim())).map(([model,items])=>[model,items?.length ?? 0] as const).sort((a,b)=>b[1]-a[1]).slice(0,8);
  return <AppFrame><header className="page-header"><div><p className="eyebrow">Rendimiento del taller</p><h1>Estadísticas</h1><p>Datos calculados a partir de las órdenes registradas.</p></div><a className="button secondary" href="/orders/export.csv">Exportar CSV</a></header><section className="metrics stats-metrics"><div className="metric"><b>{orders.length}</b><span>Órdenes totales</span></div><div className="metric"><b>{formatMoney(String(quoted))}</b><span>Total presupuestado</span></div><div className="metric"><b>{formatMoney(String(collected))}</b><span>Señas y pagos registrados</span></div></section><section className="two-columns"><article className="panel padded"><h2>Órdenes por estado</h2><ul className="stats-list">{statusCounts.map(([status,count])=><li key={status}><span>{statusLabels[status as keyof typeof statusLabels]}</span><b>{count}</b></li>)}</ul></article><article className="panel padded"><h2>Equipos más frecuentes</h2><ul className="stats-list">{models.map(([model,count])=><li key={model}><span>{model}</span><b>{count}</b></li>)}</ul></article></section></AppFrame>;
}
