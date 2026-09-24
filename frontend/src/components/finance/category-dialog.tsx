"use client";

import { useState } from "react";
import { ColorPicker } from "@/components/color-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SWATCHES } from "@/lib/constants";
import { useSaveCategory } from "@/lib/queries/finance";
import type { Category, MovementType } from "@/lib/types";
import { TypeToggle } from "./type-toggle";

interface CategoryDialogProps {
  target: Category | "new" | null;
  onClose: () => void;
}

export function CategoryDialog({ target, onClose }: CategoryDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {target && <CategoryForm key={target === "new" ? "new" : target.id} category={target === "new" ? null : target} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ category, onDone }: { category: Category | null; onDone: () => void }) {
  const [type, setType] = useState<MovementType>(category?.type ?? "expense");
  const [name, setName] = useState(category?.name ?? "");
  const [emoji, setEmoji] = useState(category?.emoji ?? "💸");
  const [color, setColor] = useState(category?.color ?? SWATCHES[0]);
  const save = useSaveCategory();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate({ id: category?.id, type, name: name.trim(), emoji, color }, { onSuccess: onDone });
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
          <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-14 text-center text-lg" maxLength={4} aria-label="Emoji" />
          <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required autoFocus />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!name.trim() || save.isPending}>
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}
