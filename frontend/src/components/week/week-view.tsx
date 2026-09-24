"use client";

import { format, isToday, parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { capitalize, fmt } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eventTouchesDay, layoutDayEvents } from "./layout-events";

const HOUR_HEIGHT = 52; // px por hora
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const FIRST_VISIBLE_HOUR = 7;

interface WeekViewProps {
  days: Date[];
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot: (start: Date) => void;
}

export function WeekView({ days, events, onSelectEvent, onSelectSlot }: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = useNow();

  // Al entrar, arrancamos mostrando desde las 7:00.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: FIRST_VISIBLE_HOUR * HOUR_HEIGHT - 12 });
  }, []);

  const allDayByDay = days.map((day) => events.filter((e) => e.allDay && eventTouchesDay(e, day)));
  const hasAllDay = allDayByDay.some((list) => list.length > 0);

  function handleColumnClick(day: Date, event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const minutes = ((event.clientY - rect.top) / HOUR_HEIGHT) * 60;
    const rounded = Math.floor(minutes / 30) * 30; // de a media hora
    onSelectSlot(setMinutes(setHours(startOfDay(day), Math.floor(rounded / 60)), rounded % 60));
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10 backdrop-blur-xl">
      <div className="min-w-[760px]">
        {/* Cabecera con los días */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b">
          <div />
          {days.map((day) => (
            <div key={day.toISOString()} className="flex flex-col items-center gap-1 py-3">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{fmt(day, "EEE")}</span>
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full font-heading text-lg font-semibold tabular",
                  isToday(day) && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                )}
              >
                {format(day, "d")}
              </span>
            </div>
          ))}
        </div>

        {/* Eventos de todo el día */}
        {hasAllDay && (
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b">
            <div className="flex items-center justify-end pr-2 text-right text-[10px] leading-tight text-muted-foreground">todo<br />el día</div>
            {allDayByDay.map((list, i) => (
              <div key={i} className="flex flex-col gap-1 border-l p-1">
                {list.map((event) => (
                  <EventChip key={event.id} event={event} onClick={() => onSelectEvent(event)} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Grilla horaria */}
        <div ref={scrollRef} className="relative max-h-[calc(100svh-17rem)] min-h-96 overflow-y-auto">
          <div className="grid grid-cols-[56px_repeat(7,1fr)]" style={{ height: 24 * HOUR_HEIGHT }}>
            {/* Columna de horas */}
            <div className="relative">
              {HOURS.map((h) => (
                <span
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground tabular"
                  style={{ top: h * HOUR_HEIGHT }}
                >
                  {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                </span>
              ))}
            </div>

            {days.map((day) => {
              const positioned = layoutDayEvents(
                events.filter((e) => eventTouchesDay(e, day)),
                day,
              );
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn("relative cursor-cell border-l", today && "bg-primary/[0.04]")}
                  onClick={(e) => handleColumnClick(day, e)}
                >
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="pointer-events-none absolute inset-x-0 border-t border-dashed border-foreground/[0.06] first:border-t-0"
                      style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    />
                  ))}

                  {positioned.map(({ event, startMin, endMin, column, columns }) => {
                    const color = EVENT_CATEGORIES[event.category].color;
                    const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(event);
                        }}
                        className="absolute overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left text-xs transition-[filter,transform] hover:z-10 hover:brightness-125"
                        style={{
                          top: (startMin / 60) * HOUR_HEIGHT + 1,
                          height: Math.max(height - 2, 20),
                          left: `calc(${(column / columns) * 100}% + 2px)`,
                          width: `calc(${100 / columns}% - 4px)`,
                          backgroundColor: `${color}2e`,
                          borderColor: color,
                        }}
                      >
                        <p className="truncate font-medium">{event.title}</p>
                        {height > 34 && (
                          <p className="truncate text-[11px] text-muted-foreground tabular">
                            {format(parseISO(event.start), "HH:mm")} – {format(parseISO(event.end), "HH:mm")}
                            {event.location && ` · ${event.location}`}
                          </p>
                        )}
                      </button>
                    );
                  })}

                  {today && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                      style={{ top: ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT }}
                    >
                      <span className="-ml-1 size-2.5 rounded-full bg-expense" />
                      <span className="h-0.5 flex-1 bg-expense" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const color = EVENT_CATEGORIES[event.category].color;
  return (
    <button
      type="button"
      onClick={onClick}
      className="truncate rounded-md px-2 py-1 text-left text-xs font-medium hover:brightness-125"
      style={{ backgroundColor: `${color}33`, color }}
    >
      {event.title}
    </button>
  );
}

/** Hora actual, actualizada cada minuto (para la línea de "ahora"). */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function weekTitle(days: Date[]) {
  const first = days[0];
  const last = days[6];
  const sameMonth = first.getMonth() === last.getMonth();
  return capitalize(
    sameMonth
      ? `${fmt(first, "d")} – ${fmt(last, "d 'de' MMMM yyyy")}`
      : `${fmt(first, "d MMM")} – ${fmt(last, "d MMM yyyy")}`,
  );
}
