import { addDays, isAfter, startOfToday } from "date-fns";
import { fmt, toDay } from "@/lib/format";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HeatmapProps {
  /** Lunes de la primera semana que se muestra. */
  start: Date;
  weeks: number;
  habits: Habit[];
  /** 'YYYY-MM-DD' → cantidad de hábitos cumplidos ese día. */
  doneByDay: Map<string, number>;
}

const LEVELS = ["bg-foreground/[0.06]", "bg-primary/30", "bg-primary/55", "bg-primary/80", "bg-primary"];
const ROW_LABELS = ["L", "", "M", "", "V", "", "D"];

/** Mapa de calor estilo GitHub: cada cuadrito es un día. */
export function HabitHeatmap({ start, weeks, habits, doneByDay }: HeatmapProps) {
  const today = startOfToday();

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      <div className="grid shrink-0 grid-rows-7 gap-1 pt-5 text-[10px] text-muted-foreground">
        {ROW_LABELS.map((label, i) => (
          <span key={i} className="flex h-4 items-center">
            {label}
          </span>
        ))}
      </div>
      {Array.from({ length: weeks }, (_, w) => {
        const monday = addDays(start, w * 7);
        const showMonth = monday.getDate() <= 7; // primera semana de cada mes
        return (
          <div key={w} className="flex shrink-0 flex-col gap-1">
            <span className="h-4 text-[10px] whitespace-nowrap text-muted-foreground capitalize">{showMonth ? fmt(monday, "MMM") : ""}</span>
            {Array.from({ length: 7 }, (_, d) => {
              const day = addDays(monday, d);
              if (isAfter(day, today)) return <span key={d} className="size-4" />;

              const key = toDay(day);
              const scheduled = habits.filter((h) => h.days.includes(day.getDay())).length;
              const done = doneByDay.get(key) ?? 0;
              const ratio = scheduled ? done / scheduled : done ? 1 : 0;
              const level = done === 0 ? 0 : Math.min(4, Math.ceil(ratio * 4));
              return (
                <span
                  key={d}
                  title={`${fmt(day, "EEEE d 'de' MMMM")}: ${done} de ${scheduled}`}
                  className={cn("size-4 rounded-[4px] transition-colors", LEVELS[level])}
                />
              );
            })}
          </div>
        );
      })}
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
