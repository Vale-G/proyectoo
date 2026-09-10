import Link from "next/link";

export default function NotFound() { return <main className="not-found"><p className="eyebrow">TecniFlow</p><h1>No encontramos esa orden.</h1><p>Puede que el enlace sea incorrecto, haya vencido o pertenezca a otro taller.</p><Link className="button primary" href="/">Ir al inicio</Link></main>; }
