"use client";

import { addDays, addWeeks, isSameWeek } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EventDialog, type EventDraft } from "@/components/week/event-dialog";
import { WeekView, weekTitle } from "@/components/week/week-view";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { weekDays } from "@/lib/format";
import { useEvents } from "@/lib/queries/events";

export default function SemanaPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [draft, setDraft] = useState<EventDraft | null>(null);

  const days = useMemo(() => weekDays(cursor), [cursor]);
  const { data: events = [] } = useEvents(days[0], addDays(days[0], 7));
  const isCurrentWeek = isSameWeek(cursor, new Date(), { weekStartsOn: 1 });

  function newEventNow() {
    const start = new Date();
    start.setMinutes(start.getMinutes() < 30 ? 30 : 60, 0, 0);
    setDraft({ start });
  }

  return (
    <>
      <PageHeader
        title="Semana"
        description={weekTitle(days)}
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
      />

      <WeekView
        days={days}
        events={events}
        onSelectEvent={(event) => setDraft({ event })}
        onSelectSlot={(start) => setDraft({ start })}
      />

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {Object.values(EVENT_CATEGORIES).map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span className="ml-auto hidden sm:inline">Tip: hacé clic en un horario vacío para crear un evento.</span>
      </div>

      <EventDialog draft={draft} onClose={() => setDraft(null)} />
    </>
  );
}
