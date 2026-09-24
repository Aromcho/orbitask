"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useSaveRecurring } from "@/lib/queries/finance";
import type { MovementType, Recurring } from "@/lib/types";
import { TypeToggle } from "./type-toggle";

interface RecurringDialogProps {
  target: Recurring | "new" | null;
  onClose: () => void;
}

export function RecurringDialog({ target, onClose }: RecurringDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {target && <RecurringForm key={target === "new" ? "new" : target.id} item={target === "new" ? null : target} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function RecurringForm({ item, onDone }: { item: Recurring | null; onDone: () => void }) {
  const { data: categories = [] } = useCategories();
  const [type, setType] = useState<MovementType>(item?.type ?? "expense");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? "");
  const [dayOfMonth, setDayOfMonth] = useState(String(item?.dayOfMonth ?? 1));
  const [note, setNote] = useState(item?.note ?? "");
  const save = useSaveRecurring();

  const options = categories.filter((c) => c.type === type);
  const validCategory = options.some((c) => c.id === categoryId);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate(
      { id: item?.id, type, amount: Number(amount), categoryId, dayOfMonth: Number(dayOfMonth), note: note.trim() },
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
        <Input id="rec-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: Netflix" maxLength={200} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="rec-amount">Monto</Label>
          <Input id="rec-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rec-day">Día del mes</Label>
          <Input id="rec-day" type="number" min={1} max={28} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Categoría</Label>
        <Select value={validCategory ? categoryId : ""} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Elegí una" />
          </SelectTrigger>
          <SelectContent>
            {options.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span>{c.emoji}</span>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={save.isPending || !validCategory || !(Number(amount) > 0)}>
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}
