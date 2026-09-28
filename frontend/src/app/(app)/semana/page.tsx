"use client";

import { addDays, addWeeks, isSameWeek, isToday } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useCreateHint } from "@/components/mobile/mobile-provider";
import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { type AgendaMode, DayAgenda } from "@/components/week/day-agenda";
import { EventDialog, type EventDraft } from "@/components/week/event-dialog";
import { WeekView, weekTitle } from "@/components/week/week-view";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { weekDays } from "@/lib/format";
import { useEvents } from "@/lib/queries/events";
import { cn } from "@/lib/utils";

export default function SemanaPage() {
  // cursor: en el celu es el día elegido; en escritorio define qué semana se ve
  const [cursor, setCursor] = useState(() => new Date());
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [mode, setMode] = useState<AgendaMode>("dia");

  const days = useMemo(() => weekDays(cursor), [cursor]);
  const { data: events = [] } = useEvents(days[0], addDays(days[0], 7));
  const isCurrentWeek = isSameWeek(cursor, new Date(), { weekStartsOn: 1 });
  // El + de la barra crea el evento en el día que estás mirando
  useCreateHint({ eventDay: cursor });

  function newEventNow() {
    const start = new Date();
    start.setMinutes(start.getMinutes() < 30 ? 30 : 60, 0, 0);
    setDraft({ start });
  }

  return (
    <PageTransition>
      <PageHeader
        title="Semana"
        description={weekTitle(days)}
        compactBar={false}
        actions={
          <>
            <div className="flex items-center rounded-lg bg-card p-0.5 ring-1 ring-foreground/10 backdrop-blur-xl">
              <Button variant="ghost" size="icon-sm" aria-label="Semana anterior" onClick={() => setCursor((d) => addWeeks(d, -1))}>
                <ChevronLeftIcon />
              </Button>
              <Button variant="ghost" size="sm" disabled={isCurrentWeek} onClick={() => setCursor(new Date())}>
                Hoy
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Semana siguiente" onClick={() => setCursor((d) => addWeeks(d, 1))}>
                <ChevronRightIcon />
              </Button>
            </div>
            <Button onClick={newEventNow}>
              <PlusIcon />
              Evento
            </Button>
          </>
        }
        mobileActions={
          <>
            {!isToday(cursor) && (
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
                Hoy
              </Button>
            )}
            <div role="radiogroup" aria-label="Vista" className="flex rounded-xl bg-muted p-1">
              {(["dia", "lista"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "h-8 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors",
                    mode === m && "bg-background text-foreground shadow-sm dark:bg-input/40",
                  )}
                >
                  {m === "dia" ? "Día" : "Lista"}
                </button>
              ))}
            </div>
          </>
        }
      />

      <div className="md:hidden">
        <DayAgenda
          days={days}
          selected={cursor}
          onSelectDay={setCursor}
          events={events}
          mode={mode}
          onModeChange={setMode}
          onSelectEvent={(event) => setDraft({ event })}
          onSelectSlot={(start) => setDraft({ start })}
        />
      </div>

      <div className="hidden md:block">
        <WeekView
          days={days}
          events={events}
          onSelectEvent={(event) => setDraft({ event })}
          onSelectSlot={(start) => setDraft({ start })}
        />
      </div>

      <div className="hidden flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground md:flex">
        {Object.values(EVENT_CATEGORIES).map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span className="ml-auto">Tip: hacé clic en un horario vacío para crear un evento.</span>
      </div>

      <EventDialog draft={draft} onClose={() => setDraft(null)} />
    </PageTransition>
  );
}
