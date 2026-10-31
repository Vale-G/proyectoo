'use client';
import Link from 'next/link';

export default function WorkshopError({ reset }: { reset: () => void }) {
  return <main className="login-page"><section className="login-card"><p className="eyebrow">OmniFix</p><h1>No pudimos completar la operación.</h1><p>No se informó un guardado exitoso. Volvé a intentar y comprobá el estado de la orden antes de repetir una operación.</p><p>Si estás configurando un Preview, verificá que tenga sus propias variables, las migraciones aplicadas y una base identificada como entorno de pruebas. No uses credenciales de producción.</p><button className="button primary full" onClick={reset}>Volver a intentar</button><Link className="login-back" href="/orders">Volver a órdenes</Link></section></main>;
}
