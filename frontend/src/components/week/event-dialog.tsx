"use client";

import { addHours, addMinutes, endOfDay, format, parseISO, startOfDay } from "date-fns";
import { MapPinIcon } from "lucide-react";
import { useState } from "react";
import { ChoiceChips } from "@/components/form/choice-chips";
import { DateChips } from "@/components/form/date-chips";
import { FormFooter } from "@/components/form/form-footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLastValue } from "@/hooks/use-last-value";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { useDeleteEvent, useSaveEvent } from "@/lib/queries/events";
import type { CalendarEvent, EventCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Lo que abre el diálogo: un evento existente o un horario vacío. */
export type EventDraft = { event: CalendarEvent } | { start: Date };

interface EventDialogProps {
  draft: EventDraft | null;
  onClose: () => void;
}

const DURATIONS = [
  { label: "30 min", minutes: 30 },
  { label: "1 h", minutes: 60 },
  { label: "1 h 30", minutes: 90 },
  { label: "2 h", minutes: 120 },
];

const CATEGORY_OPTIONS = Object.entries(EVENT_CATEGORIES).map(([value, { label, color }]) => ({
  value: value as EventCategory,
  label,
  color,
}));

export function EventDialog({ draft: current, onClose }: EventDialogProps) {
  const draft = useLastValue(current);
  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* key: reinicia el formulario cada vez que se abre con otro evento */}
        {draft && <EventForm key={"event" in draft ? draft.event.id : draft.start.toISOString()} draft={draft} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EventForm({ draft, onDone }: { draft: EventDraft; onDone: () => void }) {
  const existing = "event" in draft ? draft.event : null;
  const initialStart = "event" in draft ? parseISO(draft.event.start) : draft.start;
  const initialEnd = "event" in draft ? parseISO(draft.event.end) : addHours(draft.start, 1);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(format(initialStart, "yyyy-MM-dd"));
  const [allDay, setAllDay] = useState(existing?.allDay ?? false);
  const [startTime, setStartTime] = useState(format(initialStart, "HH:mm"));
  const [endTime, setEndTime] = useState(format(initialEnd, "HH:mm"));
  const [category, setCategory] = useState<EventCategory>(existing?.category ?? "personal");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const save = useSaveEvent();
  const remove = useDeleteEvent();
  const invalidRange = !allDay && endTime <= startTime;

  // Duración elegida con un chip: mueve el fin desde el inicio (sin pasar de medianoche)
  const minutesBetween = (a: string, b: string) => {
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    return bh * 60 + bm - (ah * 60 + am);
  };
  const duration = minutesBetween(startTime, endTime);
  function applyDuration(minutes: number) {
    const start = parseISO(`${date}T${startTime}`);
    const end = addMinutes(start, minutes);
    setEndTime(format(end, "yyyy-MM-dd") === date ? format(end, "HH:mm") : "23:59");
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const day = parseISO(date);
    const start = allDay ? startOfDay(day) : parseISO(`${date}T${startTime}`);
    const end = allDay ? endOfDay(day) : parseISO(`${date}T${endTime}`);
    save.mutate(
      {
        id: existing?.id,
        title: title.trim(),
        start: start.toISOString(),
        end: end.toISOString(),
        allDay,
        category,
        location: location.trim(),
        notes: notes.trim(),
      },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{existing ? "Editar evento" : "Nuevo evento"}</DialogTitle>
      </DialogHeader>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="¿Qué tenés que hacer?"
        className="h-11 text-base touch:h-12"
        enterKeyHint="done"
        required
        autoFocus={!existing}
      />

      <div className="grid gap-2">
        <Label htmlFor="event-date">Día</Label>
        <DateChips id="event-date" value={date} onChange={(d) => d && setDate(d)} />
      </div>

      <label className="flex items-center justify-between gap-3 text-sm">
        Todo el día
        <Switch checked={allDay} onCheckedChange={setAllDay} />
      </label>

      {!allDay && (
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="event-start">Empieza</Label>
              <Input
                id="event-start"
                type="time"
                value={startTime}
                onChange={(e) => {
                  // Al mover el inicio, el evento conserva su duración
                  const keep = duration > 0 ? duration : 60;
                  setStartTime(e.target.value);
                  if (e.target.value) {
                    const end = addMinutes(parseISO(`${date}T${e.target.value}`), keep);
                    setEndTime(format(end, "yyyy-MM-dd") === date ? format(end, "HH:mm") : "23:59");
                  }
                }}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-end">Termina</Label>
              <Input
                id="event-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                aria-invalid={invalidRange}
                required
              />
            </div>
          </div>
          {invalidRange && <p className="-mt-1 text-xs text-destructive">Tiene que terminar después de empezar.</p>}
          <div className="flex flex-wrap gap-2" aria-label="Duración">
            {DURATIONS.map((d) => (
              <button
                key={d.minutes}
                type="button"
                onClick={() => applyDuration(d.minutes)}
                className={cn(
                  "pressable h-8 rounded-full border border-input px-3 text-sm hover:bg-muted touch:h-9",
                  duration === d.minutes && "border-primary/60 bg-primary/15 text-primary",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <Label>Categoría</Label>
        <ChoiceChips label="Categoría" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
      </div>

      <div className="relative">
        <MapPinIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lugar (opcional)" className="pl-9 touch:pl-9" />
      </div>

      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas" rows={2} />

      <FormFooter
        onCancel={onDone}
        pending={save.isPending}
        disabled={invalidRange || !title.trim()}
        remove={
          existing
            ? {
                title: "¿Eliminar este evento?",
                description: `"${existing.title}" se va a borrar de tu calendario.`,
                onConfirm: () => remove.mutate(existing.id, { onSuccess: onDone }),
              }
            : undefined
        }
      />
    </form>
  );
}
