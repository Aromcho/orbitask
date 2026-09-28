"use client";

import { useState } from "react";
import { ColorPicker } from "@/components/color-picker";
import { FormFooter } from "@/components/form/form-footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLastValue } from "@/hooks/use-last-value";
import { SWATCHES } from "@/lib/constants";
import { useCreateList, useDeleteList, useUpdateList } from "@/lib/queries/tasks";
import type { TaskList } from "@/lib/types";

interface ListDialogProps {
  /** null = cerrado, "new" = crear, TaskList = editar */
  target: TaskList | "new" | null;
  onClose: () => void;
  /** Cantidad de tareas de la lista (para avisar al borrarla). */
  taskCount?: number;
}

export function ListDialog({ target: current, onClose, taskCount }: ListDialogProps) {
  const target = useLastValue(current);
  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {target && (
          <ListForm key={target === "new" ? "new" : target.id} list={target === "new" ? null : target} taskCount={taskCount} onDone={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ListForm({ list, taskCount = 0, onDone }: { list: TaskList | null; taskCount?: number; onDone: () => void }) {
  const [title, setTitle] = useState(list?.title ?? "");
  const [color, setColor] = useState(list?.color ?? SWATCHES[0]);
  const create = useCreateList();
  const update = useUpdateList();
  const remove = useDeleteList();

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
        <Input id="list-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} enterKeyHint="done" required autoFocus={!list} />
      </div>
      <div className="grid gap-2">
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <FormFooter
        onCancel={onDone}
        pending={create.isPending || update.isPending}
        disabled={!title.trim()}
        remove={
          list
            ? {
                title: `¿Eliminar "${list.title}"?`,
                description: taskCount ? `También se borran sus ${taskCount} tareas.` : "La lista está vacía.",
                onConfirm: () => remove.mutate(list.id, { onSuccess: onDone }),
              }
            : undefined
        }
      />
    </form>
  );
}
