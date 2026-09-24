"use client";

import { Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PRIORITIES } from "@/lib/constants";
import { DEFAULT_CURRENCY } from "@/lib/format";
import { useSaveWish } from "@/lib/queries/wishlist";
import type { LinkPreview, Priority, Wish } from "@/lib/types";
import { WishImage } from "./wish-image";

/** Lo que abre el diálogo: editar un deseo o crear uno nuevo (con la vista previa si la hubo). */
export type WishDraft =
  | { wish: Wish }
  | { url: string; title: string; preview: LinkPreview | null; previewError: string | null };

export function WishDialog({ draft, onClose }: { draft: WishDraft | null; onClose: () => void }) {
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        {draft && <WishForm key={"wish" in draft ? draft.wish.id : draft.url + draft.title} draft={draft} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function WishForm({ draft, onDone }: { draft: WishDraft; onDone: () => void }) {
  const wish = "wish" in draft ? draft.wish : null;
  const preview = "preview" in draft ? draft.preview : null;

  const [url, setUrl] = useState(wish?.url ?? ("url" in draft ? draft.url : ""));
  const [title, setTitle] = useState(wish?.title ?? preview?.title ?? ("title" in draft ? draft.title : ""));
  const [image, setImage] = useState(wish?.image ?? preview?.image ?? "");
  const [price, setPrice] = useState(String(wish?.price ?? preview?.price ?? ""));
  const [currency, setCurrency] = useState(wish?.currency ?? preview?.currency ?? DEFAULT_CURRENCY);
  const [priority, setPriority] = useState<Priority>(wish?.priority ?? "media");
  const [notes, setNotes] = useState(wish?.notes ?? "");
  const save = useSaveWish();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate(
      {
        id: wish?.id,
        title: title.trim(),
        url: url.trim() || undefined,
        image: image.trim() || undefined,
        price: price ? Number(price) : null,
        currency: currency.trim().toUpperCase() || DEFAULT_CURRENCY,
        priority,
        notes: notes.trim(),
      },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{wish ? "Editar deseo" : "Nuevo deseo"}</DialogTitle>
      </DialogHeader>

      <WishImage src={image} alt={title} className="aspect-[2/1] w-full rounded-xl ring-1 ring-foreground/10" />

      {"previewError" in draft && draft.previewError && (
        <p className="flex items-start gap-2 rounded-lg bg-streak/10 px-3 py-2 text-xs text-streak">
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          {draft.previewError}. Tip: en la tienda hacé clic derecho en la foto → “Copiar dirección de imagen” y pegala abajo.
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="wish-title">Qué es</Label>
        <Input id="wish-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required autoFocus />
      </div>

      <div className="grid grid-cols-[1fr_88px] gap-3">
        <div className="grid gap-2">
          <Label htmlFor="wish-price">Precio</Label>
          <Input id="wish-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Opcional" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="wish-currency">Moneda</Label>
          <Input id="wish-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={3} className="uppercase" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Prioridad</Label>
        <ToggleGroup type="single" variant="outline" value={priority} onValueChange={(v) => v && setPriority(v as Priority)} className="w-full">
          {(["baja", "media", "alta"] as const).map((p) => (
            <ToggleGroupItem key={p} value={p} className="flex-1">
              {PRIORITIES[p].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="wish-url">Link</Label>
        <Input id="wish-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="wish-image">Imagen (URL)</Label>
        <Input id="wish-image" type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…/foto.jpg" />
      </div>

      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas: talle, color, para cuándo…" rows={2} maxLength={1000} />

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!title.trim() || save.isPending}>
          {save.isPending && <Loader2Icon className="animate-spin" />}
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}
