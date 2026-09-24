"use client";

import { PlusIcon, SquareKanbanIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Board } from "@/components/tasks/board";
import { ListDialog } from "@/components/tasks/list-dialog";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useApiMutation } from "@/lib/queries/mutation";
import { TASK_LISTS_KEY, useTaskLists, useTasks } from "@/lib/queries/tasks";
import type { Task, TaskList } from "@/lib/types";

const STARTER_LISTS = [
  { title: "Por hacer", color: "#8b7cf6" },
  { title: "En curso", color: "#38bdf8" },
  { title: "Hecho", color: "#2dd4bf" },
];

export default function TareasPage() {
  const { data: lists, isLoading: loadingLists } = useTaskLists();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [listTarget, setListTarget] = useState<TaskList | "new" | null>(null);

  const createStarter = useApiMutation(
    async () => {
      for (const list of STARTER_LISTS) await api("/task-lists", { method: "POST", body: list });
    },
    { invalidate: [TASK_LISTS_KEY] },
  );

  // Buscamos la tarea en el cache para que el diálogo siempre muestre lo último.
  const openTask: Task | null = tasks.find((t) => t.id === openTaskId) ?? null;
  const pending = tasks.filter((t) => !t.done).length;

  return (
    <>
      <PageHeader
        title="Tareas"
        description={lists?.length ? `${pending} pendientes · arrastrá las tarjetas entre listas` : undefined}
        actions={
          lists?.length ? (
            <Button variant="outline" onClick={() => setListTarget("new")}>
              <PlusIcon />
              Nueva lista
            </Button>
          ) : null
        }
      />

      {loadingLists || loadingTasks ? (
        <div className="flex gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-80 w-[300px] rounded-xl" />
          ))}
        </div>
      ) : !lists?.length ? (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10 backdrop-blur-xl">
          <EmptyState
            icon={SquareKanbanIcon}
            title="Tu tablero está vacío"
            description="Empezá con las listas clásicas o creá las tuyas."
            action={
              <div className="flex gap-2">
                <Button onClick={() => createStarter.mutate()} disabled={createStarter.isPending}>
                  Crear Por hacer · En curso · Hecho
                </Button>
                <Button variant="outline" onClick={() => setListTarget("new")}>
                  Lista vacía
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <Board lists={lists} tasks={tasks} onOpenTask={(t) => setOpenTaskId(t.id)} onEditList={setListTarget} />
      )}

      <TaskDialog task={openTask} lists={lists ?? []} onClose={() => setOpenTaskId(null)} />
      <ListDialog target={listTarget} onClose={() => setListTarget(null)} />
    </>
  );
}
