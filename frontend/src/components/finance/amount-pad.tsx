"use client";

import { DeleteIcon } from "lucide-react";
import { useRef } from "react";
import { formatAmountInput } from "@/lib/format";
import type { MovementType } from "@/lib/types";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "back"] as const;
const MAX_INTEGER_DIGITS = 10;

/** Aplica una tecla al texto del monto ("4500,5"): coma decimal y hasta 2 decimales. */
function press(value: string, key: (typeof KEYS)[number]) {
  if (key === "back") return value.slice(0, -1);
  if (key === ",") {
    if (value.includes(",")) return value;
    return value === "" ? "0," : `${value},`;
  }
  const [int, dec] = value.split(",");
  if (dec !== undefined) return dec.length >= 2 ? value : value + key;
  if (int === "0") return key;
  return int.length >= MAX_INTEGER_DIGITS ? value : value + key;
}

/** Monto grande, como se va a guardar. */
export function AmountDisplay({ value, type }: { value: string; type: MovementType }) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "flex items-baseline justify-center gap-2 py-1 font-heading text-[2.6rem] leading-none font-semibold tabular",
        !value && "text-muted-foreground",
      )}
    >
      <span className="text-2xl font-medium text-muted-foreground">{type === "expense" ? "−$" : "+$"}</span>
      {formatAmountInput(value)}
      <span className={cn("h-9 w-0.5 self-center animate-pulse rounded-full", type === "expense" ? "bg-expense" : "bg-income")} />
    </p>
  );
}

/**
 * Teclado numérico propio para cargar montos en el celu: siempre visible,
 * sin el teclado del sistema tapando la hoja y con la coma argentina.
 * Mantener apretado ⌫ borra todo.
 */
export function AmountPad({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Teclado numérico">
      {KEYS.map((key) =>
        key === "back" ? (
          <button
            key={key}
            type="button"
            aria-label="Borrar"
            onClick={() => onChange(press(value, key))}
            onPointerDown={() => (holdTimer.current = setTimeout(() => onChange(""), 550))}
            onPointerUp={() => clearTimeout(holdTimer.current)}
            onPointerLeave={() => clearTimeout(holdTimer.current)}
            className="pressable flex h-12 items-center justify-center rounded-2xl text-muted-foreground select-none active:bg-foreground/10"
          >
            <DeleteIcon className="size-6" />
          </button>
        ) : (
          <button
            key={key}
            type="button"
            onClick={() => onChange(press(value, key))}
            className={cn(
              "pressable h-12 rounded-2xl font-heading text-[1.4rem] font-medium select-none active:bg-foreground/15",
              key === "," ? "text-muted-foreground" : "bg-foreground/[0.06]",
            )}
          >
            {key}
          </button>
        ),
      )}
    </div>
  );
}
