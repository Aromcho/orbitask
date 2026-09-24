"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../api";
import type { Habit, HabitCheckin } from "../types";
import { useApiMutation } from "./mutation";

export const HABITS_KEY = ["habits"];
export const CHECKINS_KEY = ["checkins"];

export interface HabitInput {
  name: string;
  emoji: string;
  color: string;
  days: number[];
}

export function useHabits() {
  return useQuery({ queryKey: HABITS_KEY, queryFn: () => api<Habit[]>("/habits") });
}

export function useCheckins(from: string, to: string) {
  return useQuery({
    queryKey: [...CHECKINS_KEY, from, to],
    queryFn: () => api<HabitCheckin[]>("/habits/checkins", { query: { from, to } }),
  });
}

export function useSaveHabit() {
  return useApiMutation(({ id, ...body }: Partial<HabitInput> & { id?: string }) =>
    id
      ? api<Habit>(`/habits/${id}`, { method: "PATCH", body })
      : api<Habit>("/habits", { method: "POST", body }), { invalidate: [HABITS_KEY] });
}

export function useDeleteHabit() {
  return useApiMutation((id: string) => api(`/habits/${id}`, { method: "DELETE" }), {
    invalidate: [HABITS_KEY, CHECKINS_KEY],
    success: "Hábito eliminado",
  });
}

type ToggleResult = { done: boolean; currentStreak: number; bestStreak: number };

/** Marca/desmarca un día. Actualiza la UI al instante (optimistic update). */
export function useToggleCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      api<ToggleResult>(`/habits/${habitId}/toggle`, { method: "POST", body: { date } }),

    onMutate: async ({ habitId, date }) => {
      await queryClient.cancelQueries({ queryKey: CHECKINS_KEY });
      const snapshot = queryClient.getQueriesData<HabitCheckin[]>({ queryKey: CHECKINS_KEY });
      queryClient.setQueriesData<HabitCheckin[]>({ queryKey: CHECKINS_KEY }, (list = []) => {
        const exists = list.some((c) => c.habitId === habitId && c.date === date);
        return exists
          ? list.filter((c) => !(c.habitId === habitId && c.date === date))
          : [...list, { id: `tmp-${habitId}-${date}`, habitId, date }];
      });
      return { snapshot };
    },

    onSuccess: (result, { habitId }) => {
      queryClient.setQueryData<Habit[]>(HABITS_KEY, (habits) =>
        habits?.map((h) =>
          h.id === habitId ? { ...h, currentStreak: result.currentStreak, bestStreak: result.bestStreak } : h,
        ),
      );
    },

    onError: (error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(error.message);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: CHECKINS_KEY }),
  });
}
