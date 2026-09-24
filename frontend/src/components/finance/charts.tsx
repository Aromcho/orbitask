"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { capitalize, fmt, formatMoney } from "@/lib/format";
import type { FinanceSummary } from "@/lib/types";

const dailyConfig = { expense: { label: "Gasto", color: "var(--expense)" } } satisfies ChartConfig;

/** Columnas de gasto por día del mes (una sola serie: no necesita leyenda). */
export function DailyExpenseChart({ daily }: { daily: FinanceSummary["daily"] }) {
  const data = daily.map((d) => ({ ...d, day: Number(d.date.slice(8)) }));

  return (
    <ChartContainer config={dailyConfig} className="aspect-auto h-72 w-full">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={16} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
        />
        <ChartTooltip
          cursor={{ fill: "var(--foreground)", fillOpacity: 0.05 }}
          content={({ active, payload }) => {
            const row = active && payload?.[0]?.payload;
            if (!row) return null;
            return (
              <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl">
                <p className="font-medium">{capitalize(fmt(row.date, "EEEE d 'de' MMMM"))}</p>
                <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <span className="size-2 rounded-full bg-expense" />
                  Gasto <span className="ml-auto font-medium text-foreground tabular">{formatMoney(row.expense)}</span>
                </p>
                {row.income > 0 && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2 rounded-full bg-income" />
                    Ingreso <span className="ml-auto font-medium text-foreground tabular">{formatMoney(row.income)}</span>
                  </p>
                )}
              </div>
            );
          }}
        />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ChartContainer>
  );
}

/** Ranking de gastos por categoría: barra con el color de la categoría + nombre y monto en texto. */
export function CategoryBreakdown({ items, total }: { items: FinanceSummary["byCategory"]; total: number }) {
  const max = Math.max(...items.map((i) => i.total), 1);
  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item) => (
        <li key={item.categoryId} className="grid gap-1.5">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-base leading-none">{item.emoji}</span>
            <span className="flex-1 truncate">{item.name}</span>
            <span className="text-xs text-muted-foreground tabular">{Math.round((item.total / total) * 100)}%</span>
            <span className="w-28 text-right font-medium tabular">{formatMoney(item.total)}</span>
          </div>
          <div className="h-2 rounded-full bg-foreground/[0.06]">
            <div className="h-full rounded-full" style={{ width: `${(item.total / max) * 100}%`, backgroundColor: item.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
