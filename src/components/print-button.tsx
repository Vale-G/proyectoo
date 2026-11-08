"use client";
export function PrintButton() { return <button className="button primary no-print" onClick={() => window.print()}>Imprimir / guardar como PDF</button>; }
