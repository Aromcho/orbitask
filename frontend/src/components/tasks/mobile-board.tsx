"use client";

import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";
import { isBefore, isToday, parseISO, startOfToday } from "date-fns";
import { ArrowRightIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon, GripVerticalIcon, PencilIcon, PlusIcon, Trash2Icon, Undo2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCreateHint } from "@/components/mobile/mobile-provider";
import { SwipeRow } from "@/components/mobile/swipe-row";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { PRIORITIES } from "@/lib/constants";
import { fmt } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { TASKS_KEY, useCreateTask, useReorderTasks, useUpdateTask } from "@/lib/queries/tasks";
import { useUndoableDelete } from "@/lib/queries/undo";
import type { Task, TaskList } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MobileBoardProps {
  lists: TaskList[];
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onEditList: (list: TaskList) => void;
  onNewList: () => void;
}

/**
 * Tablero en el celu: una lista a la vez (pestañas arriba), filas deslizables
 * y un campo fijo abajo para ir agregando tareas.
 */
export function MobileBoard({ lists, tasks, onOpenTask, onEditList, onNewList }: MobileBoardProps) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState(lists[0].id);
  const [showDone, setShowDone] = useState(false);
  const [moving, setMoving] = useState<Task | null>(null);
  const [completing, setCompleting] = useState<string[]>([]);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());

  const active = lists.find((l) => l.id === activeId) ?? lists[0];
  useCreateHint({ listId: active.id });

  const updateTask = useUpdateTask();
  const reorder = useReorderTasks();
  const removeTask = useUndoableDelete<Task>({
    queryKey: TASKS_KEY,
    request: (id) => api(`/tasks/${id}`, { method: "DELETE" }),
    message: "Tarea eliminada",
  });

  const listTasks = tasks.filter((t) => t.listId === active.id).sort((a, b) => a.position - b.position);
  const pending = listTasks.filter((t) => !t.done);
  const done = listTasks.filter((t) => t.done);
  const pendingIn = (listId: string) => tasks.filter((t) => t.listId === listId && !t.done).length;

  // La pestaña elegida siempre a la vista
  useEffect(() => {
    chipRefs.current.get(active.id)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active.id]);

  const patchCache = (update: (task: Task) => Task) => queryClient.setQueryData<Task[]>(TASKS_KEY, (old) => old?.map(update));
  const refetch = () => queryClient.invalidateQueries({ queryKey: TASKS_KEY });

  function toggleDone(task: Task) {
    haptic();
    if (task.done) {
      patchCache((t) => (t.id === task.id ? { ...t, done: false } : t));
      updateTask.mutate({ id: task.id, done: false }, { onError: refetch });
      return;
    }
    // Se tacha un instante antes de irse a "Hechas"
    setCompleting((c) => [...c, task.id]);
    setTimeout(() => {
      patchCache((t) => (t.id === task.id ? { ...t, done: true } : t));
      setCompleting((c) => c.filter((id) => id !== task.id));
      updateTask.mutate({ id: task.id, done: true }, { onError: refetch });
    }, 380);
  }

  function moveTo(task: Task, list: TaskList) {
    const position = tasks.filter((t) => t.listId === list.id).length;
    patchCache((t) => (t.id === task.id ? { ...t, listId: list.id, position } : t));
    reorder.mutate([{ id: task.id, listId: list.id, position }]);
    haptic();
    toast.success(`Movida a ${list.title}`);
  }

  // Reordenar arrastrando la manija (solo pendientes; las hechas quedan al final)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function onDragEnd({ active: dragged, over }: DragEndEvent) {
    if (!over || dragged.id === over.id) return;
    const ids = pending.map((t) => t.id);
    const ordered = [...arrayMove(pending, ids.indexOf(String(dragged.id)), ids.indexOf(String(over.id))), ...done];
    const changes = ordered
      .map((t, position) => ({ id: t.id, listId: active.id, position, before: t.position }))
      .filter((c) => c.position !== c.before)
      .map(({ id, listId, position }) => ({ id, listId, position }));
    if (!changes.length) return;
    patchCache((t) => {
      const change = changes.find((c) => c.id === t.id);
      return change ? { ...t, position: change.position } : t;
    });
    reorder.mutate(changes);
  }

  const rowActions = (task: Task) => [
    { label: "Mover", icon: <ArrowRightIcon className="size-5" />, className: "bg-event text-black/80", onClick: () => setMoving(task) },
    { label: "Borrar", icon: <Trash2Icon className="size-5" />, className: "bg-expense text-black/80", onClick: () => removeTask(task.id) },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Pestañas de listas */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5">
        {lists.map((list) => {
          const selected = list.id === active.id;
          return (
            <button
              key={list.id}
              ref={(el) => {
                if (el) chipRefs.current.set(list.id, el);
                else chipRefs.current.delete(list.id);
              }}
              type="button"
              onClick={() => setActiveId(list.id)}
              aria-pressed={selected}
              className={cn(
                "pressable flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition-colors",
                selected ? "bg-card font-semibold text-foreground ring-1 ring-primary/50 backdrop-blur-xl" : "bg-foreground/[0.05] text-muted-foreground",
              )}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: list.color }} />
              {list.title}
              <span className="text-xs tabular opacity-80">{pendingIn(list.id)}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onNewList}
          className="pressable flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-foreground/20 px-4 text-sm text-muted-foreground"
        >
          <PlusIcon className="size-4" />
          Lista
        </button>
      </div>

      <div key={active.id} className="flex flex-col gap-2 animate-in duration-200 fade-in-0 slide-in-from-bottom-1">
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-sm text-muted-foreground">
            {pending.length === 0 ? "Nada pendiente" : pending.length === 1 ? "1 pendiente" : `${pending.length} pendientes`}
            {done.length > 0 && ` · ${done.length} hechas`}
          </p>
          <Button variant="ghost" size="icon-sm" aria-label={`Editar la lista ${active.title}`} onClick={() => onEditList(active)}>
            <PencilIcon />
          </Button>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-foreground/15 px-6 py-10 text-center">
            <p className="font-medium">Todo al día en {active.title} ✨</p>
            <p className="mt-1 text-sm text-muted-foreground">Escribí abajo para agregar una tarea.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={pending.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-2">
                {pending.map((task) => (
                  <SortableRow key={task.id} id={task.id}>
                    {(handle) => (
                      <SwipeRow
                        actions={rowActions(task)}
                        onSwipeRight={() => toggleDone(task)}
                        rightIcon={<CheckIcon className="size-6" strokeWidth={3} />}
                        rightClassName="bg-income text-black/80"
                      >
                        <TaskRow task={task} completing={completing.includes(task.id)} onOpen={onOpenTask} onToggle={toggleDone} handle={handle} />
                      </SwipeRow>
                    )}
                  </SortableRow>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {done.length > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowDone((s) => !s)}
              aria-expanded={showDone}
              className="flex items-center gap-2 self-start rounded-full px-2 py-2 text-sm font-medium text-muted-foreground"
            >
              <ChevronDownIcon className={cn("size-4 transition-transform", !showDone && "-rotate-90")} />
              Hechas · {done.length}
            </button>
            {showDone && (
              <ul className="flex flex-col gap-2 animate-in fade-in-0">
                {done.map((task) => (
                  <li key={task.id}>
                    <SwipeRow
                      actions={[{ label: "Borrar", icon: <Trash2Icon className="size-5" />, className: "bg-expense text-black/80", onClick: () => removeTask(task.id) }]}
                      onSwipeRight={() => toggleDone(task)}
                      rightIcon={<Undo2Icon className="size-6" />}
                      rightClassName="bg-primary text-primary-foreground"
                    >
                      <TaskRow task={task} onOpen={onOpenTask} onToggle={toggleDone} />
                    </SwipeRow>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Espacio para que el campo fijo no tape la última tarea */}
      <div className="h-16" aria-hidden />
      <QuickAdd list={active} />

      <Dialog open={moving !== null} onOpenChange={(open) => !open && setMoving(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mover a…</DialogTitle>
            {moving && <DialogDescription className="truncate">{moving.title}</DialogDescription>}
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {lists
              .filter((l) => l.id !== moving?.listId)
              .map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => {
                    if (moving) moveTo(moving, list);
                    setMoving(null);
                  }}
                  className="pressable flex h-14 items-center gap-3 rounded-2xl bg-foreground/[0.05] px-4 text-left ring-1 ring-foreground/[0.06] active:bg-foreground/10"
                >
                  <span className="size-3 rounded-full" style={{ backgroundColor: list.color }} />
                  <span className="flex-1 font-medium">{list.title}</span>
                  <span className="text-sm text-muted-foreground tabular">{pendingIn(list.id)}</span>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Fila arrastrable: la manija es lo único que arrastra (así el resto scrollea y se desliza). */
function SortableRow({ id, children }: { id: string; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      aria-label="Arrastrar para reordenar"
      onClick={(e) => e.stopPropagation()}
      className="-mr-1.5 flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-muted-foreground/60 active:cursor-grabbing active:text-foreground"
      {...attributes}
      {...listeners}
      // Arrastrar desde la manija no tiene que activar el deslizamiento de la fila
      onPointerDown={(e) => {
        listeners?.onPointerDown?.(e);
        e.stopPropagation();
      }}
    >
      <GripVerticalIcon className="size-5" />
    </button>
  );
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 scale-[1.02] rounded-2xl shadow-2xl shadow-primary/25")}
    >
      {children(handle)}
    </li>
  );
}

interface TaskRowProps {
  task: Task;
  completing?: boolean;
  onOpen: (task: Task) => void;
  onToggle: (task: Task) => void;
  handle?: React.ReactNode;
}

function TaskRow({ task, completing, onOpen, onToggle, handle }: TaskRowProps) {
  const checked = task.done || completing;
  const overdue = task.due && !task.done && isBefore(parseISO(task.due), startOfToday());
  const dueToday = task.due && isToday(parseISO(task.due));
  const hasMeta = task.priority !== "media" || task.due || task.description;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(task)}
      className={cn(
        "flex items-center gap-2 rounded-2xl bg-popover py-2 pr-2 pl-1 ring-1 ring-foreground/10 transition-opacity duration-300",
        completing && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task);
        }}
        aria-label={task.done ? "Marcar como pendiente" : "Marcar como hecha"}
        className="flex size-11 shrink-0 items-center justify-center"
      >
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full border-2 border-foreground/25 transition-all duration-300",
            checked && "scale-110 border-transparent bg-income",
          )}
        >
          {checked && <CheckIcon className="size-3.5 text-black/75" strokeWidth={3} />}
        </span>
      </button>
      <div className="min-w-0 flex-1 py-1">
        <p className={cn("text-[15px] leading-snug transition-colors", checked && "text-muted-foreground line-through")}>{task.title}</p>
        {hasMeta && !task.done && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {task.priority !== "media" && (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium", PRIORITIES[task.priority].className)}>{PRIORITIES[task.priority].label}</span>
            )}
            {task.due && (
              <span
                className={cn(
                  "rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground tabular",
                  overdue && "bg-expense/15 text-expense",
                  dueToday && "bg-primary/15 text-primary",
                )}
              >
                {overdue ? `Venció ${fmt(task.due, "d MMM")}` : dueToday ? "Hoy" : fmt(task.due, "EEE d MMM")}
              </span>
            )}
            {task.description && <span className="line-clamp-1 w-full text-xs text-muted-foreground">{task.description}</span>}
          </div>
        )}
      </div>
      {handle}
    </div>
  );
}

/** Campo fijo abajo: escribís, Enter y seguís con la próxima (el teclado no se cierra). */
function QuickAdd({ list }: { list: TaskList }) {
  const [title, setTitle] = useState("");
  const create = useCreateTask();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = title.trim();
    if (!text) return;
    setTitle("");
    haptic();
    create.mutate({ listId: list.id, title: text }, { onError: () => setTitle(text) });
  }

  return (
    <form
      onSubmit={submit}
      className="fixed inset-x-0 bottom-[calc(max(0.75rem,calc(env(safe-area-inset-bottom)-0.75rem))+4.75rem)] z-30 px-3 md:hidden in-data-[keyboard=open]:bottom-[calc(var(--keyboard-inset)+0.5rem)]"
    >
      <div className="mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-popover/90 p-1.5 pl-4 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.6)] ring-1 ring-foreground/10 backdrop-blur-xl">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: list.color }} />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`Agregar a ${list.title}…`}
          aria-label={`Nueva tarea en ${list.title}`}
          enterKeyHint="send"
          maxLength={200}
          className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="icon-sm" disabled={!title.trim()} aria-label="Agregar tarea">
          <ArrowUpIcon />
        </Button>
      </div>
    </form>
  );
}
