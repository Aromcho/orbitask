"use client";

import { addDays, differenceInMinutes, format, isBefore, isToday, parseISO, startOfToday } from "date-fns";
import { ArrowRightIcon, CalendarDaysIcon, CheckIcon, FlameIcon, GiftIcon, MapPinIcon, SquareKanbanIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMobileUI } from "@/components/mobile/mobile-provider";
import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { WishImage } from "@/components/wishlist/wish-image";
import { useNow } from "@/hooks/use-now";
import { celebrateIfDayComplete } from "@/lib/celebrate";
import { EVENT_CATEGORIES, PRIORITIES } from "@/lib/constants";
import { capitalize, fmt, formatMoney, toDay, toMonth } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useMe } from "@/lib/queries/auth";
import { useEvents } from "@/lib/queries/events";
import { useSummary } from "@/lib/queries/finance";
import { useCheckins, useHabits, useToggleCheckin } from "@/lib/queries/habits";
import { useTasks, useUpdateTask } from "@/lib/queries/tasks";
import { useWishlist } from "@/lib/queries/wishlist";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

function greeting(hour: number) {
  if (hour < 6) return "Buenas noches";
  if (hour < 13) return "Buen día";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default function InicioPage() {
  const now = useNow();
  const today = startOfToday();
  const { data: me } = useMe();
  const { openMore } = useMobileUI();
  const initials = (me?.name ?? "?").slice(0, 2).toUpperCase();

  return (
    <PageTransition>
      <PageHeader
        title={`${greeting(now.getHours())}${me ? `, ${me.name.split(" ")[0]}` : ""}`}
        description={capitalize(fmt(now, "EEEE d 'de' MMMM"))}
        mobileActions={
          <button type="button" onClick={openMore} aria-label="Tu cuenta y preferencias" className="pressable rounded-xl">
            <Avatar className="size-10 rounded-xl">
              <AvatarFallback className="rounded-xl bg-primary/20 font-medium text-primary">{initials}</AvatarFallback>
            </Avatar>
          </button>
        }
      />
      {/* grid-flow-dense: en escritorio "Este mes" sube a la primera fila */}
      <div className="grid gap-4 lg:grid-flow-dense lg:grid-cols-3">
        <TodayEvents today={today} now={now} />
        <TodayHabits today={today} />
        <PendingTasks />
        <MonthMoney />
        <TopWish />
      </div>
    </PageTransition>
  );
}

function SectionLink({ href }: { href: string }) {
  return (
    <Button variant="ghost" size="icon-sm" asChild>
      <Link href={href} aria-label="Ver todo">
        <ArrowRightIcon />
      </Link>
    </Button>
  );
}

function SectionTitle({ href, icon: Icon, tone, children }: { href: string; icon: typeof FlameIcon; tone: string; children: React.ReactNode }) {
  return (
    <CardTitle>
      <Link href={href} className="flex items-center gap-2">
        <Icon className={cn("size-4", tone)} />
        {children}
      </Link>
    </CardTitle>
  );
}

function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 rounded-lg" />
      ))}
    </div>
  );
}

