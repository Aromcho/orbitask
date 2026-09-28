import type { MetadataRoute } from "next";

/**
 * Manifest de la PWA: permite instalar Orbitask en el celu como una app
 * (Safari → Compartir → "Agregar a inicio", o "Instalar app" en Chrome).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Orbitask",
    short_name: "Orbitask",
    description: "Mi agenda personal: semana, tareas, hábitos, finanzas y deseos.",
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0d17",
    theme_color: "#0b0d17",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Mantener apretado el ícono (Android): accesos directos a la captura rápida
    shortcuts: [
      { name: "Nuevo gasto", short_name: "Gasto", url: "/?crear=gasto", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Nueva tarea", short_name: "Tarea", url: "/?crear=tarea", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Nuevo evento", short_name: "Evento", url: "/?crear=evento", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
    // Compartir un link desde otra app (Android) → lo recibe Deseos
    share_target: {
      action: "/deseos",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
