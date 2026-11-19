import type { Metadata } from "next";
import "./globals.css";
import "./workshop.css";
import { cookies } from "next/headers";
import { normalizeAppearance } from "@/components/workshop/appearance";

export const metadata: Metadata = {
  title: "Gestión del taller",
  description: "Gestión inteligente para talleres técnicos.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Taller", statusBarStyle: "black-translucent" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme=normalizeAppearance((await cookies()).get("workshop_appearance")?.value);
  return <html lang="es" data-theme={theme}><body>{children}</body></html>;
}
