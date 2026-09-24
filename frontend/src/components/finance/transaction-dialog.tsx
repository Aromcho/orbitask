"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { todayDay } from "@/lib/format";
import { useCategories, useDeleteTransaction, useSaveTransaction } from "@/lib/queries/finance";
import type { MovementType, Transaction } from "@/lib/types";
import { TypeToggle } from "./type-toggle";

interface TransactionDialogProps {
  target: Transaction | "new" | null;
  onClose: () => void;
}

export function TransactionDialog({ target, onClose }: TransactionDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {target && <TransactionForm key={target === "new" ? "new" : target.id} tx={target === "new" ? null : target} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function TransactionForm({ tx, onDone }: { tx: Transaction | null; onDone: () => void }) {
  const { data: categories = [] } = useCategories();
  const [type, setType] = useState<MovementType>(tx?.type ?? "expense");
  const [amount, setAmount] = useState(tx ? String(tx.amount) : "");
  const [categoryId, setCategoryId] = useState(tx?.categoryId ?? "");
  const [date, setDate] = useState(tx?.date ?? todayDay());
  const [note, setNote] = useState(tx?.note ?? "");
  const save = useSaveTransaction();
  const remove = useDeleteTransaction();

  const options = categories.filter((c) => c.type === type);
  const validCategory = options.some((c) => c.id === categoryId);
  const value = Number(amount);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate({ id: tx?.id, type, amount: value, categoryId, date, note: note.trim() }, { onSuccess: onDone });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{tx ? "Editar movimiento" : "Nuevo movimiento"}</DialogTitle>
      </DialogHeader>

      <TypeToggle value={type} onChange={(t) => (setType(t), setCategoryId(""))} />

      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-heading text-2xl text-muted-foreground">$</span>
        <Input
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="h-14 pl-10 font-heading text-2xl font-semibold tabular"
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div className="grid gap-2">
          <Label htmlFor="tx-date">Fecha</Label>
          <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>

      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" rows={2} maxLength={200} />

      <DialogFooter className="gap-2 sm:justify-between">
        {tx ? (
          <ConfirmDialog
            title="¿Eliminar este movimiento?"
            onConfirm={() => remove.mutate(tx.id, { onSuccess: onDone })}
            trigger={
              <Button type="button" variant="destructive">
                <Trash2Icon />
                Eliminar
              </Button>
            }
          />
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending || !validCategory || !(value > 0)}>
            {save.isPending && <Loader2Icon className="animate-spin" />}
            Guardar
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
