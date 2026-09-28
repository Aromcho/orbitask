"use client";

import { addDays, isSaturday, nextMonday, nextSaturday, startOfToday } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toDay } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DateChipsProps {
  /** 'YYYY-MM-DD' o "" (sin fecha). */
  value: string;
  onChange: (value: string) => void;
  /** Agrega el chip "Sin fecha" (vencimientos opcionales). */
  allowEmpty?: boolean;
  /** Chips extra: "Sábado" y "Lunes". */
  extended?: boolean;
  /** Para cosas que ya pasaron (gastos): "Ayer" en vez de "Mañana". */
  past?: boolean;
  id?: string;
}

/** Atajos de fecha (Hoy, Mañana…) + el selector nativo para cualquier otra. */
export function DateChips({ value, onChange, allowEmpty, extended, past, id }: DateChipsProps) {
  const today = startOfToday();
  const presets = [
    ...(allowEmpty ? [{ label: "Sin fecha", day: "" }] : []),
    { label: "Hoy", day: toDay(today) },
    past ? { label: "Ayer", day: toDay(addDays(today, -1)) } : { label: "Mañana", day: toDay(addDays(today, 1)) },
    ...(extended
      ? [
          { label: "Sábado", day: toDay(isSaturday(today) ? addDays(today, 7) : nextSaturday(today)) },
          { label: "Lunes", day: toDay(nextMonday(today)) },
        ]
      : []),
  ];
  const custom = value !== "" && !presets.some((p) => p.day === value);

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        const selected = preset.day === value;
        return (
          <button
            key={preset.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(preset.day)}
            className={cn(
              "pressable inline-flex h-8 items-center rounded-full border border-input px-3 text-sm whitespace-nowrap transition-colors hover:bg-muted touch:h-10 touch:px-3.5",
              selected && "border-primary/60 bg-primary/15 text-primary hover:bg-primary/20",
            )}
          >
            {preset.label}
          </button>
        );
      })}
      {/* Selector nativo: visible con la fecha si es "otra"; si no, un chip que lo abre al tocarlo */}
      <label
        className={cn(
          "pressable relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-full border border-input text-sm hover:bg-muted touch:h-10",
          custom ? "border-primary/60 bg-primary/15 pr-1 pl-3 text-primary" : "px-3 text-muted-foreground",
        )}
      >
        <CalendarIcon className="size-3.5 shrink-0" />
        {!custom && <span className="whitespace-nowrap">Otra fecha</span>}
        <input
          id={id}
          type="date"
          aria-label="Otra fecha"
          value={custom ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker();
            } catch {
              // sin showPicker: el navegador abre su selector igual al tocar el campo
            }
          }}
          className={cn(
            "bg-transparent text-sm outline-none [color-scheme:inherit]",
            custom ? "h-full w-[8.5rem]" : "absolute inset-0 size-full cursor-pointer opacity-0",
          )}
        />
      </label>
    </div>
  );
}
