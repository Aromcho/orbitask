import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react";
import type { MovementType } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Selector Gasto / Ingreso. */
export function TypeToggle({ value, onChange }: { value: MovementType; onChange: (type: MovementType) => void }) {
  const options = [
    { type: "expense" as const, label: "Gasto", icon: ArrowUpRightIcon, active: "bg-expense/15 text-expense ring-expense/40" },
    { type: "income" as const, label: "Ingreso", icon: ArrowDownLeftIcon, active: "bg-income/15 text-income ring-income/40" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
      {options.map(({ type, label, icon: Icon, active }) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          aria-pressed={value === type}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-muted-foreground transition-colors",
            value === type && cn("ring-1", active),
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
