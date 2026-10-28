"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DateChips } from "@/components/form/date-chips";
import { FormFooter } from "@/components/form/form-footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLastValue } from "@/hooks/use-last-value";
import { useIsMobile } from "@/hooks/use-mobile";
import { haptic } from "@/lib/haptics";
import { capitalize, fmt, parseAmount, todayDay } from "@/lib/format";
import { useCategories, useDeleteTransaction, useSaveTransaction } from "@/lib/queries/finance";
import type { MovementType, Transaction } from "@/lib/types";
import { AmountDisplay, AmountPad } from "./amount-pad";
import { CategoryDialog } from "./category-dialog";
import { CategoryGrid } from "./category-grid";
import { TypeToggle } from "./type-toggle";

interface TransactionDialogProps {
  /** Un movimiento para editar, o { new: tipo } para cargar uno nuevo. */
  target: Transaction | { new: MovementType } | null;
  onClose: () => void;
}

export function TransactionDialog({ target: current, onClose }: TransactionDialogProps) {
  const target = useLastValue(current);
  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {target &&
          ("new" in target ? (
            <TransactionForm key={`new-${target.new}`} tx={null} newType={target.new} onDone={onClose} />
          ) : (
            <TransactionForm key={target.id} tx={target} newType={target.type} onDone={onClose} />
          ))}
      </DialogContent>
    </Dialog>
  );
}

/** Monto guardado (4500.5) → texto del teclado ("4500,5"). */
function toPadText(amount: number) {
  return String(amount).replace(".", ",");
}

function TransactionForm({ tx, newType, onDone }: { tx: Transaction | null; newType: MovementType; onDone: () => void }) {
  const isMobile = useIsMobile();
  const { data: categories = [] } = useCategories();
  const [type, setType] = useState<MovementType>(tx?.type ?? newType);
  const [amount, setAmount] = useState(tx ? toPadText(tx.amount) : "");
  const [categoryId, setCategoryId] = useState(tx?.categoryId ?? "");
  const [date, setDate] = useState(tx?.date ?? todayDay());
  const [note, setNote] = useState(tx?.note ?? "");
  const [showNote, setShowNote] = useState(Boolean(tx?.note));
  const [creatingCategory, setCreatingCategory] = useState(false);
  const save = useSaveTransaction();
  const remove = useDeleteTransaction();

  const options = categories.filter((c) => c.type === type);
  const validCategory = options.some((c) => c.id === categoryId);
  const value = parseAmount(amount);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate(
      { id: tx?.id, type, amount: Math.round(value * 100) / 100, categoryId, date, note: note.trim() },
      {
        onSuccess: () => {
          haptic();
          // Si cae en otro mes, no se ve en el mes actual: avisamos dónde quedó.
          if (date.slice(0, 7) !== todayDay().slice(0, 7)) {
            toast.success(`Guardado en ${capitalize(fmt(date, "MMMM yyyy"))}`, {
              description: "Cambiá de mes en Finanzas para verlo.",
            });
          }
          onDone();
        },
      },
    );
  }

  return (
    <>
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader className="max-md:sr-only">
        <DialogTitle>{tx ? "Editar movimiento" : type === "expense" ? "Nuevo gasto" : "Nuevo ingreso"}</DialogTitle>
      </DialogHeader>

      <TypeToggle value={type} onChange={(t) => (setType(t), setCategoryId(""))} />

      {isMobile ? (
        <AmountDisplay value={amount} type={type} />
      ) : (
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-heading text-2xl text-muted-foreground">$</span>
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0"
            aria-label="Monto"
            className="h-14 pl-10 font-heading text-2xl font-semibold tabular"
            required
            autoFocus
          />
        </div>
      )}

      <div className="grid gap-2">
        <Label className="max-md:sr-only">Categoría</Label>
        {options.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay categorías de {type === "expense" ? "gastos" : "ingresos"}.</p>}
        <CategoryGrid categories={options} value={categoryId} onChange={setCategoryId} onCreate={() => setCreatingCategory(true)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="tx-date" className="sr-only">
          Fecha
        </Label>
        <DateChips id="tx-date" value={date} onChange={(d) => d && setDate(d)} past />
        {!showNote && (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="pressable inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-foreground/20 px-3 text-sm text-muted-foreground hover:bg-muted touch:h-10"
          >
            <PlusIcon className="size-3.5" />
            Nota
          </button>
        )}
      </div>

      {showNote && (
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (opcional): dónde, qué…"
          rows={2}
          maxLength={200}
          autoFocus={!tx && showNote}
        />
      )}

      {isMobile && <AmountPad value={amount} onChange={setAmount} />}

      <FormFooter
        onCancel={onDone}
        submitLabel={tx ? "Guardar" : type === "expense" ? "Guardar gasto" : "Guardar ingreso"}
        pending={save.isPending}
        disabled={!validCategory || !(value > 0)}
        remove={tx ? { title: "¿Eliminar este movimiento?", onConfirm: () => remove.mutate(tx.id, { onSuccess: onDone }) } : undefined}
      />
    </form>
    {/* Fuera del <form>: su submit no tiene que llegar al del movimiento */}
    <CategoryDialog
      target={creatingCategory ? "new" : null}
      defaultType={type}
      onClose={() => setCreatingCategory(false)}
      onSaved={(category) => setCategoryId(category.id)}
    />
    </>
  );
}
