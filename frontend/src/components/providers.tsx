"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useViewportVars } from "@/hooks/use-viewport-vars";
import { persistCache, restoreCache } from "@/lib/persist";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // refetchOnWindowFocus: al volver a la app desde otra (celu) trae lo último
          queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 },
        },
      }),
  );

  // Lo último guardado aparece al instante; después se refresca desde el backend.
  useEffect(() => {
    restoreCache(queryClient);
    return persistCache(queryClient);
  }, [queryClient]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          {children}
          <DeviceSync />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

/** Ajustes que dependen del dispositivo: toasts, color de la barra del sistema y teclado. */
function DeviceSync() {
  const isMobile = useIsMobile();
  const { resolvedTheme } = useTheme();
  useViewportVars();

  // El tema es por clase (no por el sistema), así que el color de la barra se actualiza a mano
  useEffect(() => {
    const color = resolvedTheme === "light" ? "#f4f4fb" : "#0b0d17";
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", color));
  }, [resolvedTheme]);

  return (
    <Toaster
      position={isMobile ? "top-center" : "bottom-right"}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 10px)", left: 12, right: 12 }}
      richColors
      closeButton={!isMobile}
    />
  );
}
