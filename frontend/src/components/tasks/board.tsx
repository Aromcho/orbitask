"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { TASKS_KEY, useCreateTask, useDeleteList, useReorderTasks, useUpdateTask } from "@/lib/queries/tasks";
import type { Task, TaskList } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SortableTaskCard, TaskCard } from "./task-card";

/** listId → ids de tareas, en orden. */
type Columns = Record<string, string[]>;

function buildColumns(lists: TaskList[], tasks: Task[]): Columns {
  const columns: Columns = Object.fromEntries(lists.map((l) => [l.id, []]));
  for (const task of [...tasks].sort((a, b) => a.position - b.position)) {
    columns[task.listId]?.push(task.id);
  }
  return columns;
}

interface BoardProps {
  lists: TaskList[];
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onEditList: (list: TaskList) => void;
}

export function Board({ lists, tasks, onOpenTask, onEditList }: BoardProps) {
  const queryClient = useQueryClient();
  const reorder = useReorderTasks();
  const updateTask = useUpdateTask();

  const serverColumns = useMemo(() => buildColumns(lists, tasks), [lists, tasks]);
  // Solo mientras se arrastra usamos una copia local; el resto del tiempo manda el servidor.
  const [dragColumns, setDragColumns] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const columns = dragColumns ?? serverColumns;

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findColumn = (id: string) => (id in columns ? id : Object.keys(columns).find((key) => columns[key].includes(id)));

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setDragColumns(serverColumns);
  }

  // Al pasar sobre otra columna, movemos la tarjeta ahí (para que se vea el hueco).
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = findColumn(String(active.id));
    const to = findColumn(String(over.id));
    if (!from || !to || from === to) return;

    setDragColumns((current) => {
      const prev = current ?? serverColumns;
      const overIndex = prev[to].indexOf(String(over.id));
      const index = overIndex === -1 ? prev[to].length : overIndex;
      return {
        ...prev,
        [from]: prev[from].filter((id) => id !== active.id),
        [to]: [...prev[to].slice(0, index), String(active.id), ...prev[to].slice(index)],
      };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return setDragColumns(null);

    const column = findColumn(String(active.id));
    if (!column) return setDragColumns(null);
    let next = columns;
    const oldIndex = columns[column].indexOf(String(active.id));
    const newIndex = columns[column].indexOf(String(over.id));
    if (newIndex !== -1 && oldIndex !== newIndex) {
      next = { ...columns, [column]: arrayMove(columns[column], oldIndex, newIndex) };
    }

    // Solo mandamos las tarjetas que cambiaron de lista o de posición.
    const changes = Object.entries(next).flatMap(([listId, ids]) =>
      ids
        .map((id, position) => ({ id, listId, position }))
        .filter(({ id, listId: l, position }) => {
          const task = tasksById.get(id);
          return task && (task.listId !== l || task.position !== position);
        }),
    );
    if (changes.length === 0) return setDragColumns(null);

    // Actualización optimista del cache, así no "salta" al soltar.
    queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
      old?.map((t) => {
        const change = changes.find((c) => c.id === t.id);
        return change ? { ...t, listId: change.listId, position: change.position } : t;
      }),
    );
    setDragColumns(null);
    reorder.mutate(changes);
  }

  const activeTask = activeId ? tasksById.get(activeId) : undefined;
  const toggleDone = (task: Task) => updateTask.mutate({ id: task.id, done: !task.done });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setDragColumns(null);
      }}
    >
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
        {lists.map((list) => (
          <Column
            key={list.id}
            list={list}
            tasks={(columns[list.id] ?? []).map((id) => tasksById.get(id)).filter((t): t is Task => !!t)}
            onOpenTask={onOpenTask}
            onToggleDone={toggleDone}
            onEdit={() => onEditList(list)}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180 }}>{activeTask && <TaskCard task={activeTask} overlay />}</DragOverlay>
    </DndContext>
  );
}

interface ColumnProps {
  list: TaskList;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  onEdit: () => void;
}

function Column({ list, tasks, onOpenTask, onToggleDone, onEdit }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: list.id });
  const deleteList = useDeleteList();
  const pending = tasks.filter((t) => !t.done).length;

  return (
    <section
      className={cn(
        "flex max-h-[calc(100svh-12rem)] w-[300px] shrink-0 snap-start flex-col rounded-xl bg-card ring-1 ring-foreground/10 backdrop-blur-xl transition-shadow",
        isOver && "ring-primary/50",
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: list.color }} />
        <h2 className="flex-1 truncate font-sans text-sm font-semibold">{list.title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular">{pending}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Opciones de la lista">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon />
              Editar
            </DropdownMenuItem>
            <ConfirmDialog
              title={`¿Eliminar "${list.title}"?`}
              description={`También se borran sus ${tasks.length} tareas.`}
              onConfirm={() => deleteList.mutate(list.id)}
              trigger={
                <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                  <Trash2Icon />
                  Eliminar
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div ref={setNodeRef} className="flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onOpen={onOpenTask} onToggleDone={onToggleDone} />
          ))}
        </SortableContext>
      </div>

      <AddTask listId={list.id} />
    </section>
  );
}

function AddTask({ listId }: { listId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const create = useCreateTask();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    create.mutate({ listId, title: title.trim() }, { onSuccess: () => setTitle("") });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-3 mb-3 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <PlusIcon className="size-4" />
        Agregar tarea
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 px-3 pb-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        onBlur={() => !title && setOpen(false)}
        placeholder="Título de la tarea…"
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!title.trim() || create.isPending}>
          Agregar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
