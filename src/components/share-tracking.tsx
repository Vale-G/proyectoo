"use client";
import { useState } from "react";
export function ShareTracking({ url, orderNumber }: { url: string; orderNumber: string }) {
  const [message, setMessage] = useState("");
  return <div className="share-tracking"><label>Enlace privado para el cliente<input readOnly value={url} onFocus={event => event.currentTarget.select()} /></label><div className="order-actions"><button type="button" className="button secondary" onClick={async () => { try { await navigator.clipboard.writeText(url); setMessage("Enlace copiado."); } catch { setMessage("Seleccioná y copiá el enlace del campo."); } }}>Copiar enlace</button><a className="button secondary" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`OmniFix · Orden #${orderNumber}. Consultá el estado de tu equipo: ${url}`)}`}>Compartir por WhatsApp</a></div>{message && <p role="status">{message}</p>}</div>;
}
