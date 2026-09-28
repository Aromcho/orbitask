"use client";

import { addDays, format, isSameDay, isToday, parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import { MapPinIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNow } from "@/hooks/use-now";
import { useHorizontalSwipe } from "@/hooks/use-swipe";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { capitalize, fmt } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eventTouchesDay, layoutDayEvents } from "./layout-events";

const HOUR_HEIGHT = 60; // px por hora en el celu
const HOURS = Array.from({ length: 24 }, (_, h) => h);

export type AgendaMode = "dia" | "lista";

interface DayAgendaProps {
  days: Date[];
  selected: Date;
  onSelectDay: (day: Date) => void;
  events: CalendarEvent[];
  mode: AgendaMode;
  onModeChange: (mode: AgendaMode) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot: (start: Date) => void;
}

/**
 * Semana en el celu: tira de 7 días arriba y, abajo, un día a ancho completo
 * (deslizá para pasar de día) o la semana entera en lista.
 */
export function DayAgenda({ days, selected, onSelectDay, events, mode, onModeChange, onSelectEvent, onSelectSlot }: DayAgendaProps) {
  const [direction, setDirection] = useState<"left" | "right">("left");
  const timelineRef = useRef<HTMLDivElement>(null);

  const go = (deltaDays: number) => {
    setDirection(deltaDays > 0 ? "left" : "right");
    onSelectDay(addDays(selected, deltaDays));
  };
  const daySwipe = useHorizontalSwipe((dir) => go(dir === "left" ? 1 : -1));
  const weekSwipe = useHorizontalSwipe((dir) => go(dir === "left" ? 7 : -7));

  // Al entrar, la grilla arranca cerca de la hora actual (o a las 8 si no es hoy)
  useEffect(() => {
    const el = timelineRef.current;
    if (!el || el.offsetParent === null) return;
    const hour = isToday(selected) ? Math.max(0, new Date().getHours() - 1) : 8;
    const top = el.getBoundingClientRect().top + window.scrollY + hour * HOUR_HEIGHT - 150;
    window.scrollTo({ top: Math.max(0, top) });
    // solo al montar: después, el scroll es del usuario
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Tira de días: queda fija arriba al scrollear; deslizala para cambiar de semana */}
      <div
        {...weekSwipe.handlers}
        className="sticky top-[calc(env(safe-area-inset-top)+0.5rem)] z-20 grid touch-pan-y grid-cols-7 gap-1 rounded-2xl bg-popover/90 p-1.5 shadow-lg ring-1 ring-foreground/10 backdrop-blur-xl"
      >
        {days.map((day) => {
          const active = isSameDay(day, selected);
          const colors = [...new Set(events.filter((e) => eventTouchesDay(e, day)).map((e) => EVENT_CATEGORIES[e.category].color))].slice(0, 3);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => {
                if (weekSwipe.consumeSwipe()) return;
                setDirection(day > selected ? "left" : "right");
                onSelectDay(day);
              }}
              aria-pressed={active}
              aria-label={capitalize(fmt(day, "EEEE d 'de' MMMM"))}
              className={cn(
                "pressable flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors",
                active ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : isToday(day) && "text-primary",
              )}
            >
              <span className={cn("text-[11px] font-medium uppercase", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{fmt(day, "EEEEE")}</span>
              <span className="font-heading text-lg leading-tight font-semibold tabular">{format(day, "d")}</span>
              <span className="flex h-1.5 gap-0.5">
                {colors.map((color) => (
                  <span key={color} className="size-1.5 rounded-full" style={{ backgroundColor: active ? "currentColor" : color }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {mode === "dia" ? (
        <DayTimeline
          key={selected.toDateString()}
          ref={timelineRef}
          day={selected}
          events={events}
          direction={direction}
          swipe={daySwipe}
          onSelectEvent={onSelectEvent}
          onSelectSlot={onSelectSlot}
        />
      ) : (
        <WeekList
          days={days}
          events={events}
          onSelectEvent={onSelectEvent}
          onOpenDay={(day) => {
            onSelectDay(day);
            onModeChange("dia");
          }}
        />
      )}
    </div>
  );
}

interface DayTimelineProps {
  ref: React.Ref<HTMLDivElement>;
  day: Date;
  events: CalendarEvent[];
  direction: "left" | "right";
  swipe: ReturnType<typeof useHorizontalSwipe>;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectSlot: (start: Date) => void;
}

function DayTimeline({ ref, day, events, direction, swipe, onSelectEvent, onSelectSlot }: DayTimelineProps) {
  const now = useNow();
  const touching = events.filter((e) => eventTouchesDay(e, day));
  const allDay = touching.filter((e) => e.allDay);
  const positioned = layoutDayEvents(touching, day);
  const today = isToday(day);
  const count = touching.length;

  function onSlotClick(event: React.MouseEvent<HTMLDivElement>) {
    if (swipe.consumeSwipe()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const minutes = Math.floor((((event.clientY - rect.top) / HOUR_HEIGHT) * 60) / 30) * 30; // de a media hora
    onSelectSlot(setMinutes(setHours(startOfDay(day), Math.floor(minutes / 60)), minutes % 60));
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 animate-in duration-300 fade-in-0",
        direction === "left" ? "slide-in-from-right-6" : "slide-in-from-left-6",
      )}
    >
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className={cn("font-heading text-lg font-semibold", today && "text-primary")}>
          {today ? "Hoy, " : ""}
          {capitalize(fmt(day, today ? "d 'de' MMMM" : "EEEE d 'de' MMMM"))}
        </h2>
        <span className="text-xs text-muted-foreground">{count === 0 ? "Libre" : count === 1 ? "1 evento" : `${count} eventos`}</span>
      </div>

      {allDay.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allDay.map((event) => {
            const color = EVENT_CATEGORIES[event.category].color;
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelectEvent(event)}
                className="pressable rounded-full px-3 py-1.5 text-sm font-medium"
                style={{ backgroundColor: `${color}2e`, color }}
              >
                {event.title}
              </button>
            );
          })}
        </div>
      )}

      <div ref={ref} {...swipe.handlers} className="relative touch-pan-y rounded-2xl bg-card ring-1 ring-foreground/10 backdrop-blur-xl">
        <div className="relative cursor-cell" style={{ height: 24 * HOUR_HEIGHT }} onClick={onSlotClick}>
          {HOURS.map((h) => (
            <div key={h} className="pointer-events-none absolute inset-x-0 flex" style={{ top: h * HOUR_HEIGHT }}>
              <span className="w-12 -translate-y-1/2 pr-2 text-right text-[11px] text-muted-foreground tabular">{h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}</span>
              <span className={cn("flex-1 border-t border-foreground/[0.07]", h === 0 && "border-transparent")} />
            </div>
          ))}

          {positioned.map(({ event, startMin, endMin, column, columns }) => {
            const color = EVENT_CATEGORIES[event.category].color;
            const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT - 3, 30);
            return (
              <button
                key={event.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEvent(event);
                }}
                className="pressable absolute overflow-hidden rounded-xl border-l-[3px] px-2.5 py-1.5 text-left"
                style={{
                  top: (startMin / 60) * HOUR_HEIGHT + 1.5,
                  height,
                  left: `calc(3.25rem + (100% - 3.75rem) * ${column / columns})`,
                  width: `calc((100% - 3.75rem) / ${columns} - 3px)`,
                  backgroundColor: `${color}2e`,
                  borderColor: color,
                }}
              >
                <p className="truncate text-[13px] leading-tight font-semibold">{event.title}</p>
                {height > 44 && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground tabular">
                    {format(parseISO(event.start), "HH:mm")} – {format(parseISO(event.end), "HH:mm")}
                    {event.location && (
                      <>
                        <MapPinIcon className="ml-1 size-3 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </>
                    )}
                  </p>
                )}
              </button>
            );
          })}

          {today && (
            <div
              className="pointer-events-none absolute right-0 left-11 z-10 flex items-center"
              style={{ top: ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT }}
            >
              <span className="size-2.5 rounded-full bg-expense shadow-[0_0_8px] shadow-expense" />
              <span className="h-0.5 flex-1 bg-expense" />
            </div>
          )}
        </div>
      </div>
      {count === 0 && <p className="text-center text-xs text-muted-foreground">Tocá un horario para agendar algo.</p>}
    </div>
  );
}

