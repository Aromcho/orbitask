"use client";

import { useState } from "react";
import { ChoiceChips } from "@/components/form/choice-chips";
import { DateChips } from "@/components/form/date-chips";
import { FormFooter } from "@/components/form/form-footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLastValue } from "@/hooks/use-last-value";
import { PRIORITIES } from "@/lib/constants";
import { useCreateTask, useDeleteTask, useUpdateTask } from "@/lib/queries/tasks";
import type { Priority, Task, TaskList } from "@/lib/types";

/** Qué abre el diálogo: una tarea para editar o una nueva en cierta lista. */
export type TaskTarget = Task | { newInList: string };

interface TaskDialogProps {
  target: TaskTarget | null;
  lists: TaskList[];
  onClose: () => void;
}

export function TaskDialog({ target: current, lists, onClose }: TaskDialogProps) {
  const target = useLastValue(current);
  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {target && (
          <TaskForm
            key={"id" in target ? target.id : `new-${target.newInList}`}
            task={"id" in target ? target : null}
            initialListId={"id" in target ? target.listId : target.newInList}
            lists={lists}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface TaskFormProps {
  task: Task | null;
  initialListId: string;
  lists: TaskList[];
  onDone: () => void;
}

function TaskForm({ task, initialListId, lists, onDone }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "media");
  const [due, setDue] = useState(task?.due ?? "");
  const [listId, setListId] = useState(initialListId || lists[0]?.id || "");
  const [done, setDone] = useState(task?.done ?? false);

  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const pending = create.isPending || update.isPending;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = { title: title.trim(), description: description.trim(), priority, due: due || null, listId };
    if (task) update.mutate({ id: task.id, ...body, done }, { onSuccess: onDone });
    else create.mutate(body, { onSuccess: onDone });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
      </DialogHeader>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="¿Qué hay que hacer?"
        className="h-11 text-base font-medium touch:h-12"
        maxLength={200}
        enterKeyHint="done"
        required
        autoFocus={!task}
      />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles, links, notas…" rows={task ? 4 : 2} />

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
            <ToggleGroupItem key={p} value={p} className="flex-1 data-[state=on]:bg-primary/15 data-[state=on]:text-primary">
              {PRIORITIES[p].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="task-due">Fecha límite</Label>
        <DateChips id="task-due" value={due} onChange={setDue} allowEmpty extended />
      </div>

      {lists.length > 1 && (
        <div className="grid gap-2">
          <Label>Lista</Label>
          <ChoiceChips
            label="Lista"
            value={listId}
            onChange={setListId}
            options={lists.map((list) => ({ value: list.id, label: list.title, color: list.color }))}
          />
        </div>
      )}

      {task && (
        <label className="flex items-center justify-between gap-3 text-sm">
          Completada
          <Switch checked={done} onCheckedChange={setDone} />
        </label>
      )}

      <FormFooter
        onCancel={onDone}
        submitLabel={task ? "Guardar" : "Crear tarea"}
        pending={pending}
        disabled={!title.trim() || !listId}
        remove={
          task
            ? {
                title: "¿Eliminar esta tarea?",
                description: `"${task.title}" se va a borrar para siempre.`,
                onConfirm: () => remove.mutate(task.id, { onSuccess: onDone }),
              }
            : undefined
        }
      />
    </form>
  );
}
