import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "OmniFix · Catálogo", description: "Reparación, mantenimiento y personalización por encargo." };
const services = [
  ["Celulares", "Pantalla, batería y carga", "Evaluamos el equipo y confirmamos modelo, calidad y disponibilidad del repuesto antes de presupuestar."],
  ["PlayStation", "Mantenimiento de consolas", "Revisión y mantenimiento según modelo y estado. El alcance se confirma después del diagnóstico."],
  ["Joysticks", "Botones, batería y conexión", "Revisión de botones, membranas, carga y piezas compatibles con la versión de tu control."],
  ["Personalización", "Tu control, tu estilo", "Carcasas, botones y grips por encargo. Compatibilidad y disponibilidad a confirmar; seña del 50% con presupuesto y repuesto confirmados."],
];
export default function CatalogPage() {
  return <main className="omnifix-public"><nav aria-label="Navegación pública"><strong>OmniFix</strong><Link href="/seguimiento">Seguir mi reparación →</Link></nav>
    <header><p className="eyebrow">Tecnología en buenas manos</p><h1>Una solución para tu equipo.</h1><p>Reparación, mantenimiento y personalización por encargo. Contanos el modelo y qué está pasando.</p><a className="button primary" href="https://www.instagram.com/omnifix.serviciotecnico/" target="_blank" rel="noopener noreferrer">Consultar por Instagram</a></header>
    <section className="omnifix-services" aria-label="Servicios">{services.map(([category, title, text]) => <article key={category}><p className="eyebrow">{category}</p><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section><h2>¿Tu equipo ya está en el taller?</h2><p>Usá el enlace privado que recibiste con tu orden para consultar el estado. No necesitás crear una cuenta.</p><Link className="button secondary" href="/seguimiento">Consultar mi orden</Link></section>
    <footer><p>El presupuesto y el plazo se confirman después de revisar el equipo y verificar los repuestos.</p><a href="https://www.facebook.com/share/19h9gGJgwU/" target="_blank" rel="noopener noreferrer">OmniFix en Facebook</a></footer>
  </main>;
}
