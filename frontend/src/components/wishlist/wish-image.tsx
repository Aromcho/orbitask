"use client";

import { GiftIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Imagen de un deseo. Usamos <img> común (no next/image) porque las imágenes
 * vienen de cualquier tienda. Si falla, mostramos un fondo lindo con el ícono.
 */
export function WishImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src && failedSrc !== src;

  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-primary/25 via-primary/10 to-income/15", className)}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <GiftIcon className="size-10 text-primary/60" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
