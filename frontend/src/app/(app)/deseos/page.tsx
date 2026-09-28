"use client";

import { ArrowUpDownIcon, ClipboardPasteIcon, GiftIcon, LinkIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { WishCard } from "@/components/wishlist/wish-card";
import { WishDialog, type WishDraft } from "@/components/wishlist/wish-dialog";
import { draftFromInput, extractUrl, readClipboard } from "@/components/wishlist/wish-draft";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatMoney } from "@/lib/format";
import { useWishlist } from "@/lib/queries/wishlist";
import type { Priority, Wish } from "@/lib/types";

type Filter = "pendientes" | "comprados" | "todos";
type Sort = "prioridad" | "precio" | "recientes";

const PRIORITY_RANK: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };

const SORTERS: Record<Sort, (a: Wish, b: Wish) => number> = {
  prioridad: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.createdAt.localeCompare(a.createdAt),
  precio: (a, b) => (b.price ?? -1) - (a.price ?? -1),
  recientes: (a, b) => b.createdAt.localeCompare(a.createdAt),
};

export default function DeseosPage() {
  const isMobile = useIsMobile();
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

  async function addFrom(text: string) {
    if (!text.trim()) return;
    setLoadingPreview(Boolean(extractUrl(text)));
    const next = await draftFromInput(text);
    setLoadingPreview(false);
    setDraft(next);
    setInput("");
  }

  // Link compartido desde otra app (Android: Compartir → Orbitask). Llega como ?url= o dentro de ?text=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("url") || extractUrl(params.get("text") ?? "") || params.get("title");
    if (!shared) return;
    window.history.replaceState(null, "", window.location.pathname);
    let cancelled = false;
    draftFromInput(shared).then((next) => !cancelled && setDraft(next));
    return () => {
      cancelled = true;
    };
  }, []);

  async function paste() {
    const clip = await readClipboard();
    if (!clip) return toast.error("No pude leer el portapapeles. Mantené apretado el campo y elegí Pegar.");
    setInput(clip);
    addFrom(clip);
  }

  const pendingCount = wishes.filter((w) => !w.purchased).length;

  return (
    <PageTransition>
      <PageHeader
        title="Deseos"
        description={
          pendingCount
            ? `${pendingCount} pendientes${totals.length ? ` · ${totals.map(([c, t]) => formatMoney(t, c)).join(" + ")}` : ""}`
            : "Lo que querés comprarte, con foto y todo."
        }
        mobileActions={
          wishes.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Ordenar">
                  <ArrowUpDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Ordenar</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as Sort)}>
                  <DropdownMenuRadioItem value="prioridad">Por prioridad</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="precio">Por precio</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="recientes">Más recientes</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />

      <Card className="p-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addFrom(input);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <LinkIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isMobile ? "Link o qué querés" : "Pegá el link de cualquier tienda… o escribí qué querés"}
              aria-label="Link o nombre del deseo"
              enterKeyHint="go"
              autoCapitalize="none"
              className="h-11 border-0 bg-transparent pl-10 text-base shadow-none focus-visible:ring-0 touch:pl-10 dark:bg-transparent"
            />
          </div>
          {/* Sin texto, en el celu el botón pega lo copiado de un toque */}
          {!input.trim() && (
            <Button type="button" size="lg" className="h-11 md:hidden" onClick={paste} disabled={loadingPreview}>
              {loadingPreview ? <Loader2Icon className="animate-spin" /> : <ClipboardPasteIcon />}
              {loadingPreview ? "Leyendo…" : "Pegar"}
            </Button>
          )}
          <Button type="submit" size="lg" className={input.trim() ? "h-11" : "hidden h-11 md:inline-flex"} disabled={!input.trim() || loadingPreview}>
            {loadingPreview ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
            {loadingPreview ? "Leyendo link…" : "Agregar"}
          </Button>
        </form>
      </Card>

      {wishes.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filter}
            onValueChange={(v) => v && setFilter(v as Filter)}
            className="max-md:w-full max-md:*:flex-1"
          >
            <ToggleGroupItem value="pendientes">Pendientes</ToggleGroupItem>
            <ToggleGroupItem value="comprados">Comprados</ToggleGroupItem>
            <ToggleGroupItem value="todos">Todos</ToggleGroupItem>
          </ToggleGroup>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger size="sm" className="hidden w-40 md:flex" aria-label="Ordenar">
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
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : wishes.length === 0 ? (
        <Card>
          <EmptyState
            icon={GiftIcon}
            title="Tu lista de deseos está vacía"
            description="Copiá el link de algo que quieras (MercadoLibre, Amazon, Steam, cualquier tienda), tocá Pegar y armamos la tarjeta con la foto."
          />
        </Card>
      ) : visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No hay nada en este filtro.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((wish) => (
            <WishCard key={wish.id} wish={wish} onEdit={() => setDraft({ wish })} />
          ))}
        </div>
      )}

      <WishDialog draft={draft} onClose={() => setDraft(null)} />
    </PageTransition>
  );
}
