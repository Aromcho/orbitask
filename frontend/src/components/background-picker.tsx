"use client";

import { CheckIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BACKGROUNDS } from "@/lib/background";
import { useBackground } from "@/lib/use-background";
import { cn } from "@/lib/utils";

export function BackgroundPicker({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [current, setBackground] = useBackground();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fondo de pantalla</DialogTitle>
          <DialogDescription>Se guarda en este navegador. Los cambios se ven al instante.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BACKGROUNDS.map((bg) => {
            const selected = bg.id === current;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => setBackground(bg.id)}
                aria-pressed={selected}
                className={cn(
                  "group relative aspect-video overflow-hidden rounded-xl ring-1 ring-foreground/10 transition-all hover:ring-primary/60",
                  selected && "ring-2 ring-primary",
                )}
              >
                {bg.id === "none" ? (
                  // Vista previa del degradado por defecto
                  <span className="absolute inset-0 bg-[radial-gradient(60%_60%_at_15%_10%,rgb(139_124_246/0.45),transparent_70%),radial-gradient(50%_50%_at_90%_95%,rgb(45_212_191/0.25),transparent_70%)] bg-background" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/backgrounds/${bg.id}-thumb.webp`}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-6 pb-2 text-left text-xs font-medium text-white">
                  {bg.label}
                </span>
                {selected && (
                  <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <CheckIcon className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
