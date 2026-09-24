"use client";

import { addMonths } from "date-fns";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  RepeatIcon,
  ScaleIcon,
  Trash2Icon,
  WalletIcon,
  ZapIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { CategoryDialog } from "@/components/finance/category-dialog";
import { CategoryBreakdown, DailyExpenseChart } from "@/components/finance/charts";
import { RecurringDialog } from "@/components/finance/recurring-dialog";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { capitalize, fmt, formatMoney, toMonth } from "@/lib/format";
import {
  useCategories,
  useDeleteCategory,
  useDeleteRecurring,
  useRecurring,
  useRunRecurring,
  useSaveRecurring,
  useSummary,
  useTransactions,
} from "@/lib/queries/finance";
import type { Category, Recurring, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FinanzasPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const month = toMonth(cursor);
  const isCurrentMonth = month === toMonth(new Date());

  const { data: summary } = useSummary(month);
  const { data: transactions = [] } = useTransactions(month);
  const { data: categories = [] } = useCategories();

  const [txTarget, setTxTarget] = useState<Transaction | "new" | null>(null);

  return (
    <>
      <PageHeader
        title="Finanzas"
        description={capitalize(fmt(cursor, "MMMM yyyy"))}
        actions={
          <>
            <div className="flex items-center rounded-lg bg-card p-0.5 ring-1 ring-foreground/10 backdrop-blur-xl">
              <Button variant="ghost" size="icon-sm" aria-label="Mes anterior" onClick={() => setCursor((d) => addMonths(d, -1))}>
                <ChevronLeftIcon />
              </Button>
              <Button variant="ghost" size="sm" disabled={isCurrentMonth} onClick={() => setCursor(new Date())}>
                Este mes
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Mes siguiente" onClick={() => setCursor((d) => addMonths(d, 1))}>
                <ChevronRightIcon />
              </Button>
            </div>
            <Button onClick={() => setTxTarget("new")}>
              <PlusIcon />
              Movimiento
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Ingresos" value={summary?.income ?? 0} icon={ArrowDownLeftIcon} tone="income" />
        <Kpi label="Gastos" value={summary?.expense ?? 0} icon={ArrowUpRightIcon} tone="expense" />
        <Kpi label="Balance" value={summary?.balance ?? 0} icon={ScaleIcon} tone={(summary?.balance ?? 0) >= 0 ? "income" : "expense"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Gasto diario</CardTitle>
            <CardDescription>Cuánto gastaste cada día del mes</CardDescription>
          </CardHeader>
          <CardContent>
            {summary && summary.expense > 0 ? (
              <DailyExpenseChart daily={summary.daily} />
            ) : (
              <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">Sin gastos este mes 🎉</p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gastos por categoría</CardTitle>
            <CardDescription>En qué se fue la plata</CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.byCategory.length ? (
              <CategoryBreakdown items={summary.byCategory} total={summary.expense} />
            ) : (
              <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">Nada por acá todavía</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="movimientos">
        <TabsList>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="recurrentes">Recurrentes</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>
        <TabsContent value="movimientos">
          <TransactionsList transactions={transactions} categories={categories} onOpen={setTxTarget} onNew={() => setTxTarget("new")} />
        </TabsContent>
        <TabsContent value="recurrentes">
          <RecurringPanel categories={categories} />
        </TabsContent>
        <TabsContent value="categorias">
          <CategoriesPanel categories={categories} />
        </TabsContent>
      </Tabs>

      <TransactionDialog target={txTarget} onClose={() => setTxTarget(null)} />
    </>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof WalletIcon; tone: "income" | "expense" }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-4">
        <div className={cn("flex size-11 items-center justify-center rounded-xl", tone === "income" ? "bg-income/15 text-income" : "bg-expense/15 text-expense")}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate font-heading text-2xl font-semibold tabular">{formatMoney(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface TransactionsListProps {
  transactions: Transaction[];
  categories: Category[];
  onOpen: (tx: Transaction) => void;
  onNew: () => void;
}

function TransactionsList({ transactions, categories, onOpen, onNew }: TransactionsListProps) {
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) map.set(tx.date, [...(map.get(tx.date) ?? []), tx]);
    return [...map.entries()];
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={WalletIcon}
          title="No hay movimientos este mes"
          description="Cargá tus gastos e ingresos para ver a dónde va tu plata."
          action={<Button onClick={onNew}>Cargar el primero</Button>}
        />
      </Card>
    );
  }

  return (
    <Card className="py-2">
      {groups.map(([date, items]) => (
        <div key={date}>
          <p className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground">{capitalize(fmt(date, "EEEE d 'de' MMMM"))}</p>
          <ul>
            {items.map((tx) => {
              const category = byId.get(tx.categoryId);
              return (
                <li key={tx.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(tx)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.04]"
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-base"
                      style={{ backgroundColor: `${category?.color ?? "#94a3b8"}26` }}
                    >
                      {category?.emoji ?? "💸"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{tx.note || category?.name || "Movimiento"}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        {category?.name}
                        {tx.recurringId && <RepeatIcon className="size-3" aria-label="Recurrente" />}
                      </p>
                    </div>
                    <span className={cn("font-heading font-semibold tabular", tx.type === "income" ? "text-income" : "text-foreground")}>
                      {tx.type === "income" ? "+" : "−"}
                      {formatMoney(tx.amount)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </Card>
  );
}

function RecurringPanel({ categories }: { categories: Category[] }) {
  const { data: items = [] } = useRecurring();
  const [target, setTarget] = useState<Recurring | "new" | null>(null);
  const save = useSaveRecurring();
  const remove = useDeleteRecurring();
  const run = useRunRecurring();
  const byId = new Map(categories.map((c) => [c.id, c]));

  const monthlyExpense = items.filter((i) => i.active && i.type === "expense").reduce((s, i) => s + i.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Movimientos recurrentes</CardTitle>
          <CardDescription>
            Se generan solos cada mes (06:00). Gastos fijos activos: <span className="font-medium text-foreground">{formatMoney(monthlyExpense)}</span>
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={run.isPending}
            onClick={() =>
              run.mutate(undefined, {
                onSuccess: ({ created }) => toast.success(created ? `Se generaron ${created} movimientos` : "No había nada pendiente este mes"),
              })
            }
          >
            <ZapIcon />
            Generar ahora
          </Button>
          <Button size="sm" onClick={() => setTarget("new")}>
            <PlusIcon />
            Nuevo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Agregá tu alquiler, sueldo o suscripciones.</p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => {
              const category = byId.get(item.categoryId);
              return (
                <li key={item.id} className={cn("flex items-center gap-3 px-4 py-3", !item.active && "opacity-50")}>
                  <span className="w-12 shrink-0 text-center">
                    <span className="block text-[10px] text-muted-foreground uppercase">día</span>
                    <span className="font-heading text-lg font-semibold tabular">{item.dayOfMonth}</span>
                  </span>
                  <span className="text-lg">{category?.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.note}</p>
                    <p className="text-xs text-muted-foreground">{category?.name}</p>
                  </div>
                  <span className={cn("font-heading font-semibold tabular", item.type === "income" && "text-income")}>{formatMoney(item.amount)}</span>
                  <Switch checked={item.active} onCheckedChange={(active) => save.mutate({ id: item.id, active })} aria-label="Activo" />
                  <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setTarget(item)}>
                    <PencilIcon />
                  </Button>
                  <ConfirmDialog
                    title={`¿Eliminar "${item.note}"?`}
                    description="Los movimientos que ya se generaron no se borran."
                    onConfirm={() => remove.mutate(item.id)}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Eliminar">
                        <Trash2Icon />
                      </Button>
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <RecurringDialog target={target} onClose={() => setTarget(null)} />
    </Card>
  );
}

function CategoriesPanel({ categories }: { categories: Category[] }) {
  const [target, setTarget] = useState<Category | "new" | null>(null);
  const remove = useDeleteCategory();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Categorías</CardTitle>
          <CardDescription>Solo podés borrar las que no tienen movimientos.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setTarget("new")}>
          <PlusIcon />
          Nueva
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {(["expense", "income"] as const).map((type) => (
          <div key={type}>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">{type === "expense" ? "Gastos" : "Ingresos"}</p>
            <ul className="flex flex-col gap-1">
              {categories
                .filter((c) => c.type === type)
                .map((c) => (
                  <li key={c.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-foreground/[0.04]">
                    <span className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${c.color}26` }}>
                      {c.emoji}
                    </span>
                    <span className="flex-1 text-sm">{c.name}</span>
                    <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100" aria-label="Editar" onClick={() => setTarget(c)}>
                      <PencilIcon />
                    </Button>
                    <ConfirmDialog
                      title={`¿Eliminar "${c.name}"?`}
                      onConfirm={() => remove.mutate(c.id)}
                      trigger={
                        <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100" aria-label="Eliminar">
                          <Trash2Icon />
                        </Button>
                      }
                    />
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </CardContent>
      <CategoryDialog target={target} onClose={() => setTarget(null)} />
    </Card>
  );
}
