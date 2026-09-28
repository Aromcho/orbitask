"use client";

import { ClipboardPasteIcon, LinkIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { WishDraft } from "./wish-dialog";
import { draftFromInput, readClipboard } from "./wish-draft";

interface WishQuickAddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se llama con el borrador listo para completar en el diálogo del deseo. */
  onDraft: (draft: WishDraft) => void;
}

/** Primer paso de un deseo nuevo: pegar un link (o escribir qué querés). */
export function WishQuickAdd({ open, onOpenChange, onDraft }: WishQuickAddProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(value: string) {
    if (!value.trim()) return;
    setLoading(true);
    const draft = await draftFromInput(value);
    setLoading(false);
    setText("");
    onOpenChange(false);
    onDraft(draft);
  }

  async function paste() {
    const clip = await readClipboard();
    if (!clip) return toast.error("No pude leer el portapapeles. Mantené apretado el campo y elegí Pegar.");
    setText(clip);
    submit(clip);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Nuevo deseo</DialogTitle>
            <DialogDescription>Pegá el link de cualquier tienda y armo la tarjeta con foto y precio.</DialogDescription>
          </DialogHeader>
          <Button type="button" size="lg" className="w-full" onClick={paste} disabled={loading}>
            <ClipboardPasteIcon />
            Pegar link copiado
          </Button>
          <div className="relative">
            <LinkIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="…o escribí qué querés"
              className="pl-10 touch:pl-10"
              enterKeyHint="go"
              autoCapitalize="none"
            />
          </div>
          <Button type="submit" variant="outline" className="w-full" disabled={!text.trim() || loading}>
            {loading && <Loader2Icon className="animate-spin" />}
            {loading ? "Leyendo el link…" : "Siguiente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
