"use client";

import { WifiOffIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Aviso chico arriba cuando el celu se queda sin conexión. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.5rem)] z-50 flex justify-center">
      <span className="flex items-center gap-2 rounded-full bg-streak px-3.5 py-1.5 text-xs font-medium text-black/85 shadow-lg">
        <WifiOffIcon className="size-3.5" />
        Sin conexión · ves lo último guardado
      </span>
    </div>
  );
}
