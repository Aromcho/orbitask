"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Priority, Task, TaskList } from "../types";
import { useApiMutation } from "./mutation";

export const TASK_LISTS_KEY = ["task-lists"];
export const TASKS_KEY = ["tasks"];

export interface TaskInput {
  listId?: string;
  title?: string;
  description?: string;
  priority?: Priority;
  due?: string | null;
  done?: boolean;
}

/** Opciones de la query de listas (también sirve para queryClient.fetchQuery). */
export const taskListsQuery = { queryKey: TASK_LISTS_KEY, queryFn: () => api<TaskList[]>("/task-lists") };

export function useTaskLists() {
  return useQuery(taskListsQuery);
}

export function useTasks() {
  return useQuery({ queryKey: TASKS_KEY, queryFn: () => api<Task[]>("/tasks") });
}

export function useCreateList() {
  return useApiMutation((body: { title: string; color?: string }) =>
    api<TaskList>("/task-lists", { method: "POST", body }), { invalidate: [TASK_LISTS_KEY] });
}

export function useUpdateList() {
  return useApiMutation(({ id, ...body }: { id: string; title?: string; color?: string }) =>
    api<TaskList>(`/task-lists/${id}`, { method: "PATCH", body }), { invalidate: [TASK_LISTS_KEY] });
}

export function useDeleteList() {
  return useApiMutation((id: string) => api(`/task-lists/${id}`, { method: "DELETE" }), {
    invalidate: [TASK_LISTS_KEY, TASKS_KEY],
    success: "Lista eliminada",
  });
}

export function useCreateTask() {
  return useApiMutation((body: TaskInput & { listId: string; title: string }) =>
    api<Task>("/tasks", { method: "POST", body }), { invalidate: [TASKS_KEY] });
}

export function useUpdateTask() {
  return useApiMutation(({ id, ...body }: TaskInput & { id: string }) =>
    api<Task>(`/tasks/${id}`, { method: "PATCH", body }), { invalidate: [TASKS_KEY] });
}

export function useDeleteTask() {
  return useApiMutation((id: string) => api(`/tasks/${id}`, { method: "DELETE" }), {
    invalidate: [TASKS_KEY],
  });
}

export function useReorderTasks() {
  return useApiMutation((items: { id: string; listId: string; position: number }[]) =>
    api("/tasks/reorder", { method: "PUT", body: { items } }), { invalidate: [TASKS_KEY] });
}
