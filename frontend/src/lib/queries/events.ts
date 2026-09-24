"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { CalendarEvent, EventCategory } from "../types";
import { useApiMutation } from "./mutation";

export const EVENTS_KEY = ["events"];

export interface EventInput {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  category: EventCategory;
  location: string;
  notes: string;
}

/** Eventos entre dos fechas (ISO). */
export function useEvents(from: Date, to: Date) {
  const range = { from: from.toISOString(), to: to.toISOString() };
  return useQuery({
    queryKey: [...EVENTS_KEY, range.from, range.to],
    queryFn: () => api<CalendarEvent[]>("/events", { query: range }),
    placeholderData: (previous) => previous, // evita parpadeo al cambiar de semana
  });
}

export function useSaveEvent() {
  return useApiMutation(({ id, ...body }: EventInput & { id?: string }) =>
    id
      ? api<CalendarEvent>(`/events/${id}`, { method: "PATCH", body })
      : api<CalendarEvent>("/events", { method: "POST", body }), { invalidate: [EVENTS_KEY] });
}

export function useDeleteEvent() {
  return useApiMutation((id: string) => api(`/events/${id}`, { method: "DELETE" }), {
    invalidate: [EVENTS_KEY],
    success: "Evento eliminado",
  });
}
