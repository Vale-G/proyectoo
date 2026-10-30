import Link from "next/link";
import { redirect } from "next/navigation";
import { requireWorkshopAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default async function ConfigurationPage() {
  await requireWorkshopAccess();
  if (process.env.DATABASE_URL) redirect("/");
  return <main className="login-page"><section className="login-card"><p className="eyebrow">OmniFix · Configuración</p><h1>Tu acceso ya funciona.</h1><p>Falta conectar la base de datos para poder guardar clientes y órdenes.</p><div className="login-notice"><p>En Vercel, agregá <code>DATABASE_URL</code> con la cadena <strong>Transaction pooler</strong> de Supabase → Connect, completada con tu contraseña de la base. Después volvé a desplegar.</p><p>Las variables públicas de Supabase por sí solas no conectan este panel a PostgreSQL.</p></div><a className="button primary full" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Abrir configuración de Vercel</a><Link className="login-back" href="/catalogo">Ver catálogo</Link><form action="/auth/logout" method="post"><button className="button secondary full">Cerrar sesión</button></form></section></main>;
}
