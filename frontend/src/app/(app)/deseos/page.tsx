"use client";

import { GiftIcon, LinkIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { WishCard } from "@/components/wishlist/wish-card";
import { WishDialog, type WishDraft } from "@/components/wishlist/wish-dialog";
import { formatMoney } from "@/lib/format";
import { previewLink, useWishlist } from "@/lib/queries/wishlist";
import type { Priority, Wish } from "@/lib/types";

type Filter = "pendientes" | "comprados" | "todos";
type Sort = "prioridad" | "precio" | "recientes";

const PRIORITY_RANK: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };

const SORTERS: Record<Sort, (a: Wish, b: Wish) => number> = {
  prioridad: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.createdAt.localeCompare(a.createdAt),
  precio: (a, b) => (b.price ?? -1) - (a.price ?? -1),
  recientes: (a, b) => b.createdAt.localeCompare(a.createdAt),
};

function isUrl(text: string) {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function DeseosPage() {
  const { data: wishes = [], isLoading } = useWishlist();
  const [filter, setFilter] = useState<Filter>("pendientes");
  const [sort, setSort] = useState<Sort>("prioridad");
  const [draft, setDraft] = useState<WishDraft | null>(null);
  const [input, setInput] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  const visible = useMemo(
    () =>
      wishes
        .filter((w) => (filter === "todos" ? true : filter === "comprados" ? w.purchased : !w.purchased))
        .sort(SORTERS[sort]),
    [wishes, filter, sort],
  );

  // Total de lo pendiente, separado por moneda.
  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of wishes) if (!w.purchased && w.price) map.set(w.currency, (map.get(w.currency) ?? 0) + w.price);
    return [...map.entries()];
  }, [wishes]);

  async function onAdd(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    if (!isUrl(text)) {
      setDraft({ url: "", title: text, preview: null, previewError: null });
    } else {
      setLoadingPreview(true);
      try {
        const preview = await previewLink(text);
        setDraft({ url: text, title: "", preview, previewError: null });
      } catch (err) {
        setDraft({ url: text, title: "", preview: null, previewError: (err as Error).message });
      } finally {
        setLoadingPreview(false);
      }
    }
    setInput("");
  }

  const pendingCount = wishes.filter((w) => !w.purchased).length;

  return (
    <>
      <PageHeader
        title="Deseos"
        description={
          pendingCount
            ? `${pendingCount} pendientes${totals.length ? ` · ${totals.map(([c, t]) => formatMoney(t, c)).join(" + ")}` : ""}`
            : "Lo que querés comprarte, con foto y todo."
        }
      />

      <Card className="p-2">
        <form onSubmit={onAdd} className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pegá el link de cualquier tienda… o escribí qué querés"
              className="h-11 border-0 bg-transparent pl-10 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <Button type="submit" size="lg" className="h-11" disabled={!input.trim() || loadingPreview}>
            {loadingPreview ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
            {loadingPreview ? "Leyendo link…" : "Agregar"}
          </Button>
        </form>
      </Card>

      {wishes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ToggleGroup type="single" variant="outline" size="sm" value={filter} onValueChange={(v) => v && setFilter(v as Filter)}>
            <ToggleGroupItem value="pendientes">Pendientes</ToggleGroupItem>
            <ToggleGroupItem value="comprados">Comprados</ToggleGroupItem>
            <ToggleGroupItem value="todos">Todos</ToggleGroupItem>
          </ToggleGroup>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="prioridad">Por prioridad</SelectItem>
              <SelectItem value="precio">Por precio</SelectItem>
              <SelectItem value="recientes">Más recientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : wishes.length === 0 ? (
        <Card>
          <EmptyState
            icon={GiftIcon}
            title="Tu lista de deseos está vacía"
            description="Pegá arriba el link de algo que quieras (Amazon, Steam, cualquier tienda) y te armamos la tarjeta con la foto."
          />
        </Card>
      ) : visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No hay nada en este filtro.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((wish) => (
            <WishCard key={wish.id} wish={wish} onEdit={() => setDraft({ wish })} />
          ))}
        </div>
      )}

      <WishDialog draft={draft} onClose={() => setDraft(null)} />
    </>
  );
}
