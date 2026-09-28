"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { capitalize, fmt, formatMoney } from "@/lib/format";
import type { FinanceSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryBreakdown } from "./charts";

interface MonthHeroProps {
  summary: FinanceSummary | undefined;
  isCurrentMonth: boolean;
}

/** El mes en una tarjeta (celu): balance, ingresos/gastos, gasto por día y por categoría. */
export function MonthHero({ summary, isCurrentMonth }: MonthHeroProps) {
  if (!summary) return <Skeleton className="h-80 rounded-2xl" />;

  return (
    <Card className="gap-5">
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Balance del mes</p>
          <p className={cn("font-heading text-[2.4rem] leading-tight font-semibold tabular", summary.balance < 0 ? "text-expense" : "text-income")}>
            {formatMoney(summary.balance)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-income/12 px-3 py-2">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="truncate font-heading font-semibold tabular">{formatMoney(summary.income)}</p>
          </div>
          <div className="rounded-xl bg-expense/12 px-3 py-2">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="truncate font-heading font-semibold tabular">{formatMoney(summary.expense)}</p>
          </div>
        </div>
        {summary.expense > 0 ? (
          <DailyScrubber daily={summary.daily} isCurrentMonth={isCurrentMonth} />
        ) : (
          <p className="rounded-xl bg-foreground/[0.04] py-4 text-center text-sm text-muted-foreground">Sin gastos este mes 🎉</p>
        )}
        {summary.byCategory.length > 0 && <CategoryShare items={summary.byCategory} total={summary.expense} />}
      </CardContent>
    </Card>
  );
}

/** Barras de gasto diario: tocá o deslizá el dedo para ver cada día. */
function DailyScrubber({ daily, isCurrentMonth }: { daily: FinanceSummary["daily"]; isCurrentMonth: boolean }) {
  const today = new Date().getDate();
  const busiest = daily.reduce((best, d, i) => (d.expense > daily[best].expense ? i : best), 0);
  const [selected, setSelected] = useState(isCurrentMonth ? today - 1 : busiest);
  const [scrubbing, setScrubbing] = useState(false);
  const max = Math.max(...daily.map((d) => d.expense), 1);
  const day = daily[Math.min(selected, daily.length - 1)];

  const pick = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const index = Math.floor(((event.clientX - rect.left) / rect.width) * daily.length);
    setSelected(Math.min(daily.length - 1, Math.max(0, index)));
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Día del mes"
        aria-valuemin={1}
        aria-valuemax={daily.length}
        aria-valuenow={selected + 1}
        aria-valuetext={capitalize(fmt(day.date, "EEEE d"))}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setSelected((s) => Math.max(0, s - 1));
          if (e.key === "ArrowRight") setSelected((s) => Math.min(daily.length - 1, s + 1));
        }}
        onPointerDown={(e) => {
          setScrubbing(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e);
        }}
        onPointerMove={(e) => scrubbing && pick(e)}
        onPointerUp={() => setScrubbing(false)}
        onPointerCancel={() => setScrubbing(false)}
        className="flex h-16 touch-pan-y items-end gap-[2px] rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {daily.map((d, i) => {
          const future = isCurrentMonth && i + 1 > today;
          return (
            <span
              key={d.date}
              className={cn(
                "min-h-[3px] flex-1 rounded-t-[3px] transition-colors",
                future ? "bg-foreground/[0.06]" : i === selected ? "bg-expense shadow-[0_0_10px] shadow-expense/60" : "bg-expense/40",
              )}
              style={{ height: future ? 3 : `${Math.max(4, (d.expense / max) * 100)}%` }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{capitalize(fmt(day.date, "EEEE d"))}</span>
        <span className="flex items-center gap-3 font-medium tabular">
          {day.income > 0 && <span className="text-income">+ {formatMoney(day.income)}</span>}
          <span className={day.expense ? "text-expense" : "text-muted-foreground"}>{day.expense ? `− ${formatMoney(day.expense)}` : "Sin gastos"}</span>
        </span>
      </div>
    </div>
  );
}

/** En qué se fue la plata: una barra apilada y las 3 categorías principales. */
function CategoryShare({ items, total }: { items: FinanceSummary["byCategory"]; total: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2.5 border-t border-foreground/10 pt-4">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-foreground/[0.06]">
        {items.map((item) => (
          <span key={item.categoryId} style={{ width: `${(item.total / total) * 100}%`, backgroundColor: item.color }} />
        ))}
      </div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-3 text-left text-sm">
        <span className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1">
          {items.slice(0, 3).map((item) => (
            <span key={item.categoryId} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.emoji} {item.name}
              <span className="text-muted-foreground tabular">{Math.round((item.total / total) * 100)}%</span>
            </span>
          ))}
        </span>
        <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="pt-2 animate-in fade-in-0">
          <CategoryBreakdown items={items} total={total} />
        </div>
      )}
    </div>
  );
}
