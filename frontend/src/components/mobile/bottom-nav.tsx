"use client";

import { LayoutGridIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { useMobileUI } from "./mobile-provider";
import { CREATE_BY_ROUTE, MORE_SECTIONS, TABS, tabIndex } from "./tabs";

const HOLD_MS = 450;

/**
 * Barra inferior del celu: Hoy · Semana · + · Tareas · Más.
 * Flota sobre el contenido, respeta la barra de inicio del iPhone y se esconde
 * mientras el teclado está abierto.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { create, openCreateMenu, openMore } = useMobileUI();
  const current = tabIndex(pathname);
  const moreSection = MORE_SECTIONS.find((s) => pathname.startsWith(s.href));
  const MoreIcon = moreSection?.icon ?? LayoutGridIcon;

  // Mantener apretado el + abre el menú con todo; un toque crea lo de la sección
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const held = useRef(false);
  const startHold = () => {
    held.current = false;
    holdTimer.current = setTimeout(() => {
      held.current = true;
      haptic();
      openCreateMenu();
    }, HOLD_MS);
  };
  const cancelHold = () => clearTimeout(holdTimer.current);

  function onPlus() {
    if (held.current) {
      held.current = false;
      return;
    }
    const kind = Object.entries(CREATE_BY_ROUTE).find(([route]) => pathname.startsWith(route))?.[1];
    if (kind) create(kind);
    else openCreateMenu();
  }

  const tabLink = (tab: (typeof TABS)[number], index: number) => {
    const active = index === current;
    return (
      <Link
        key={tab.href}
        href={tab.href}
        aria-current={active ? "page" : undefined}
        transitionTypes={index === current ? undefined : [index > current ? "tab-forward" : "tab-back"]}
        className={cn("pressable flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground", active && "text-primary")}
      >
        <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200", active && "bg-primary/15")}>
          <tab.icon className="size-[22px]" strokeWidth={active ? 2.25 : 2} />
        </span>
        {tab.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Secciones"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.75rem))] md:hidden in-data-[keyboard=open]:hidden"
    >
      <div className="pointer-events-auto mx-auto grid h-16 max-w-md grid-cols-5 items-center rounded-[26px] border border-foreground/10 bg-popover/85 shadow-[0_16px_40px_-16px_rgb(0_0_0/0.7)] backdrop-blur-xl">
        {tabLink(TABS[0], 0)}
        {tabLink(TABS[1], 1)}
        <button
          type="button"
          aria-label="Crear"
          onClick={onPlus}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          onContextMenu={(e) => e.preventDefault()}
          className="pressable mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/40 select-none active:bg-primary/85"
        >
          <PlusIcon className="size-6" strokeWidth={2.5} />
        </button>
        {tabLink(TABS[2], 2)}
        <button
          type="button"
          onClick={openMore}
          aria-current={moreSection ? "page" : undefined}
          className={cn("pressable flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground", moreSection && "text-primary")}
        >
          <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200", moreSection && "bg-primary/15")}>
            <MoreIcon className="size-[22px]" strokeWidth={moreSection ? 2.25 : 2} />
          </span>
          {moreSection?.label ?? "Más"}
        </button>
      </div>
    </nav>
  );
}
