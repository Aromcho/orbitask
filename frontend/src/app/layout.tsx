import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { backgroundInitScript } from "@/lib/background";
import splashScreens from "@/lib/splash-screens.json";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Orbitask", template: "%s · Orbitask" },
  description: "Mi agenda personal: semana, tareas, hábitos, finanzas y deseos.",
  applicationName: "Orbitask",
  // Instalada en el iPhone ("Agregar a inicio"): pantalla completa, barra de estado
  // translúcida sobre el fondo de la app y pantalla de arranque oscura (sin flash blanco).
  appleWebApp: {
    capable: true,
    title: "Orbitask",
    statusBarStyle: "black-translucent",
    startupImage: splashScreens,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Ocupa toda la pantalla (detrás del notch); los márgenes los ponen env(safe-area-inset-*)
  viewportFit: "cover",
  // Color de la barra del navegador. ThemeColorSync lo actualiza al cambiar de tema.
  themeColor: "#0b0d17",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        {/* Aplica el fondo guardado antes de pintar, para que no parpadee */}
        <script dangerouslySetInnerHTML={{ __html: backgroundInitScript }} />
      </head>
      <body className="min-h-full">
        <div className="orbitask-bg" aria-hidden />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
