import type { EventCategory, Priority } from "./types";

export const EVENT_CATEGORIES: Record<EventCategory, { label: string; color: string }> = {
  personal: { label: "Personal", color: "#8b7cf6" },
  trabajo: { label: "Trabajo", color: "#38bdf8" },
  salud: { label: "Salud", color: "#2dd4bf" },
  social: { label: "Social", color: "#f472b6" },
  estudio: { label: "Estudio", color: "#fbbf24" },
  otro: { label: "Otro", color: "#94a3b8" },
};

export const PRIORITIES: Record<Priority, { label: string; className: string }> = {
  alta: { label: "Alta", className: "bg-expense/15 text-expense" },
  media: { label: "Media", className: "bg-streak/15 text-streak" },
  baja: { label: "Baja", className: "bg-muted text-muted-foreground" },
};

/** Paleta para elegir colores de listas, hábitos y categorías. */
export const SWATCHES = [
  "#8b7cf6",
  "#38bdf8",
  "#2dd4bf",
  "#4ade80",
  "#fbbf24",
  "#fb923c",
  "#fb7185",
  "#f472b6",
  "#a78bfa",
  "#94a3b8",
];

/** Etiquetas cortas de días, indexadas como Date.getDay() (0 = domingo). */
export const WEEKDAY_SHORT = ["D", "L", "M", "M", "J", "V", "S"];
export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
/** Orden de la semana en la UI: lunes primero. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
