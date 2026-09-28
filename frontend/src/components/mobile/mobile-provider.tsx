"use client";

import { useQueryClient } from "@tanstack/react-query";
import { isSameDay, setHours, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { HabitDialog } from "@/components/habits/habit-dialog";
import { TaskDialog, type TaskTarget } from "@/components/tasks/task-dialog";
import { EventDialog, type EventDraft } from "@/components/week/event-dialog";
import { WishDialog, type WishDraft } from "@/components/wishlist/wish-dialog";
import { WishQuickAdd } from "@/components/wishlist/wish-quick-add";
import { TASK_LISTS_KEY, taskListsQuery } from "@/lib/queries/tasks";
import type { MovementType, TaskList } from "@/lib/types";
import { CreateSheet } from "./create-sheet";
import { MoreSheet } from "./more-sheet";

export type CreateKind = "gasto" | "ingreso" | "tarea" | "evento" | "deseo" | "habito";

const CREATE_KINDS: CreateKind[] = ["gasto", "ingreso", "tarea", "evento", "deseo", "habito"];
const LAST_CREATE_KEY = "orbitask-last-create";

/** Lo que la pantalla actual sabe y el + aprovecha (día elegido en Semana, lista visible en Tareas). */
export interface CreateHints {
  eventDay?: Date;
  listId?: string;
}

interface MobileUI {
  /** Abre directo el formulario para crear algo. */
  create: (kind: CreateKind) => void;
  /** Abre la hoja con las 6 opciones. */
  openCreateMenu: () => void;
  openMore: () => void;
  /** Último tipo creado (para mantener apretado el +). */
  lastCreated: () => CreateKind | null;
  hintsRef: React.RefObject<CreateHints>;
}

const MobileUIContext = createContext<MobileUI | null>(null);

export function useMobileUI() {
  const ui = useContext(MobileUIContext);
  if (!ui) throw new Error("useMobileUI tiene que usarse dentro de <MobileProvider>");
  return ui;
}

/** Deja una pista para el + mientras la pantalla está montada. */
export function useCreateHint(hint: CreateHints) {
  const { hintsRef } = useMobileUI();
  const { eventDay, listId } = hint;
  useEffect(() => {
    hintsRef.current = { eventDay, listId };
    return () => {
      hintsRef.current = {};
    };
  }, [hintsRef, eventDay, listId]);
}

/** Próxima media hora de hoy, o las 9:00 de otro día. */
function defaultEventStart(day?: Date) {
  const now = new Date();
  if (!day || isSameDay(day, now)) {
    const start = new Date(now);
    start.setMinutes(now.getMinutes() < 30 ? 30 : 60, 0, 0);
    return start;
  }
  return setHours(startOfDay(day), 9);
}

function isCreateKind(value: unknown): value is CreateKind {
  return CREATE_KINDS.includes(value as CreateKind);
}

/**
 * Captura rápida y menús del celu. Monta una sola vez los formularios de
 * creación para que el + (o un acceso directo del ícono) los abra desde
 * cualquier pantalla.
 */
export function MobileProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hintsRef = useRef<CreateHints>({});

  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [eventDraft, setEventDraft] = useState<EventDraft | null>(null);
  const [taskTarget, setTaskTarget] = useState<TaskTarget | null>(null);
  const [txTarget, setTxTarget] = useState<{ new: MovementType } | null>(null);
  const [newHabit, setNewHabit] = useState(false);
  const [wishAddOpen, setWishAddOpen] = useState(false);
  const [wishDraft, setWishDraft] = useState<WishDraft | null>(null);

  const create = useCallback(
    (kind: CreateKind) => {
      setMenuOpen(false);
      try {
        localStorage.setItem(LAST_CREATE_KEY, kind);
      } catch {
        // sin storage: no recordamos el último
      }
      switch (kind) {
        case "gasto":
          return setTxTarget({ new: "expense" });
        case "ingreso":
          return setTxTarget({ new: "income" });
        case "evento":
          return setEventDraft({ start: defaultEventStart(hintsRef.current.eventDay) });
        case "habito":
          return setNewHabit(true);
        case "deseo":
          return setWishAddOpen(true);
        case "tarea":
          // La tarea necesita una lista: la visible en Tareas, o la primera
          queryClient
            .fetchQuery(taskListsQuery)
            .then((lists) => {
              if (!lists.length) {
                toast.info("Primero armá tus listas en Tareas");
                return router.push("/tareas");
              }
              const listId = lists.some((l) => l.id === hintsRef.current.listId) ? hintsRef.current.listId! : lists[0].id;
              setTaskTarget({ newInList: listId });
            })
            .catch((error: Error) => toast.error(error.message));
      }
    },
    [queryClient, router],
  );

  // Accesos directos del ícono de la app (manifest): /?crear=gasto
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kind = params.get("crear");
    if (!isCreateKind(kind)) return;
    params.delete("crear");
    window.history.replaceState(null, "", window.location.pathname + (params.size ? `?${params}` : ""));
    // Deferido: evita un setState sincrónico dentro del efecto de montaje
    const id = setTimeout(() => create(kind), 0);
    return () => clearTimeout(id);
  }, [create]);

  const ui = useMemo<MobileUI>(
    () => ({
      create,
      openCreateMenu: () => setMenuOpen(true),
      openMore: () => setMoreOpen(true),
      lastCreated: () => {
        try {
          const last = localStorage.getItem(LAST_CREATE_KEY);
          return isCreateKind(last) ? last : null;
        } catch {
          return null;
        }
      },
      hintsRef,
    }),
    [create],
  );

  const lists = queryClient.getQueryData<TaskList[]>(TASK_LISTS_KEY) ?? [];

  return (
    <MobileUIContext.Provider value={ui}>
      {children}
      <CreateSheet open={menuOpen} onOpenChange={setMenuOpen} onCreate={create} onPasteWish={(draft) => (setMenuOpen(false), setWishDraft(draft))} />
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
      <EventDialog draft={eventDraft} onClose={() => setEventDraft(null)} />
      <TaskDialog target={taskTarget} lists={lists} onClose={() => setTaskTarget(null)} />
      <TransactionDialog target={txTarget} onClose={() => setTxTarget(null)} />
      <HabitDialog target={newHabit ? "new" : null} onClose={() => setNewHabit(false)} />
      <WishQuickAdd open={wishAddOpen} onOpenChange={setWishAddOpen} onDraft={setWishDraft} />
      <WishDialog draft={wishDraft} onClose={() => setWishDraft(null)} />
    </MobileUIContext.Provider>
  );
}