/** "en 25 min", "en 2 h", "ahora" */
function countdown(event: CalendarEvent, now: Date) {
  const start = parseISO(event.start);
  if (!isBefore(now, start)) return "Ahora";
  const minutes = differenceInMinutes(start, now);
  if (minutes < 60) return `En ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest && hours < 3 ? `En ${hours} h ${rest} min` : `En ${hours} h`;
}

function TodayEvents({ today, now }: { today: Date; now: Date }) {
  const { data: events, isLoading } = useEvents(today, addDays(today, 1));
  const list = events ?? [];
  // Lo próximo: lo que está pasando ahora o lo primero que falta
  const next = list.find((e) => !e.allDay && isBefore(now, parseISO(e.end)));
  const rest = list.filter((e) => e !== next);

  return (
    <Card>
      <CardHeader>
        <SectionTitle href="/semana" icon={CalendarDaysIcon} tone="text-event">
          Hoy
        </SectionTitle>
        <CardAction>
          <SectionLink href="/semana" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <RowsSkeleton rows={2} />
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Día libre. Nada agendado 🌿</p>
        ) : (
          <>
            {next && (
              <div className="flex gap-3 rounded-xl bg-foreground/[0.04] p-3">
                <span className="w-1 shrink-0 rounded-full" style={{ backgroundColor: EVENT_CATEGORIES[next.category].color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: EVENT_CATEGORIES[next.category].color }}>
                    {countdown(next, now)}
                  </p>
                  <p className="mt-0.5 truncate font-medium">{next.title}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular">
                    {format(parseISO(next.start), "HH:mm")} – {format(parseISO(next.end), "HH:mm")}
                    {next.location && (
                      <>
                        <MapPinIcon className="ml-1 size-3" />
                        <span className="truncate">{next.location}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
            {rest.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {rest.map((e) => {
                  const past = isBefore(parseISO(e.end), now);
                  return (
                    <li
                      key={e.id}
                      className={cn("flex items-center gap-3 rounded-lg border-l-[3px] bg-foreground/[0.03] px-3 py-2", past && "opacity-50")}
                      style={{ borderColor: EVENT_CATEGORIES[e.category].color }}
                    >
                      <span className="w-12 text-xs text-muted-foreground tabular">{e.allDay ? "Todo" : format(parseISO(e.start), "HH:mm")}</span>
                      <span className="flex-1 truncate text-sm font-medium">{e.title}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TodayHabits({ today }: { today: Date }) {
  const key = toDay(today);
  const { data: habits, isLoading } = useHabits();
  const { data: checkins = [] } = useCheckins(key, key);
  const toggle = useToggleCheckin();
  const due = (habits ?? []).filter((h) => h.days.includes(today.getDay()));
  const done = new Set(checkins.map((c) => c.habitId));
  const doneDue = due.filter((h) => done.has(h.id)).length;

  function onToggle(habitId: string) {
    const checking = !done.has(habitId);
    toggle.mutate({ habitId, date: key });
    if (checking) celebrateIfDayComplete(doneDue + 1, due.length);
    else haptic();
  }

  return (
    <Card>
      <CardHeader>
        <SectionTitle href="/habitos" icon={FlameIcon} tone="text-streak">
          Hábitos de hoy
          {due.length > 0 && <span className="text-sm font-normal text-muted-foreground tabular">{doneDue} de {due.length}</span>}
        </SectionTitle>
        <CardAction>
          <SectionLink href="/habitos" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <RowsSkeleton />
        ) : due.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay hábitos para hoy.</p>
        ) : (
          <>
            {/* Celu: círculos grandes para marcar con el pulgar */}
            <ul className="grid grid-cols-4 gap-x-2 gap-y-3 md:hidden">
              {due.map((h) => {
                const checked = done.has(h.id);
                return (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => onToggle(h.id)}
                      aria-pressed={checked}
                      aria-label={`${checked ? "Desmarcar" : "Marcar"} ${h.name}`}
                      className="pressable flex w-full flex-col items-center gap-1.5"
                    >
                      <span
                        className={cn(
                          "flex size-14 items-center justify-center rounded-full border-2 border-foreground/15 text-2xl transition-all duration-300",
                          checked && "border-transparent",
                        )}
                        style={checked ? { backgroundColor: h.color, boxShadow: `0 0 18px ${h.color}66` } : undefined}
                      >
                        {checked ? <CheckIcon className="size-6 text-black/75" strokeWidth={3} /> : h.emoji}
                      </span>
                      <span className={cn("line-clamp-2 text-center text-xs leading-tight", checked ? "text-muted-foreground" : "text-foreground")}>
                        {h.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <ul className="hidden flex-col gap-1.5 md:flex">
              {due.map((h) => {
                const checked = done.has(h.id);
                return (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => onToggle(h.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-foreground/[0.04]"
                    >
                      <span
                        className={cn("flex size-7 items-center justify-center rounded-full border-2 border-foreground/15 transition-all", checked && "border-transparent")}
                        style={checked ? { backgroundColor: h.color } : undefined}
                      >
                        {checked ? <CheckIcon className="size-3.5 text-black/75" strokeWidth={3} /> : <span className="text-sm">{h.emoji}</span>}
                      </span>
                      <span className={cn("flex-1 text-sm", checked && "text-muted-foreground line-through")}>{h.name}</span>
                      {h.currentStreak > 0 && <span className="text-xs font-medium text-streak tabular">🔥 {h.currentStreak}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MonthMoney() {
  const { data: summary } = useSummary(toMonth(new Date()));
  const top = summary?.byCategory[0];
  return (
    <Card>
      <CardHeader>
        <SectionTitle href="/finanzas" icon={WalletIcon} tone="text-income">
          Este mes
        </SectionTitle>
        <CardAction>
          <SectionLink href="/finanzas" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!summary ? (
          <RowsSkeleton rows={2} />
        ) : (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={cn("font-heading text-3xl font-semibold tabular", summary.balance < 0 ? "text-expense" : "text-income")}>
                {formatMoney(summary.balance)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-income/10 px-3 py-2">
                <p className="text-xs text-muted-foreground">Ingresos</p>
                <p className="font-medium tabular">{formatMoney(summary.income)}</p>
              </div>
              <div className="rounded-lg bg-expense/10 px-3 py-2">
                <p className="text-xs text-muted-foreground">Gastos</p>
                <p className="font-medium tabular">{formatMoney(summary.expense)}</p>
              </div>
            </div>
            {top && (
              <p className="text-xs text-muted-foreground">
                Donde más gastaste: {top.emoji} <span className="text-foreground">{top.name}</span> ({formatMoney(top.total)})
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PendingTasks() {
  const { data: tasks, isLoading } = useTasks();
  const update = useUpdateTask();
  const [completing, setCompleting] = useState<string[]>([]);
  const today = startOfToday();
  const pending = (tasks ?? [])
    .filter((t) => !t.done)
    .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999") || a.position - b.position)
    .slice(0, 6);

  // Se tacha, se desvanece y recién ahí se guarda: se ve el "hecho"
  function complete(id: string) {
    haptic();
    setCompleting((c) => [...c, id]);
    setTimeout(() => {
      update.mutate({ id, done: true }, { onSettled: () => setCompleting((c) => c.filter((x) => x !== id)) });
    }, 450);
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <SectionTitle href="/tareas" icon={SquareKanbanIcon} tone="text-primary">
          Próximas tareas
        </SectionTitle>
        <CardAction>
          <SectionLink href="/tareas" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <RowsSkeleton />
        ) : pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Todo al día ✨</p>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2">
            {pending.map((t) => {
              const overdue = t.due && isBefore(parseISO(t.due), today);
              const dueToday = t.due && isToday(parseISO(t.due));
              const leaving = completing.includes(t.id);
              return (
                <li
                  key={t.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2 transition-all duration-300 hover:bg-foreground/[0.04] touch:min-h-12",
                    leaving && "translate-x-2 opacity-40",
                  )}
                >
                  <Checkbox
                    className="rounded-full"
                    checked={leaving}
                    disabled={leaving}
                    onCheckedChange={() => complete(t.id)}
                    aria-label={`Completar ${t.title}`}
                  />
                  <span className={cn("flex-1 truncate text-sm", leaving && "text-muted-foreground line-through")}>{t.title}</span>
                  {t.priority === "alta" && <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", PRIORITIES.alta.className)}>Alta</span>}
                  {t.due && (
                    <span className={cn("text-xs text-muted-foreground tabular", overdue && "text-expense", dueToday && "text-primary")}>
                      {overdue ? "Vencida" : dueToday ? "Hoy" : fmt(t.due, "d MMM")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TopWish() {
  const { data: wishes = [] } = useWishlist();
  const wish = wishes.find((w) => !w.purchased && w.priority === "alta") ?? wishes.find((w) => !w.purchased);

  return (
    <Card className="group pt-0">
      {wish ? (
        <Link href="/deseos" className="flex flex-col gap-(--card-spacing)">
          <WishImage src={wish.image} alt={wish.title} className="aspect-[16/9] w-full" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
              <GiftIcon className="size-3.5" /> Tu próximo deseo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 font-medium">{wish.title}</p>
            {wish.price !== null && <p className="mt-1 font-heading text-lg font-semibold tabular">{formatMoney(wish.price, wish.currency)}</p>}
          </CardContent>
        </Link>
      ) : (
        <CardContent className="flex h-full flex-col items-center justify-center gap-3 pt-6 text-center">
          <GiftIcon className="size-8 text-primary/60" />
          <p className="text-sm text-muted-foreground">Agregá algo que quieras comprarte.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/deseos">Ir a deseos</Link>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
