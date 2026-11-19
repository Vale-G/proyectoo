"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/","⌂","Inicio"],["/orders","▤","Órdenes"],["/clientes","♙","Clientes"],
  ["/estadisticas","▥","Estadísticas"],["/talleres","⇄","Cambiar taller"],
];
export function WorkshopNavigation() {
  const pathname=usePathname();
  return <nav aria-label="Navegación del taller" className="workshop-navigation">
    {items.map(([href,icon,name])=>{
      const active=href==="/" ? pathname==="/" : pathname===href || pathname.startsWith(href+"/");
      return <Link key={href} href={href} aria-current={active?"page":undefined}><span aria-hidden="true" className="nav-icon">{icon}</span><span>{name}</span></Link>;
    })}
    <a href="/orders/export.csv"><span aria-hidden="true" className="nav-icon">⇩</span>Exportar CSV</a>
    <Link href="/orders?status=under_warranty"><span aria-hidden="true" className="nav-icon">◇</span>Garantías</Link>
  </nav>;
}
