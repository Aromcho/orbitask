"use client";

import { useState } from "react";
import { ColorPicker } from "@/components/color-picker";
import { FormFooter } from "@/components/form/form-footer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLastValue } from "@/hooks/use-last-value";
import { SWATCHES, WEEK_ORDER, WEEKDAY_LABELS } from "@/lib/constants";
import { useDeleteHabit, useSaveHabit } from "@/lib/queries/habits";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMOJI_IDEAS = ["💧", "📚", "🏃", "🧘", "💪", "🥗", "😴", "✍️", "🎸", "🧠", "🚭", "🌱"];

interface HabitDialogProps {
  target: Habit | "new" | null;
  onClose: () => void;
}

export function HabitDialog({ target: current, onClose }: HabitDialogProps) {
  const target = useLastValue(current);
  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {target && <HabitForm key={target === "new" ? "new" : target.id} habit={target === "new" ? null : target} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function HabitForm({ habit, onDone }: { habit: Habit | null; onDone: () => void }) {
  const [name, setName] = useState(habit?.name ?? "");
  const [emoji, setEmoji] = useState(habit?.emoji ?? "💧");
  const [color, setColor] = useState(habit?.color ?? SWATCHES[4]);
  const [days, setDays] = useState<string[]>((habit?.days ?? [0, 1, 2, 3, 4, 5, 6]).map(String));
  const save = useSaveHabit();
  const remove = useDeleteHabit();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate({ id: habit?.id, name: name.trim(), emoji, color, days: days.map(Number) }, { onSuccess: onDone });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{habit ? "Editar hábito" : "Nuevo hábito"}</DialogTitle>
        <DialogDescription>Algo chico que quieras hacer seguido. La constancia gana.</DialogDescription>
      </DialogHeader>

      <div className="flex gap-2">
        <Input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="h-11 w-14 text-center text-xl touch:h-12 touch:w-14 touch:px-0"
          maxLength={4}
          aria-label="Emoji"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Tomar 2 litros de agua"
          className="h-11 flex-1 text-base touch:h-12"
          maxLength={80}
          enterKeyHint="done"
          required
          autoFocus={!habit}
        />
      </div>
      <div className="-mt-3 grid grid-cols-6 gap-1 sm:flex sm:flex-wrap">
        {EMOJI_IDEAS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={cn(
              "pressable rounded-lg p-1 text-lg transition-transform hover:scale-125 touch:h-11 touch:text-xl touch:hover:scale-100",
              emoji === e && "bg-primary/15",
            )}
            aria-label={`Usar ${e}`}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        <Label>¿Qué días?</Label>
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={days}
          onValueChange={(v) => v.length > 0 && setDays(v)}
          className="w-full"
          spacing={1}
        >
          {WEEK_ORDER.map((d) => (
            <ToggleGroupItem key={d} value={String(d)} className="min-w-0 flex-1 px-0 text-xs data-[state=on]:bg-primary/15 data-[state=on]:text-primary touch:min-w-0">
              {WEEKDAY_LABELS[d]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-2">
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <FormFooter
        onCancel={onDone}
        pending={save.isPending}
        disabled={!name.trim()}
        remove={
          habit
            ? {
                title: `¿Eliminar "${habit.name}"?`,
                description: "Se borra el hábito y todo su historial.",
                onConfirm: () => remove.mutate(habit.id, { onSuccess: onDone }),
              }
            : undefined
        }
      />
    </form>
  );
}