interface WeekListProps {
  days: Date[];
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onOpenDay: (day: Date) => void;
}

function WeekList({ days, events, onSelectEvent, onOpenDay }: WeekListProps) {
  return (
    <div className="flex flex-col gap-4 animate-in duration-300 fade-in-0">
      {days.map((day) => {
        const list = events.filter((e) => eventTouchesDay(e, day)).sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start));
        const today = isToday(day);
        return (
          <section key={day.toISOString()} className="flex flex-col gap-1.5">
            <button type="button" onClick={() => onOpenDay(day)} className="flex items-baseline justify-between gap-3 px-1 py-1 text-left">
              <span className={cn("font-heading font-semibold", today && "text-primary")}>
                {capitalize(fmt(day, "EEEE d"))}
                {today && <span className="ml-2 text-xs font-medium">· Hoy</span>}
              </span>
              <span className="text-xs text-muted-foreground">{list.length ? (list.length === 1 ? "1 evento" : `${list.length} eventos`) : "Libre"}</span>
            </button>
            {list.map((event) => {
              const color = EVENT_CATEGORIES[event.category].color;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className="pressable flex items-stretch gap-3 rounded-2xl bg-card p-3 text-left ring-1 ring-foreground/10 backdrop-blur-xl"
                >
                  <span className="w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{event.title}</span>
                    <span className="flex items-center gap-1 truncate text-xs text-muted-foreground tabular">
                      {event.allDay ? "Todo el día" : `${format(parseISO(event.start), "HH:mm")} – ${format(parseISO(event.end), "HH:mm")}`}
                      {event.location && (
                        <>
                          <MapPinIcon className="ml-1 size-3 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
