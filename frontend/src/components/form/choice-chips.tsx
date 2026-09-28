"use client";

import { cn } from "@/lib/utils";

export interface ChipOption<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Color propio (categoría, lista…): tiñe el chip cuando está elegido. */
  color?: string;
}

interface ChoiceChipsProps<T extends string> {
  value: T | null;
  onChange: (value: T) => void;
  options: ChipOption<T>[];
  label: string;
  className?: string;
}

/** Elegir una opción con un toque (reemplaza a un Select en listas cortas). */
export function ChoiceChips<T extends string>({ value, onChange, options, label, className }: ChoiceChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "pressable inline-flex h-8 items-center gap-2 rounded-full border border-input px-3 text-sm whitespace-nowrap transition-colors hover:bg-muted touch:h-10 touch:px-3.5",
              selected && !option.color && "border-primary/60 bg-primary/15 text-primary hover:bg-primary/20",
            )}
            style={selected && option.color ? { backgroundColor: `${option.color}26`, borderColor: option.color } : undefined}
          >
            {option.color && <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
