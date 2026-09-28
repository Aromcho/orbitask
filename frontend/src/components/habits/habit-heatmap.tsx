"use client";

import { addDays, isAfter, isSameDay, startOfToday } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { capitalize, fmt, toDay } from "@/lib/format";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HeatmapProps {
  /** Lunes de la primera semana que se muestra. */
  start: Date;
  weeks: number;
  habits: Habit[];
  /** 'YYYY-MM-DD' → cantidad de hábitos cumplidos ese día. */
  doneByDay: Map<string, number>;
  /** Ocupa el ancho disponible (celu) en vez de cuadritos de tamaño fijo con scroll. */
  fluid?: boolean;
}

const LEVELS = ["bg-foreground/[0.06]", "bg-primary/30", "bg-primary/55", "bg-primary/80", "bg-primary"];
const ROW_LABELS = ["L", "", "M", "", "V", "", "D"];

/** Mapa de calor estilo GitHub: cada cuadrito es un día. Tocá uno para ver el detalle. */
export function HabitHeatmap({ start, weeks, habits, doneByDay, fluid }: HeatmapProps) {
  const today = startOfToday();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Date | null>(null);

  // Arranca mostrando lo más reciente (a la derecha)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const stats = (day: Date) => {
    const scheduled = habits.filter((h) => h.days.includes(day.getDay())).length;
    const done = doneByDay.get(toDay(day)) ?? 0;
    return { scheduled, done };
  };
  const detail = selected ? stats(selected) : null;

  const cell = fluid ? "aspect-square w-full rounded-[3px]" : "size-4 rounded-[4px]";
  const dayCell = (day: Date, key: number) => {
    if (isAfter(day, today)) return <span key={key} className={cell} />;
    const { scheduled, done } = stats(day);
    const ratio = scheduled ? done / scheduled : done ? 1 : 0;
    const level = done === 0 ? 0 : Math.min(4, Math.ceil(ratio * 4));
    const isSelected = selected !== null && isSameDay(selected, day);
    return (
      <button
        key={key}
        type="button"
        onClick={() => setSelected(isSelected ? null : day)}
        title={`${fmt(day, "EEEE d 'de' MMMM")}: ${done} de ${scheduled}`}
        aria-label={`${fmt(day, "EEEE d 'de' MMMM")}: ${done} de ${scheduled} hábitos`}
        className={cn(
          cell,
          "transition-colors",
          LEVELS[level],
          isSameDay(day, today) && "ring-1 ring-primary ring-offset-1 ring-offset-card",
          isSelected && "ring-2 ring-foreground ring-offset-1 ring-offset-card",
        )}
      />
    );
  };
  const monthLabel = (monday: Date) => (monday.getDate() <= 7 ? fmt(monday, "MMM") : ""); // primera semana de cada mes

  return (
    <div className="flex flex-col gap-3">
      {fluid ? (
        // Una sola grilla (columna de etiquetas + una columna por semana): los cuadritos se estiran al ancho
        <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${weeks}, minmax(0, 1fr))`, gridTemplateRows: "auto repeat(7, auto)", gridAutoFlow: "column" }}>
          <span />
          {ROW_LABELS.map((label, i) => (
            <span key={i} className="flex items-center pr-1 text-[10px] text-muted-foreground">
              {label}
            </span>
          ))}
          {Array.from({ length: weeks }, (_, w) => {
            const monday = addDays(start, w * 7);
            return [
              <span key={`m${w}`} className="h-4 text-[10px] whitespace-nowrap text-muted-foreground capitalize">
                {monthLabel(monday)}
              </span>,
              ...Array.from({ length: 7 }, (_, d) => dayCell(addDays(monday, d), w * 7 + d)),
            ];
          })}
        </div>
      ) : (
        <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto pb-1">
          <div className="grid shrink-0 grid-rows-7 gap-1 pt-5 text-[10px] text-muted-foreground">
            {ROW_LABELS.map((label, i) => (
              <span key={i} className="flex h-4 items-center">
                {label}
              </span>
            ))}
          </div>
          {Array.from({ length: weeks }, (_, w) => {
            const monday = addDays(start, w * 7);
            return (
              <div key={w} className="flex shrink-0 flex-col gap-1">
                <span className="h-4 text-[10px] whitespace-nowrap text-muted-foreground capitalize">{monthLabel(monday)}</span>
                {Array.from({ length: 7 }, (_, d) => dayCell(addDays(monday, d), d))}
              </div>
            );
          })}
        </div>
      )}
      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {selected && detail ? (
          <>
            <span className="text-foreground">{capitalize(fmt(selected, "EEEE d 'de' MMMM"))}</span>:{" "}
            {detail.scheduled ? `${detail.done} de ${detail.scheduled} hábitos` : detail.done ? `${detail.done} hábitos` : "no tocaba ninguno"}
          </>
        ) : (
          "Tocá un día para ver el detalle."
        )}
      </p>
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      Menos
      {LEVELS.map((c) => (
        <span key={c} className={cn("size-3 rounded-[3px]", c)} />
      ))}
      Más
    </div>
  );
}
