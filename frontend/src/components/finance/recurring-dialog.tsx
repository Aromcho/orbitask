"use client";

import { useState } from "react";
import { FormFooter } from "@/components/form/form-footer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLastValue } from "@/hooks/use-last-value";
import { parseAmount } from "@/lib/format";
import { useCategories, useDeleteRecurring, useSaveRecurring } from "@/lib/queries/finance";
import type { MovementType, Recurring } from "@/lib/types";
import { CategoryGrid } from "./category-grid";
import { TypeToggle } from "./type-toggle";

interface RecurringDialogProps {
  target: Recurring | "new" | null;
  onClose: () => void;
}

export function RecurringDialog({ target: current, onClose }: RecurringDialogProps) {
  const target = useLastValue(current);
  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {target && <RecurringForm key={target === "new" ? "new" : target.id} item={target === "new" ? null : target} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function RecurringForm({ item, onDone }: { item: Recurring | null; onDone: () => void }) {
  const { data: categories = [] } = useCategories();
  const [type, setType] = useState<MovementType>(item?.type ?? "expense");
  const [amount, setAmount] = useState(item ? String(item.amount).replace(".", ",") : "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? "");
  const [dayOfMonth, setDayOfMonth] = useState(String(item?.dayOfMonth ?? 1));
  const [note, setNote] = useState(item?.note ?? "");
  const [active, setActive] = useState(item?.active ?? true);
  const save = useSaveRecurring();
  const remove = useDeleteRecurring();

  const options = categories.filter((c) => c.type === type);
  const validCategory = options.some((c) => c.id === categoryId);
  const value = parseAmount(amount);
  const day = Number(dayOfMonth);
  const validDay = Number.isInteger(day) && day >= 1 && day <= 28;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate(
      { id: item?.id, type, amount: Math.round(value * 100) / 100, categoryId, dayOfMonth: day, note: note.trim(), active },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{item ? "Editar recurrente" : "Nuevo recurrente"}</DialogTitle>
        <DialogDescription>Se carga solo todos los meses: alquiler, sueldo, suscripciones…</DialogDescription>
      </DialogHeader>

      <TypeToggle value={type} onChange={(t) => (setType(t), setCategoryId(""))} />

      <div className="grid gap-2">
        <Label htmlFor="rec-note">Nombre</Label>
        <Input id="rec-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: Netflix" maxLength={200} enterKeyHint="next" required />
      </div>

      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <div className="grid gap-2">
          <Label htmlFor="rec-amount">Monto</Label>
          <Input
            id="rec-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0"
            className="tabular"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rec-day">Día del mes</Label>
          <Input
            id="rec-day"
            inputMode="numeric"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
            aria-invalid={dayOfMonth !== "" && !validDay}
            className="tabular"
            required
          />
        </div>
      </div>
      {dayOfMonth !== "" && !validDay && <p className="-mt-2 text-xs text-destructive">Elegí un día entre 1 y 28 (así existe en todos los meses).</p>}

      <div className="grid gap-2">
        <Label>Categoría</Label>
        <CategoryGrid categories={options} value={categoryId} onChange={setCategoryId} />
      </div>

      {item && (
        <label className="flex items-center justify-between gap-3 text-sm">
          Activo (se genera cada mes)
          <Switch checked={active} onCheckedChange={setActive} />
        </label>
      )}

      <FormFooter
        onCancel={onDone}
        pending={save.isPending}
        disabled={!validCategory || !(value > 0) || !validDay}
        remove={
          item
            ? {
                title: `¿Eliminar "${item.note}"?`,
                description: "Los movimientos que ya se generaron no se borran.",
                onConfirm: () => remove.mutate(item.id, { onSuccess: onDone }),
              }
            : undefined
        }
      />
    </form>
  );
}
