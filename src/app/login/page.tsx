import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminConfig, configuredAdmin, SESSION_COOKIE, validSession } from "@/lib/auth-credentials";

export const metadata = { title: "Ingresar · OmniFix", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const config = adminConfig();
  if (validSession((await cookies()).get(SESSION_COOKIE)?.value, config)) redirect("/");
  const { error } = await searchParams;
  const ready = configuredAdmin(config);
  return <main className="login-page"><section className="login-card">
    <Link className="login-brand" href="/catalogo">Omni<span>Fix</span></Link>
    <p className="eyebrow">Gestión del taller</p><h1>Bienvenido a tu taller.</h1>
    <p className="muted">Ingresá con el usuario y la contraseña configurados para OmniFix.</p>
    {!ready ? <div className="login-notice" role="status"><h2>Falta activar el acceso</h2><p>El taller todavía no tiene un usuario y una contraseña configurados. Ingresar un nombre acá no crea una cuenta.</p><p>En la configuración de <strong>omnifix-taller</strong> en Vercel, agregá <code>WORKSHOP_ADMIN_USER</code> y <code>WORKSHOP_ADMIN_PASSWORD</code>. La contraseña debe tener al menos 20 caracteres. Después volvé a desplegar.</p><a className="button primary full" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Abrir Vercel</a></div> : <form action="/auth/login" method="post" className="login-form">
      {error && <p className="login-error" role="alert">{error === "credentials" ? "El usuario o la contraseña no coinciden. Revisalos y volvé a intentar." : "El acceso cambió. Revisá la configuración del taller."}</p>}
      <label htmlFor="username">Usuario<input id="username" name="username" autoComplete="username" maxLength={256} required autoFocus /></label>
      <label htmlFor="password">Contraseña<input id="password" name="password" type="password" autoComplete="current-password" maxLength={1024} required /></label>
      <button className="button primary full" type="submit">Entrar al taller</button>
      <p className="privacy-note">Tu sesión dura hasta 8 horas. Podés cerrarla desde el panel.</p>
    </form>}
    <Link className="login-back" href="/catalogo">← Volver al catálogo</Link>
  </section></main>;
}
