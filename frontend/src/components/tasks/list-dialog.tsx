"use client";

import { useState } from "react";
import { ColorPicker } from "@/components/color-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SWATCHES } from "@/lib/constants";
import { useCreateList, useUpdateList } from "@/lib/queries/tasks";
import type { TaskList } from "@/lib/types";

interface ListDialogProps {
  /** null = cerrado, "new" = crear, TaskList = editar */
  target: TaskList | "new" | null;
  onClose: () => void;
}

export function ListDialog({ target, onClose }: ListDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {target && <ListForm key={target === "new" ? "new" : target.id} list={target === "new" ? null : target} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ListForm({ list, onDone }: { list: TaskList | null; onDone: () => void }) {
  const [title, setTitle] = useState(list?.title ?? "");
  const [color, setColor] = useState(list?.color ?? SWATCHES[0]);
  const create = useCreateList();
  const update = useUpdateList();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = { title: title.trim(), color };
    if (list) update.mutate({ id: list.id, ...body }, { onSuccess: onDone });
    else create.mutate(body, { onSuccess: onDone });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{list ? "Editar lista" : "Nueva lista"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="list-title">Nombre</Label>
        <Input id="list-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} required autoFocus />
      </div>
      <div className="grid gap-2">
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!title.trim() || create.isPending || update.isPending}>
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}
