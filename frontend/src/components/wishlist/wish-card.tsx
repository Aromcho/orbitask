"use client";

import { CheckIcon, ExternalLinkIcon, MoreHorizontalIcon, PencilIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PRIORITIES } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { useDeleteWish, useRefreshWish, useSaveWish } from "@/lib/queries/wishlist";
import type { Wish } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WishImage } from "./wish-image";

const PRIORITY_DOT = { alta: "bg-expense", media: "bg-streak", baja: "bg-white/60" } as const;

export function WishCard({ wish, onEdit }: { wish: Wish; onEdit: () => void }) {
  const save = useSaveWish();
  const refresh = useRefreshWish();
  const remove = useDeleteWish();

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/15 hover:ring-primary/30",
        wish.purchased && "opacity-70",
      )}
    >
      <button type="button" onClick={onEdit} className="relative block text-left" aria-label={`Editar ${wish.title}`}>
        <WishImage src={wish.image} alt={wish.title} className={cn("aspect-[4/3] w-full", wish.purchased && "grayscale")} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
          <span className={cn("size-1.5 rounded-full", PRIORITY_DOT[wish.priority])} />
          {PRIORITIES[wish.priority].label}
        </span>
        {wish.siteName && (
          <span className="absolute bottom-3 left-3 max-w-[70%] truncate rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white backdrop-blur-md">
            {wish.siteName}
          </span>
        )}
        {wish.purchased && (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-income px-2.5 py-1 text-[11px] font-semibold text-black/80">
            <CheckIcon className="size-3" strokeWidth={3} />
            Comprado
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <h3 className="line-clamp-2 font-sans leading-snug font-medium">{wish.title}</h3>
          {wish.notes && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{wish.notes}</p>}
        </div>

        <div className="flex items-center gap-1">
          <p className="flex-1 font-heading text-xl font-semibold tabular">
            {wish.price !== null ? formatMoney(wish.price, wish.currency) : <span className="text-sm font-normal text-muted-foreground">Sin precio</span>}
          </p>
          {wish.url && (
            <Button variant="ghost" size="icon-sm" asChild>
              <a href={wish.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir en la tienda">
                <ExternalLinkIcon />
              </a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Opciones">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => save.mutate({ id: wish.id, purchased: !wish.purchased })}>
                <CheckIcon />
                {wish.purchased ? "Marcar como pendiente" : "¡Lo compré!"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <PencilIcon />
                Editar
              </DropdownMenuItem>
              {wish.url && (
                <DropdownMenuItem onClick={() => refresh.mutate(wish.id)}>
                  <RefreshCwIcon />
                  Actualizar desde el link
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <ConfirmDialog
                title="¿Eliminar este deseo?"
                description={`"${wish.title}" se va a borrar de tu lista.`}
                onConfirm={() => remove.mutate(wish.id)}
                trigger={
                  <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                    <Trash2Icon />
                    Eliminar
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}
