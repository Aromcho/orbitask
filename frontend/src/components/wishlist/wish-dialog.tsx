"use client";

import { CheckIcon, ExternalLinkIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { FormFooter } from "@/components/form/form-footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLastValue } from "@/hooks/use-last-value";
import { PRIORITIES } from "@/lib/constants";
import { DEFAULT_CURRENCY, parseAmount } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useDeleteWish, useRefreshWish, useSaveWish } from "@/lib/queries/wishlist";
import type { LinkPreview, Priority, Wish } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WishImage } from "./wish-image";

/** Lo que abre el diálogo: editar un deseo o crear uno nuevo (con la vista previa si la hubo). */
export type WishDraft =
  | { wish: Wish }
  | { url: string; title: string; preview: LinkPreview | null; previewError: string | null };

export function WishDialog({ draft: current, onClose }: { draft: WishDraft | null; onClose: () => void }) {
  const draft = useLastValue(current);
  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
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
  const [price, setPrice] = useState(String(wish?.price ?? preview?.price ?? "").replace(".", ","));
  const [currency, setCurrency] = useState(wish?.currency ?? preview?.currency ?? DEFAULT_CURRENCY);
  const [priority, setPriority] = useState<Priority>(wish?.priority ?? "media");
  const [notes, setNotes] = useState(wish?.notes ?? "");
  const save = useSaveWish();
  const refresh = useRefreshWish();
  const remove = useDeleteWish();

  const priceValue = parseAmount(price);
  const invalidPrice = price.trim() !== "" && !(priceValue >= 0);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate(
      {
        id: wish?.id,
        title: title.trim(),
        url: url.trim() || undefined,
        image: image.trim() || undefined,
        price: price.trim() ? Math.round(priceValue * 100) / 100 : null,
        currency: currency.trim().toUpperCase() || DEFAULT_CURRENCY,
        priority,
        notes: notes.trim(),
      },
      { onSuccess: onDone },
    );
  }

  function togglePurchased() {
    if (!wish) return;
    haptic();
    save.mutate({ id: wish.id, purchased: !wish.purchased }, { onSuccess: onDone });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{wish ? "Editar deseo" : "Nuevo deseo"}</DialogTitle>
      </DialogHeader>

      <WishImage src={image} alt={title} className="aspect-[2/1] w-full rounded-xl ring-1 ring-foreground/10" />

      {wish && (
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            type="button"
            variant={wish.purchased ? "outline" : "default"}
            onClick={togglePurchased}
            className={cn(!wish.purchased && "bg-income text-black/80 hover:bg-income/85", wish.url ? "" : "col-span-2")}
          >
            <CheckIcon />
            {wish.purchased ? "Marcar como pendiente" : "¡Lo compré!"}
          </Button>
          {wish.url && (
            <Button type="button" variant="outline" asChild>
              <a href={wish.url} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon />
                Ver en la tienda
              </a>
            </Button>
          )}
        </div>
      )}

      {"previewError" in draft && draft.previewError && (
        <p className="flex items-start gap-2 rounded-lg bg-streak/10 px-3 py-2 text-xs text-streak">
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          {draft.previewError}. Tip: en la tienda mantené apretada la foto → “Copiar imagen” o “Copiar dirección” y pegala abajo.
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="wish-title">Qué es</Label>
        <Input id="wish-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required autoFocus={!title} />
      </div>

      <div className="grid grid-cols-[1fr_88px] gap-3">
        <div className="grid gap-2">
          <Label htmlFor="wish-price">Precio</Label>
          <Input
            id="wish-price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="Opcional"
            aria-invalid={invalidPrice}
            className="tabular"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="wish-currency">Moneda</Label>
          <Input
            id="wish-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            maxLength={3}
            autoCapitalize="characters"
            className="uppercase"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Prioridad</Label>
        <ToggleGroup type="single" variant="outline" value={priority} onValueChange={(v) => v && setPriority(v as Priority)} className="w-full">
          {(["baja", "media", "alta"] as const).map((p) => (
            <ToggleGroupItem key={p} value={p} className="flex-1 data-[state=on]:bg-primary/15 data-[state=on]:text-primary">
              {PRIORITIES[p].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="wish-url">Link</Label>
          {wish?.url && (
            <Button type="button" variant="ghost" size="xs" disabled={refresh.isPending} onClick={() => refresh.mutate(wish.id, { onSuccess: onDone })}>
              <RefreshCwIcon className={cn(refresh.isPending && "animate-spin")} />
              Actualizar desde el link
            </Button>
          )}
        </div>
        <Input id="wish-url" type="url" inputMode="url" autoCapitalize="none" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="wish-image">Imagen (URL)</Label>
        <Input id="wish-image" type="url" inputMode="url" autoCapitalize="none" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…/foto.jpg" />
      </div>

      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas: talle, color, para cuándo…" rows={2} maxLength={1000} />

      <FormFooter
        onCancel={onDone}
        pending={save.isPending}
        disabled={!title.trim() || invalidPrice}
        remove={
          wish
            ? { title: "¿Eliminar este deseo?", description: `"${wish.title}" se va a borrar de tu lista.`, onConfirm: () => remove.mutate(wish.id, { onSuccess: onDone }) }
            : undefined
        }
      />
    </form>
  );
}
