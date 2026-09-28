"use client";

import { useState } from "react";
import { ColorPicker } from "@/components/color-picker";
import { FormFooter } from "@/components/form/form-footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLastValue } from "@/hooks/use-last-value";
import { SWATCHES } from "@/lib/constants";
import { useDeleteCategory, useSaveCategory } from "@/lib/queries/finance";
import type { Category, MovementType } from "@/lib/types";
import { TypeToggle } from "./type-toggle";

interface CategoryDialogProps {
  target: Category | "new" | null;
  onClose: () => void;
  /** Tipo con el que arranca una categoría nueva. */
  defaultType?: MovementType;
  /** Se llama con la categoría guardada (ej: para dejarla elegida en un movimiento). */
  onSaved?: (category: Category) => void;
}

export function CategoryDialog({ target: current, onClose, defaultType, onSaved }: CategoryDialogProps) {
  const target = useLastValue(current);
  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {target && (
          <CategoryForm
            key={target === "new" ? "new" : target.id}
            category={target === "new" ? null : target}
            defaultType={defaultType}
            onSaved={onSaved}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CategoryFormProps {
  category: Category | null;
  defaultType?: MovementType;
  onSaved?: (category: Category) => void;
  onDone: () => void;
}

function CategoryForm({ category, defaultType = "expense", onSaved, onDone }: CategoryFormProps) {
  const [type, setType] = useState<MovementType>(category?.type ?? defaultType);
  const [name, setName] = useState(category?.name ?? "");
  const [emoji, setEmoji] = useState(category?.emoji ?? "💸");
  const [color, setColor] = useState(category?.color ?? SWATCHES[0]);
  const save = useSaveCategory();
  const remove = useDeleteCategory();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate(
      { id: category?.id, type, name: name.trim(), emoji, color },
      {
        onSuccess: (saved) => {
          onSaved?.(saved);
          onDone();
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{category ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
      </DialogHeader>
      {/* El tipo solo se elige al crearla */}
      {!category && <TypeToggle value={type} onChange={setType} />}
      <div className="grid gap-2">
        <Label htmlFor="cat-name">Nombre</Label>
        <div className="flex gap-2">
          <Input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-14 text-center text-lg touch:w-14 touch:px-0"
            maxLength={4}
            aria-label="Emoji"
          />
          <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} enterKeyHint="done" required autoFocus={!category} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <FormFooter
        onCancel={onDone}
        pending={save.isPending}
        disabled={!name.trim()}
        remove={
          category
            ? {
                title: `¿Eliminar "${category.name}"?`,
                description: "Solo se puede si no tiene movimientos.",
                onConfirm: () => remove.mutate(category.id, { onSuccess: onDone }),
              }
            : undefined
        }
      />
    </form>
  );
}
