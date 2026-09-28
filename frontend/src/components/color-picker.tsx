import { CheckIcon } from "lucide-react";
import { SWATCHES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 touch:grid touch:grid-cols-5 touch:gap-3" role="radiogroup" aria-label="Color">
      {SWATCHES.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          onClick={() => onChange(color)}
          className={cn(
            "flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110 touch:size-11 touch:justify-self-center touch:hover:scale-100",
            value === color && "ring-2 ring-foreground/60",
          )}
          style={{ backgroundColor: color }}
        >
          {value === color && <CheckIcon className="size-3.5 text-black/70" />}
        </button>
      ))}
    </div>
  );
}
