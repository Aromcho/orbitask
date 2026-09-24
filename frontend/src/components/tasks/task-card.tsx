"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isBefore, parseISO, startOfToday } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PRIORITIES } from "@/lib/constants";
import { fmt } from "@/lib/format";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onOpen?: (task: Task) => void;
  onToggleDone?: (task: Task) => void;
  overlay?: boolean;
}

export function TaskCard({ task, onOpen, onToggleDone, overlay }: TaskCardProps) {
  const overdue = task.due && !task.done && isBefore(parseISO(task.due), startOfToday());

  return (
    <div
      className={cn(
        "group flex cursor-grab touch-none flex-col gap-2 rounded-lg border bg-popover/80 p-3 text-sm shadow-sm transition-colors select-none hover:border-primary/40 active:cursor-grabbing",
        overlay && "rotate-2 border-primary/50 shadow-xl shadow-primary/20",
      )}
      onClick={() => onOpen?.(task)}
    >
      <div className="flex items-start gap-2.5">
        <Checkbox
          checked={task.done}
          onCheckedChange={() => onToggleDone?.(task)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-0.5 rounded-full"
          aria-label={task.done ? "Marcar como pendiente" : "Marcar como hecha"}
        />
        <p className={cn("flex-1 leading-snug font-medium", task.done && "text-muted-foreground line-through")}>{task.title}</p>
      </div>

      {(task.description || task.due || task.priority !== "media") && (
        <div className="flex flex-wrap items-center gap-1.5 pl-6.5">
          {task.priority !== "media" && (
            <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-medium", PRIORITIES[task.priority].className)}>
              {PRIORITIES[task.priority].label}
            </span>
          )}
          {task.due && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground",
                overdue && "bg-expense/15 text-expense",
              )}
            >
              <CalendarIcon className="size-3" />
              {fmt(task.due, "d MMM")}
            </span>
          )}
          {task.description && <span className="line-clamp-1 w-full text-xs text-muted-foreground">{task.description}</span>}
        </div>
      )}
    </div>
  );
}

/** La misma tarjeta, pero arrastrable. */
export function SortableTaskCard(props: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "opacity-30")}
      {...attributes}
      {...listeners}
    >
      <TaskCard {...props} />
    </div>
  );
}
