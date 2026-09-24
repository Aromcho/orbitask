import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { backgroundInitScript } from "@/lib/background";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Orbitask", template: "%s · Orbitask" },
  description: "Mi agenda personal: semana, tareas, hábitos, finanzas y deseos.",
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
