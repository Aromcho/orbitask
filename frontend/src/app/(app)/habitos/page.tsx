"use client";

import { addDays, format, isAfter, isSameDay, isToday, startOfToday, startOfWeek } from "date-fns";
import { CheckIcon, FlameIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon, TrophyIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { HabitCard } from "@/components/habits/habit-card";
import { HabitDialog } from "@/components/habits/habit-dialog";
import { HabitHeatmap, HeatmapLegend } from "@/components/habits/habit-heatmap";
import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { celebrateIfDayComplete } from "@/lib/celebrate";
import { fmt, toDay, weekDays } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useCheckins, useDeleteHabit, useHabits, useToggleCheckin } from "@/lib/queries/habits";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

const HEATMAP_WEEKS = 26;
const HEATMAP_WEEKS_MOBILE = 16;

export default function HabitosPage() {
  const today = startOfToday();
  const days = weekDays(today);
  const heatmapStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), -(HEATMAP_WEEKS - 1) * 7);
  const heatmapStartMobile = addDays(startOfWeek(today, { weekStartsOn: 1 }), -(HEATMAP_WEEKS_MOBILE - 1) * 7);

  const { data: habits, isLoading } = useHabits();
  const { data: checkins = [] } = useCheckins(toDay(heatmapStart), toDay(days[6]));
  const toggle = useToggleCheckin();
  const [target, setTarget] = useState<Habit | "new" | null>(null);

  const done = useMemo(() => new Set(checkins.map((c) => `${c.habitId}:${c.date}`)), [checkins]);
  const doneByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of checkins) map.set(c.date, (map.get(c.date) ?? 0) + 1);
    return map;
  }, [checkins]);

  const list = habits ?? [];
  const todayKey = toDay(today);
  const dueToday = list.filter((h) => h.days.includes(today.getDay()));
  const doneToday = dueToday.filter((h) => done.has(`${h.id}:${todayKey}`)).length;
  const best = list.reduce<Habit | null>((top, h) => (!top || h.currentStreak > top.currentStreak ? h : top), null);

  const weekScheduled = list.reduce((sum, h) => sum + days.filter((d) => !isAfter(d, today) && h.days.includes(d.getDay())).length, 0);
  const weekDone = list.reduce(
    (sum, h) => sum + days.filter((d) => !isAfter(d, today) && h.days.includes(d.getDay()) && done.has(`${h.id}:${toDay(d)}`)).length,
    0,
  );
  const weekPercent = weekScheduled ? Math.round((weekDone / weekScheduled) * 100) : 0;

  function onToggle(habit: Habit, day: Date) {
    const checking = !done.has(`${habit.id}:${toDay(day)}`);
    toggle.mutate({ habitId: habit.id, date: toDay(day) });
    // Si con este check se completa el día (solo hoy y hábitos que tocan hoy), festejamos
    if (checking && isSameDay(day, today) && habit.days.includes(today.getDay())) celebrateIfDayComplete(doneToday + 1, dueToday.length);
    else haptic();
  }

  return (
    <PageTransition>
      <PageHeader
        title="Hábitos"
        description={list.length ? `${doneToday} de ${dueToday.length} hechos hoy` : "Construí rachas, un día a la vez."}
        actions={
          <Button onClick={() => setTarget("new")}>
            <PlusIcon />
            Nuevo hábito
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={FlameIcon}
            title="Todavía no tenés hábitos"
            description="Agregá algo simple: tomar agua, leer 10 minutos, caminar. Marcalo cada día y mirá crecer tu racha."
            action={<Button onClick={() => setTarget("new")}>Crear mi primer hábito</Button>}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <StatCard label="Hoy" value={`${doneToday}/${dueToday.length}`} progress={dueToday.length ? doneToday / dueToday.length : 0} color="var(--primary)" />
            <StatCard label="Semana" value={`${weekPercent}%`} progress={weekPercent / 100} color="var(--income)" />
            <Card size="sm" className="justify-center">
              <CardContent className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-3 sm:text-left">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-streak/15 text-streak sm:size-11">
                  <TrophyIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Mejor racha</p>
                  <p className="truncate font-heading text-lg font-semibold tabular">{best && best.currentStreak > 0 ? `${best.currentStreak} d` : "—"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Celu: una tarjeta por hábito */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {list.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                days={days}
                isDone={(d) => done.has(`${habit.id}:${toDay(d)}`)}
                onToggle={(d) => onToggle(habit, d)}
                onEdit={() => setTarget(habit)}
              />
            ))}
          </div>

          {/* Escritorio: tabla de la semana */}
          <Card className="hidden py-0 md:flex">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hábito</th>
                    {days.map((d) => (
                      <th key={d.toISOString()} className="w-14 py-3 text-center font-normal">
                        <div className={cn("text-[11px] text-muted-foreground uppercase", isToday(d) && "text-primary")}>{fmt(d, "EEE")}</div>
                        <div className={cn("font-heading font-semibold tabular", isToday(d) && "text-primary")}>{format(d, "d")}</div>
                      </th>
                    ))}
                    <th className="w-24 px-4 py-3 text-right font-medium text-muted-foreground">Racha</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((habit) => (
                    <HabitRow
                      key={habit.id}
                      habit={habit}
                      days={days}
                      isDone={(d) => done.has(`${habit.id}:${toDay(d)}`)}
                      onToggle={(d) => onToggle(habit, d)}
                      onEdit={() => setTarget(habit)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div>
                <CardTitle>
                  <span className="md:hidden">Últimas {HEATMAP_WEEKS_MOBILE} semanas</span>
                  <span className="hidden md:inline">Últimos {Math.round(HEATMAP_WEEKS / 4.3)} meses</span>
                </CardTitle>
                <CardDescription>Cada cuadrito es un día: cuanto más intenso, más hábitos cumpliste.</CardDescription>
              </div>
              <HeatmapLegend />
            </CardHeader>
            <CardContent>
              <div className="md:hidden">
                <HabitHeatmap start={heatmapStartMobile} weeks={HEATMAP_WEEKS_MOBILE} habits={list} doneByDay={doneByDay} fluid />
              </div>
              <div className="hidden md:block">
                <HabitHeatmap start={heatmapStart} weeks={HEATMAP_WEEKS} habits={list} doneByDay={doneByDay} />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <HabitDialog target={target} onClose={() => setTarget(null)} />
    </PageTransition>
  );
}

/** Dato con un anillo de progreso (0 a 1). */
function StatCard({ label, value, progress, color }: { label: string; value: string; progress: number; color: string }) {
  const degrees = Math.round(Math.min(1, Math.max(0, progress)) * 360);
  return (
    <Card size="sm" className="justify-center">
      <CardContent className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-3 sm:text-left">
        <span
          aria-hidden
          className="size-10 shrink-0 rounded-full transition-[background] duration-500 [mask:radial-gradient(circle,transparent_55%,#000_57%)] sm:size-11"
          style={{ background: `conic-gradient(${color} ${degrees}deg, color-mix(in oklab, var(--foreground) 10%, transparent) 0)` }}
        />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-heading text-lg font-semibold tabular">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface HabitRowProps {
  habit: Habit;
  days: Date[];
  isDone: (day: Date) => boolean;
  onToggle: (day: Date) => void;
  onEdit: () => void;
}

function HabitRow({ habit, days, isDone, onToggle, onEdit }: HabitRowProps) {
  const remove = useDeleteHabit();
  const today = startOfToday();

  return (
    <tr className="group border-b last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${habit.color}26` }}>
            {habit.emoji}
          </span>
          <span className="font-medium">{habit.name}</span>
        </div>
      </td>
      {days.map((day) => {
        const scheduled = habit.days.includes(day.getDay());
        const future = isAfter(day, today);
        const checked = isDone(day);
        return (
          <td key={day.toISOString()} className="py-3 text-center">
            <button
              type="button"
              disabled={future}
              onClick={() => onToggle(day)}
              aria-label={`${checked ? "Desmarcar" : "Marcar"} ${habit.name} el ${fmt(day, "EEEE d")}`}
              aria-pressed={checked}
              className={cn(
                "mx-auto flex size-9 items-center justify-center rounded-full border-2 transition-all",
                checked ? "scale-100 border-transparent" : "border-foreground/15 hover:border-foreground/40",
                !scheduled && !checked && "border-dashed opacity-40",
                future && "cursor-not-allowed opacity-25 hover:border-foreground/15",
              )}
              style={checked ? { backgroundColor: habit.color, boxShadow: `0 0 16px ${habit.color}66` } : undefined}
            >
              {checked && <CheckIcon className="size-4 text-black/75" strokeWidth={3} />}
            </button>
          </td>
        );
      })}
      <td className="px-4 py-3 text-right">
        <span className={cn("inline-flex items-center gap-1 font-heading font-semibold tabular", habit.currentStreak > 0 ? "text-streak" : "text-muted-foreground")}>
          <FlameIcon className="size-4" />
          {habit.currentStreak}
        </span>
        <p className="text-[11px] text-muted-foreground">máx. {habit.bestStreak}</p>
      </td>
      <td className="pr-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Opciones" className="opacity-60 group-hover:opacity-100">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon />
              Editar
            </DropdownMenuItem>
            <ConfirmDialog
              title={`¿Eliminar "${habit.name}"?`}
              description="Se borra el hábito y todo su historial."
              onConfirm={() => remove.mutate(habit.id)}
              trigger={
                <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                  <Trash2Icon />
                  Eliminar
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
