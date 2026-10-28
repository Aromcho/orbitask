"use client";

import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fmt, formatMoney } from "@/lib/format";
import { useSetCarry } from "@/lib/queries/finance";
import type { FinanceSummary } from "@/lib/types";

/** Mes nuevo: pregunta si el saldo del mes anterior pasa a este. */
export function CarryPrompt({ summary }: { summary: FinanceSummary | undefined }) {
  const setCarry = useSetCarry();
  if (!summary || summary.carryDecision !== null || summary.previousAvailable === 0) return null;

  const [y, m] = summary.month.split("-").map(Number);
  const prevName = fmt(new Date(y, m - 2, 1), "MMMM");
  const thisName = fmt(new Date(y, m - 1, 1), "MMMM");
  const positive = summary.previousAvailable > 0;
  const answer = (carry: boolean) => setCarry.mutate({ month: summary.month, carry });

  return (
    <Card className="border-primary/30 bg-primary/[0.06]">
      <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm">
          Empezó {thisName}. {positive ? "Te sobraron" : "Te faltaron"}{" "}
          <span className={positive ? "font-semibold text-income" : "font-semibold text-expense"}>{formatMoney(Math.abs(summary.previousAvailable))}</span> de {prevName}.
          ¿Los pasás a este mes?
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" disabled={setCarry.isPending} onClick={() => answer(false)} className="max-md:flex-1">
            Empezar de cero
          </Button>
          <Button disabled={setCarry.isPending} onClick={() => answer(true)} className="max-md:flex-1">
            Sí, pasarlo
            <ArrowRightIcon />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
