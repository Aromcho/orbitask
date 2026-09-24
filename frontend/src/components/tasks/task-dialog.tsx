"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PRIORITIES } from "@/lib/constants";
import { useDeleteTask, useUpdateTask } from "@/lib/queries/tasks";
import type { Priority, Task, TaskList } from "@/lib/types";

interface TaskDialogProps {
  task: Task | null;
  lists: TaskList[];
  onClose: () => void;
}

export function TaskDialog({ task, lists, onClose }: TaskDialogProps) {
  return (
    <Dialog open={task !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {task && <TaskForm key={task.id} task={task} lists={lists} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({ task, lists, onDone }: { task: Task; lists: TaskList[]; onDone: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [due, setDue] = useState(task.due ?? "");
  const [listId, setListId] = useState(task.listId);
  const [done, setDone] = useState(task.done);

  const update = useUpdateTask();
  const remove = useDeleteTask();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    update.mutate(
      { id: task.id, title: title.trim(), description: description.trim(), priority, due: due || null, listId, done },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Editar tarea</DialogTitle>
      </DialogHeader>

      <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 text-base font-medium" required />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles, links, notas…" rows={4} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Prioridad</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={priority}
            onValueChange={(v) => v && setPriority(v as Priority)}
            className="w-full"
          >
            {(["baja", "media", "alta"] as const).map((p) => (
              <ToggleGroupItem key={p} value={p} className="flex-1">
                {PRIORITIES[p].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-due">Fecha límite</Label>
          <Input id="task-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Lista</Label>
          <Select value={listId} onValueChange={setListId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lists.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: list.color }} />
                  {list.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <Switch checked={done} onCheckedChange={setDone} />
          Completada
        </label>
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <ConfirmDialog
          title="¿Eliminar esta tarea?"
          description={`"${task.title}" se va a borrar para siempre.`}
          onConfirm={() => remove.mutate(task.id, { onSuccess: onDone })}
          trigger={
            <Button type="button" variant="destructive">
              <Trash2Icon />
              Eliminar
            </Button>
          }
        />
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" disabled={update.isPending || !title.trim()}>
            {update.isPending && <Loader2Icon className="animate-spin" />}
            Guardar
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
