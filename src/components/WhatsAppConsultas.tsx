"use client";

import { usePathname } from "next/navigation";

export default function WhatsAppConsultas() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const numero =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  if (!numero) {
    return null;
  }

  const mensaje =
    "Hola, quisiera hacer una consulta sobre los tratamientos y turnos de Estética Gold.";

  const link =
    `https://wa.me/${numero}?text=${encodeURIComponent(
      mensaje
    )}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-[#25D366] px-5 py-4 font-black text-white shadow-2xl transition hover:scale-105"
    >
      <span className="text-xl">
        💬
      </span>

      <span className="hidden sm:block">
        CONSULTAS POR WHATSAPP
      </span>

      <span className="sm:hidden">
        WHATSAPP
      </span>
    </a>
  );
}