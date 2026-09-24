"use client";

import { addDays, format, isBefore, parseISO, startOfToday } from "date-fns";
import { ArrowRightIcon, CalendarDaysIcon, CheckIcon, FlameIcon, GiftIcon, SquareKanbanIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { WishImage } from "@/components/wishlist/wish-image";
import { EVENT_CATEGORIES, PRIORITIES } from "@/lib/constants";
import { capitalize, fmt, formatMoney, toDay, toMonth } from "@/lib/format";
import { useMe } from "@/lib/queries/auth";
import { useEvents } from "@/lib/queries/events";
import { useSummary } from "@/lib/queries/finance";
import { useCheckins, useHabits, useToggleCheckin } from "@/lib/queries/habits";
import { useTasks, useUpdateTask } from "@/lib/queries/tasks";
import { useWishlist } from "@/lib/queries/wishlist";
import { cn } from "@/lib/utils";

function greeting(hour: number) {
  if (hour < 6) return "Buenas noches";
  if (hour < 13) return "Buen día";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default function InicioPage() {
  const now = new Date();
  const today = startOfToday();
  const { data: me } = useMe();

  return (
    <>
      <PageHeader
        title={`${greeting(now.getHours())}${me ? `, ${me.name.split(" ")[0]}` : ""}`}
        description={capitalize(fmt(now, "EEEE d 'de' MMMM"))}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <TodayEvents today={today} />
        <TodayHabits today={today} />
        <MonthMoney />
        <PendingTasks />
        <TopWish />
      </div>
    </>
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

function TodayEvents({ today }: { today: Date }) {
  const { data: events = [] } = useEvents(today, addDays(today, 1));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDaysIcon className="size-4 text-event" /> Hoy
        </CardTitle>
        <CardAction>
          <SectionLink href="/semana" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Día libre. Nada agendado 🌿</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {events.map((e) => {
              const color = EVENT_CATEGORIES[e.category].color;
              const past = isBefore(parseISO(e.end), new Date());
              return (
                <li key={e.id} className={cn("flex items-center gap-3 rounded-lg border-l-[3px] bg-foreground/[0.03] px-3 py-2", past && "opacity-50")} style={{ borderColor: color }}>
                  <span className="w-12 text-xs text-muted-foreground tabular">{e.allDay ? "Todo" : format(parseISO(e.start), "HH:mm")}</span>
                  <span className="flex-1 truncate text-sm font-medium">{e.title}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TodayHabits({ today }: { today: Date }) {
  const key = toDay(today);
  const { data: habits = [] } = useHabits();
  const { data: checkins = [] } = useCheckins(key, key);
  const toggle = useToggleCheckin();
  const due = habits.filter((h) => h.days.includes(today.getDay()));
  const done = new Set(checkins.map((c) => c.habitId));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlameIcon className="size-4 text-streak" /> Hábitos de hoy
          {due.length > 0 && <span className="text-sm font-normal text-muted-foreground tabular">{done.size}/{due.length}</span>}
        </CardTitle>
        <CardAction>
          <SectionLink href="/habitos" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {due.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay hábitos para hoy.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {due.map((h) => {
              const checked = done.has(h.id);
              return (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => toggle.mutate({ habitId: h.id, date: key })}
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
        <CardTitle className="flex items-center gap-2">
          <WalletIcon className="size-4 text-income" /> Este mes
        </CardTitle>
        <CardAction>
          <SectionLink href="/finanzas" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className={cn("font-heading text-3xl font-semibold tabular", (summary?.balance ?? 0) < 0 && "text-expense")}>{formatMoney(summary?.balance ?? 0)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-income/10 px-3 py-2">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="font-medium tabular">{formatMoney(summary?.income ?? 0)}</p>
          </div>
          <div className="rounded-lg bg-expense/10 px-3 py-2">
            <p className="text-xs text-muted-foreground">Gastos</p>
            <p className="font-medium tabular">{formatMoney(summary?.expense ?? 0)}</p>
          </div>
        </div>
        {top && (
          <p className="text-xs text-muted-foreground">
            Donde más gastaste: {top.emoji} <span className="text-foreground">{top.name}</span> ({formatMoney(top.total)})
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PendingTasks() {
  const { data: tasks = [] } = useTasks();
  const update = useUpdateTask();
  const today = startOfToday();
  const pending = tasks
    .filter((t) => !t.done)
    .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999") || a.position - b.position)
    .slice(0, 6);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SquareKanbanIcon className="size-4 text-primary" /> Próximas tareas
        </CardTitle>
        <CardAction>
          <SectionLink href="/tareas" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Todo al día ✨</p>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2">
            {pending.map((t) => {
              const overdue = t.due && isBefore(parseISO(t.due), today);
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-foreground/[0.04]">
                  <Checkbox className="rounded-full" checked={false} onCheckedChange={() => update.mutate({ id: t.id, done: true })} aria-label={`Completar ${t.title}`} />
                  <span className="flex-1 truncate text-sm">{t.title}</span>
                  {t.priority === "alta" && <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", PRIORITIES.alta.className)}>Alta</span>}
                  {t.due && <span className={cn("text-xs text-muted-foreground tabular", overdue && "text-expense")}>{fmt(t.due, "d MMM")}</span>}
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
        <>
          <WishImage src={wish.image} alt={wish.title} className="aspect-[16/9] w-full" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
              <GiftIcon className="size-3.5" /> Tu próximo deseo
            </CardTitle>
            <CardAction>
              <SectionLink href="/deseos" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 font-medium">{wish.title}</p>
            {wish.price !== null && <p className="mt-1 font-heading text-lg font-semibold tabular">{formatMoney(wish.price, wish.currency)}</p>}
          </CardContent>
        </>
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
