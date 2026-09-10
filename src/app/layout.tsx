import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TecniFlow · Punto Placa",
  description: "Gestión inteligente para talleres técnicos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
