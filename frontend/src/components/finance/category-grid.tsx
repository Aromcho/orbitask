"use client";

import { PlusIcon } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoryGridProps {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  /** Abre el alta de una categoría nueva. */
  onCreate?: () => void;
}

/** Categorías como botones con emoji: se elige con un toque. */
export function CategoryGrid({ categories, value, onChange, onCreate }: CategoryGridProps) {
  return (
    <div role="radiogroup" aria-label="Categoría" className="grid grid-cols-4 gap-2">
      {categories.map((category) => {
        const selected = category.id === value;
        return (
          <button
            key={category.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(category.id)}
            className={cn(
              "pressable flex min-w-0 flex-col items-center gap-1 rounded-2xl bg-foreground/[0.05] px-1 py-2 text-[11px] leading-tight ring-1 ring-transparent transition-colors hover:bg-foreground/[0.08] touch:py-2.5 touch:text-xs",
              selected && "text-foreground",
            )}
            style={selected ? { backgroundColor: `${category.color}2e`, boxShadow: `inset 0 0 0 1.5px ${category.color}` } : undefined}
          >
            <span className="text-xl leading-none">{category.emoji}</span>
            <span className="w-full truncate text-center">{category.name}</span>
          </button>
        );
      })}
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="pressable flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-foreground/15 px-1 py-2 text-[11px] text-muted-foreground hover:bg-foreground/[0.04] touch:text-xs"
        >
          <PlusIcon className="size-5" />
          Nueva
        </button>
      )}
    </div>
  );
}
