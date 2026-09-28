"use client";

import { isAfter, isToday, startOfToday } from "date-fns";
import { CheckIcon } from "lucide-react";
import { fmt } from "@/lib/format";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: Habit;
  /** Lunes a domingo de esta semana. */
  days: Date[];
  isDone: (day: Date) => boolean;
  onToggle: (day: Date) => void;
  onEdit: () => void;
}

/**
 * Un hábito en el celu: check grande para hoy y la semana abajo, tocable
 * para corregir un día que te olvidaste de marcar.
 */
export function HabitCard({ habit, days, isDone, onToggle, onEdit }: HabitCardProps) {
  const today = startOfToday();
  const todayDate = days.find((d) => isToday(d)) ?? today;
  const doneToday = isDone(todayDate);
  const scheduledToday = habit.days.includes(today.getDay());

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-card p-3 ring-1 ring-foreground/10 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onEdit} className="pressable flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Editar ${habit.name}`}>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `${habit.color}26` }}>
            {habit.emoji}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{habit.name}</span>
            <span className="block text-xs text-muted-foreground tabular">
              {habit.currentStreak > 0 ? (
                <>
                  <span className="font-medium text-streak">🔥 {habit.currentStreak} {habit.currentStreak === 1 ? "día" : "días"}</span> · máx. {habit.bestStreak}
                </>
              ) : scheduledToday ? (
                "Hoy empieza la racha"
              ) : (
                "Hoy no toca"
              )}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onToggle(todayDate)}
          aria-pressed={doneToday}
          aria-label={`${doneToday ? "Desmarcar" : "Marcar"} ${habit.name} hoy`}
          className={cn(
            "pressable flex size-13 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
            doneToday ? "border-transparent" : "border-foreground/20",
            !scheduledToday && !doneToday && "border-dashed opacity-60",
          )}
          style={doneToday ? { backgroundColor: habit.color, boxShadow: `0 0 20px ${habit.color}66` } : undefined}
        >
          {doneToday && <CheckIcon className="size-6 text-black/75" strokeWidth={3} />}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const future = isAfter(day, today);
          const checked = isDone(day);
          const scheduled = habit.days.includes(day.getDay());
          const current = isToday(day);
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={future}
              onClick={() => onToggle(day)}
              aria-pressed={checked}
              aria-label={`${checked ? "Desmarcar" : "Marcar"} ${habit.name} el ${fmt(day, "EEEE d")}`}
              className={cn("flex flex-col items-center gap-1 py-1 text-[11px] text-muted-foreground uppercase disabled:opacity-40", current && "font-semibold text-primary")}
            >
              <span
                className={cn("h-2 w-full rounded-full transition-colors", !checked && (scheduled ? "bg-foreground/10" : "bg-foreground/[0.04]"))}
                style={checked ? { backgroundColor: habit.color } : undefined}
              />
              {fmt(day, "EEEEE")}
            </button>
          );
        })}
      </div>
    </article>
  );
}
