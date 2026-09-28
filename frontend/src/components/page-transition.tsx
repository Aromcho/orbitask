"use client";

import { ViewTransition } from "react";

const SLIDES = { "tab-forward": "tab-forward", "tab-back": "tab-back", default: "none" };

/**
 * Contenido de cada página. Al cambiar de pestaña en la barra inferior se desliza
 * hacia el lado de la pestaña elegida (animaciones en globals.css). Sin tipo de
 * transición (atrás del navegador, refrescos) no anima.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={SLIDES} exit={SLIDES} default="none">
      <div className="flex flex-1 flex-col gap-5 md:gap-6">{children}</div>
    </ViewTransition>
  );
}
