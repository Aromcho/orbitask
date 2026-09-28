import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/mobile/bottom-nav";
import { MobileProvider } from "@/components/mobile/mobile-provider";
import { OfflineBanner } from "@/components/offline-banner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          {/* En el celu: margen para el notch arriba y para la barra inferior abajo */}
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-[calc(env(safe-area-inset-bottom)+6.5rem)] md:p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
        {/* iPhone instalado: la barra de estado es translúcida; esto evita leer contenido debajo de la hora */}
        <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)] bg-background/75 backdrop-blur-md md:hidden" />
        <BottomNav />
        <OfflineBanner />
      </SidebarProvider>
    </MobileProvider>
  );
}
