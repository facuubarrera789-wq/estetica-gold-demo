import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ESTÉTICA GOLD | Turnos Online",
  description:
    "Reservá tu turno online en ESTÉTICA GOLD.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}