import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniFix · Gestión del taller",
  description: "Gestión inteligente para talleres técnicos.",
  icons: { icon: "/brand/omnifix-original.jpg", apple: "/brand/omnifix-original.jpg" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "OmniFix", statusBarStyle: "black-translucent" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
