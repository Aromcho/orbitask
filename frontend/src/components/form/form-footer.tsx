"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface FormFooterProps {
  onCancel: () => void;
  submitLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  /** Si viene, muestra el botón Eliminar (con confirmación). */
  remove?: { title: string; description?: string; onConfirm: () => void };
}

/**
 * Pie de los formularios en diálogo. En el celu queda fijo abajo: Guardar a lo
 * ancho (bien a mano) y Eliminar como ícono; Cancelar sobra porque la hoja se
 * cierra deslizando o tocando afuera.
 */
export function FormFooter({ onCancel, submitLabel = "Guardar", pending, disabled, remove }: FormFooterProps) {
  return (
    <DialogFooter className="gap-2 sm:justify-between">
      {remove ? (
        <ConfirmDialog
          title={remove.title}
          description={remove.description}
          onConfirm={remove.onConfirm}
          trigger={
            <Button type="button" variant="destructive" className="max-md:size-12 max-md:shrink-0 max-md:px-0" aria-label="Eliminar">
              <Trash2Icon />
              <span className="max-md:sr-only">Eliminar</span>
            </Button>
          }
        />
      ) : (
        <span className="max-md:hidden" />
      )}
      <div className="flex gap-2 max-md:flex-1">
        <Button type="button" variant="ghost" className="max-md:hidden" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || disabled} className="max-md:h-12 max-md:flex-1 max-md:text-base">
          {pending && <Loader2Icon className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </DialogFooter>
  );
}
