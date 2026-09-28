"use client";

import { PlusIcon, SquareKanbanIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Board } from "@/components/tasks/board";
import { ListDialog } from "@/components/tasks/list-dialog";
import { MobileBoard } from "@/components/tasks/mobile-board";
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
    <PageTransition>
      <PageHeader
        title="Tareas"
        description={lists?.length ? `${pending} pendientes` : undefined}
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
        <>
          <div className="flex flex-col gap-2 md:hidden">
            <Skeleton className="h-10 w-2/3 rounded-full" />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
          <div className="hidden gap-4 md:flex">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-80 w-[300px] rounded-xl" />
            ))}
          </div>
        </>
      ) : !lists?.length ? (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10 backdrop-blur-xl">
          <EmptyState
            icon={SquareKanbanIcon}
            title="Tu tablero está vacío"
            description="Empezá con las listas clásicas o creá las tuyas."
            action={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
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
        <>
          <div className="md:hidden">
            <MobileBoard
              lists={lists}
              tasks={tasks}
              onOpenTask={(t) => setOpenTaskId(t.id)}
              onEditList={setListTarget}
              onNewList={() => setListTarget("new")}
            />
          </div>
          <div className="hidden md:block">
            <p className="-mt-3 mb-3 text-sm text-muted-foreground">Arrastrá las tarjetas entre listas.</p>
            <Board lists={lists} tasks={tasks} onOpenTask={(t) => setOpenTaskId(t.id)} onEditList={setListTarget} />
          </div>
        </>
      )}

      <TaskDialog target={openTask} lists={lists ?? []} onClose={() => setOpenTaskId(null)} />
      <ListDialog
        target={listTarget}
        taskCount={listTarget && listTarget !== "new" ? tasks.filter((t) => t.listId === listTarget.id).length : 0}
        onClose={() => setListTarget(null)}
      />
    </PageTransition>
  );
}
