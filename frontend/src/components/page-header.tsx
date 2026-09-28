"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** Botones o controles a la derecha del título (escritorio). */
  actions?: React.ReactNode;
  /** Controles compactos arriba a la derecha en el celu (ej: cambiar de mes). */
  mobileActions?: React.ReactNode;
  /** En el celu, al scrollear aparece una barra fija con el título. Apagala si la página tiene su propia cabecera fija. */
  compactBar?: boolean;
}

export function PageHeader({ title, description, actions, mobileActions, compactBar = true }: PageHeaderProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Cuando el título grande sale de la pantalla, mostramos la barra compacta
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !compactBar) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(el);
    return () => observer.disconnect();
  }, [compactBar]);

  return (
    <>
      {compactBar && (
        <div
          aria-hidden={!scrolled}
          className={cn(
            "fixed inset-x-0 top-0 z-30 border-b border-foreground/10 bg-background/80 pt-safe backdrop-blur-xl transition-[opacity,translate] duration-200 md:hidden",
            scrolled ? "opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
          )}
        >
          <div className="flex h-12 items-center justify-between gap-3 px-4">
            <p className="truncate font-heading text-[1.05rem] font-semibold tracking-tight">{title}</p>
            {mobileActions && <div className="flex shrink-0 items-center gap-1">{mobileActions}</div>}
          </div>
        </div>
      )}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.9rem] leading-tight font-semibold md:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            <div ref={sentinel} aria-hidden />
          </div>
          {mobileActions && <div className="flex shrink-0 items-center gap-1 pt-1 md:hidden">{mobileActions}</div>}
        </div>
        {actions && <div className="hidden flex-wrap items-center gap-2 md:flex">{actions}</div>}
      </header>
    </>
  );
}
