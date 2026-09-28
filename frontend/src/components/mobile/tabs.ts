import { CalendarDaysIcon, FlameIcon, GiftIcon, HouseIcon, SquareKanbanIcon, WalletIcon } from "lucide-react";
import type { CreateKind } from "./mobile-provider";

/** Pestañas de la barra inferior (el + y "Más" van aparte). */
export const TABS = [
  { href: "/", label: "Hoy", icon: HouseIcon },
  { href: "/semana", label: "Semana", icon: CalendarDaysIcon },
  { href: "/tareas", label: "Tareas", icon: SquareKanbanIcon },
] as const;

/** Secciones que viven en "Más". */
export const MORE_SECTIONS = [
  { href: "/habitos", label: "Hábitos", icon: FlameIcon },
  { href: "/finanzas", label: "Finanzas", icon: WalletIcon },
  { href: "/deseos", label: "Deseos", icon: GiftIcon },
] as const;

/** Qué crea el + en cada sección. En Hoy abre el menú con todo. */
export const CREATE_BY_ROUTE: Record<string, CreateKind> = {
  "/semana": "evento",
  "/tareas": "tarea",
  "/habitos": "habito",
  "/finanzas": "gasto",
  "/deseos": "deseo",
};

/** Posición en la barra (0 Hoy, 1 Semana, 2 Tareas, 3 Más): define hacia dónde se desliza al cambiar. */
export function tabIndex(pathname: string) {
  if (pathname === "/") return 0;
  if (pathname.startsWith("/semana")) return 1;
  if (pathname.startsWith("/tareas")) return 2;
  return 3;
}
