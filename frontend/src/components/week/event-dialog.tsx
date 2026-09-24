"use client";

import { addHours, endOfDay, format, parseISO, startOfDay } from "date-fns";
import { Loader2Icon, MapPinIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { useDeleteEvent, useSaveEvent } from "@/lib/queries/events";
import type { CalendarEvent, EventCategory } from "@/lib/types";

/** Lo que abre el diálogo: un evento existente o un horario vacío. */
export type EventDraft = { event: CalendarEvent } | { start: Date };

interface EventDialogProps {
  draft: EventDraft | null;
  onClose: () => void;
}

export function EventDialog({ draft, onClose }: EventDialogProps) {
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
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
        className="h-11 text-base"
        required
        autoFocus
      />

      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <div className="grid gap-2">
          <Label htmlFor="event-date">Día</Label>
          <Input id="event-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <label className="flex h-9 items-center gap-2 text-sm">
          <Switch checked={allDay} onCheckedChange={setAllDay} />
          Todo el día
        </label>
      </div>

      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="event-start">Empieza</Label>
            <Input id="event-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
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
          {invalidRange && <p className="col-span-2 -mt-1 text-xs text-destructive">Tiene que terminar después de empezar.</p>}
        </div>
      )}

      <div className="grid gap-2">
        <Label>Categoría</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EVENT_CATEGORIES).map(([key, { label, color }]) => (
              <SelectItem key={key} value={key}>
                <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <MapPinIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lugar (opcional)" className="pl-9" />
      </div>

      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas" rows={3} />

      <DialogFooter className="gap-2 sm:justify-between">
        {existing ? (
          <ConfirmDialog
            title="¿Eliminar este evento?"
            description={`"${existing.title}" se va a borrar de tu calendario.`}
            onConfirm={() => remove.mutate(existing.id, { onSuccess: onDone })}
            trigger={
              <Button type="button" variant="destructive">
                <Trash2Icon />
                Eliminar
              </Button>
            }
          />
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending || invalidRange || !title.trim()}>
            {save.isPending && <Loader2Icon className="animate-spin" />}
            Guardar
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
