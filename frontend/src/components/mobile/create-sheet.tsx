"use client";

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CalendarDaysIcon,
  ClipboardPasteIcon,
  FlameIcon,
  GiftIcon,
  Loader2Icon,
  SquareKanbanIcon,
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { WishDraft } from "@/components/wishlist/wish-dialog";
import { draftFromInput, extractUrl, readClipboard } from "@/components/wishlist/wish-draft";
import { cn } from "@/lib/utils";
import type { CreateKind } from "./mobile-provider";

const OPTIONS: { kind: CreateKind; label: string; icon: typeof FlameIcon; tone: string }[] = [
  { kind: "gasto", label: "Gasto", icon: ArrowUpRightIcon, tone: "bg-expense/15 text-expense" },
  { kind: "ingreso", label: "Ingreso", icon: ArrowDownLeftIcon, tone: "bg-income/15 text-income" },
  { kind: "tarea", label: "Tarea", icon: SquareKanbanIcon, tone: "bg-primary/15 text-primary" },
  { kind: "evento", label: "Evento", icon: CalendarDaysIcon, tone: "bg-event/15 text-event" },
  { kind: "deseo", label: "Deseo", icon: GiftIcon, tone: "bg-[#f472b6]/15 text-[#f472b6]" },
  { kind: "habito", label: "Hábito", icon: FlameIcon, tone: "bg-streak/15 text-streak" },
];

interface CreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (kind: CreateKind) => void;
  /** Deseo armado a partir de un link del portapapeles. */
  onPasteWish: (draft: WishDraft) => void;
}

/** La hoja del +: todo lo que se puede crear, cada cosa en su color. */
export function CreateSheet({ open, onOpenChange, onCreate, onPasteWish }: CreateSheetProps) {
  const [reading, setReading] = useState(false);

  async function pasteWish() {
    const clip = await readClipboard();
    if (!clip || !extractUrl(clip)) return onCreate("deseo");
    setReading(true);
    const draft = await draftFromInput(clip);
    setReading(false);
    onPasteWish(draft);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear</DialogTitle>
          <DialogDescription>En cada sección, el + crea lo de esa sección. Mantenelo apretado para ver todo.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2.5">
          {OPTIONS.map(({ kind, label, icon: Icon, tone }) => (
            <button
              key={kind}
              type="button"
              onClick={() => onCreate(kind)}
              className="pressable flex flex-col items-center gap-2 rounded-2xl bg-foreground/[0.05] px-2 py-4 ring-1 ring-foreground/[0.06] transition-colors active:bg-foreground/10"
            >
              <span className={cn("flex size-11 items-center justify-center rounded-[14px]", tone)}>
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={pasteWish}
          disabled={reading}
          className="pressable flex items-center gap-3 rounded-2xl bg-foreground/[0.05] px-4 py-3 text-left ring-1 ring-foreground/[0.06] active:bg-foreground/10"
        >
          {reading ? (
            <Loader2Icon className="size-5 shrink-0 animate-spin text-[#f472b6]" />
          ) : (
            <ClipboardPasteIcon className="size-5 shrink-0 text-[#f472b6]" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{reading ? "Leyendo el link…" : "Pegar link de una tienda"}</span>
            <span className="block text-xs text-muted-foreground">Arma el deseo con foto y precio</span>
          </span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
