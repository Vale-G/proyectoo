import { Brand } from "@/components/brand";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { configuredWorkshopAuth, isAuthorizedWorkshopUser } from "@/lib/workshop-auth";

export const metadata = { title: "Ingresar · OmniFix", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const ready = configuredWorkshopAuth();
  if (ready) {
    const { data: { user } } = await (await createSupabaseServerClient()).auth.getUser();
    if (isAuthorizedWorkshopUser(user)) redirect("/");
  }
  const { error } = await searchParams;
  const message = error === "unauthorized" ? "Esta cuenta de Google no está autorizada para administrar el taller." : error === "provider" ? "Google no pudo iniciar la sesión. Revisá la configuración del proveedor." : error === "callback" ? "No pudimos completar el acceso con Google. Volvé a intentarlo." : error === "configuration" ? "Falta completar la configuración de acceso del taller." : undefined;
  return <main className="login-page"><section className="login-card">
    <Link className="login-brand" href="/catalogo"><Brand /></Link>
    <p className="eyebrow">Gestión del taller</p><h1>Bienvenido a tu taller.</h1>
    <p className="muted">Ingresá con la cuenta de Google autorizada para OmniFix.</p>
    {!ready ? <div className="login-notice" role="status"><h2>Falta activar el acceso con Google</h2><p>El taller todavía no tiene conectados Supabase Auth y el correo administrador.</p><p>Configurá <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> y <code>WORKSHOP_ADMIN_EMAIL</code> en el entorno correspondiente.</p></div> : <form action="/auth/google" method="post" className="login-form">
      {message && <p className="login-error" role="alert">{message}</p>}
      <button className="button primary full" type="submit">Continuar con Google</button>
      <p className="privacy-note">Solo el correo autorizado puede acceder. Podés cerrar la sesión desde el panel.</p>
    </form>}
    <Link className="login-back" href="/catalogo">← Volver al catálogo</Link>
  </section></main>;
}
