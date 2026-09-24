import { differenceInMinutes, endOfDay, max, min, parseISO, startOfDay } from "date-fns";
import type { CalendarEvent } from "@/lib/types";

export interface PositionedEvent {
  event: CalendarEvent;
  /** Minutos desde las 00:00 del día. */
  startMin: number;
  endMin: number;
  /** Columna asignada y cantidad de columnas del grupo (para eventos superpuestos). */
  column: number;
  columns: number;
}

/**
 * Ubica los eventos con horario de un día. Los que se superponen se reparten
 * en columnas, como en Google Calendar.
 */
export function layoutDayEvents(events: CalendarEvent[], day: Date): PositionedEvent[] {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);

  const items = events
    .filter((e) => !e.allDay)
    .map((event) => {
      const start = max([parseISO(event.start), dayStart]);
      const end = min([parseISO(event.end), dayEnd]);
      return {
        event,
        startMin: differenceInMinutes(start, dayStart),
        endMin: Math.max(differenceInMinutes(end, dayStart), differenceInMinutes(start, dayStart) + 15),
        column: 0,
        columns: 1,
      };
    })
    .filter((e) => e.endMin > 0 && e.startMin < 24 * 60)
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  let cluster: PositionedEvent[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const closeCluster = () => {
    for (const item of cluster) item.columns = columnEnds.length;
    cluster = [];
    columnEnds = [];
  };

  for (const item of items) {
    if (item.startMin >= clusterEnd) closeCluster();
    let column = columnEnds.findIndex((end) => end <= item.startMin);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.endMin);
    } else {
      columnEnds[column] = item.endMin;
    }
    item.column = column;
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  closeCluster();

  return items;
}

/** ¿El evento toca este día? */
export function eventTouchesDay(event: CalendarEvent, day: Date) {
  return parseISO(event.start) <= endOfDay(day) && parseISO(event.end) > startOfDay(day);
}
