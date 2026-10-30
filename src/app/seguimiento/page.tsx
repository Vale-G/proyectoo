"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function TrackingEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = code.trim();
    // Accept the exact generated token or a tracking link, never arbitrary redirects.
    const match = value.match(/^(?:https?:\/\/[^/?#]+)?\/seguimiento\/([a-f0-9]{64})\/?$/i);
    const token = match?.[1] ?? value;
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      setError("Ingresá el enlace privado o el código completo recibido con tu orden. El número de orden solo no permite consultar el estado.");
      return;
    }
    router.push(`/seguimiento/${token.toLowerCase()}`);
  }
  return <main className="tracking-page"><section className="tracking-card"><p className="eyebrow">OmniFix</p><h1>Seguí tu reparación</h1><p>Ingresá el enlace privado o el código de seguimiento que te entregamos. No compartas este acceso con otras personas.</p><form className="status-form" onSubmit={submit}><label htmlFor="tracking-code">Enlace o código privado</label><input id="tracking-code" value={code} onChange={e => {setCode(e.target.value); setError("");}} required maxLength={2048} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-describedby="tracking-help" aria-invalid={!!error}/><p id="tracking-help" className="privacy-note">El número de orden no es tu código privado.</p>{error && <p role="alert">{error}</p>}<button className="button primary" type="submit">Ver estado</button></form><p><Link href="/catalogo">← Volver al catálogo</Link></p><p className="privacy-note">¿No encontrás el enlace? Escribinos por <a href="https://www.instagram.com/omnifix.serviciotecnico/" rel="noreferrer" target="_blank">Instagram</a> para verificar tu orden.</p></section></main>;
}
