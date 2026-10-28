"use client";

import { ChevronRightIcon, FlameIcon, GiftIcon, ImageIcon, KeyRoundIcon, LogOutIcon, MoonIcon, SmartphoneIcon, UsersIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";
import { BackgroundPicker } from "@/components/background-picker";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { BACKGROUNDS } from "@/lib/background";
import { formatMoney, toDay, toMonth } from "@/lib/format";
import { logout, useMe } from "@/lib/queries/auth";
import { useSummary } from "@/lib/queries/finance";
import { useCheckins, useHabits } from "@/lib/queries/habits";
import { useWishlist } from "@/lib/queries/wishlist";
import { useBackground } from "@/lib/use-background";
import { cn } from "@/lib/utils";
import { tabIndex } from "./tabs";

/** Menú "Más": las secciones que no entran en la barra, con su dato del día, y las preferencias. */
export function MoreSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <MoreContent onNavigate={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function MoreContent({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { data: me } = useMe();
  const { resolvedTheme, setTheme } = useTheme();
  const [background] = useBackground();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const initials = (me?.name ?? "?").slice(0, 2).toUpperCase();
  // Entrar a Hábitos, Finanzas o Deseos desde una pestaña es "ir hacia adelante"
  const transitionTypes = tabIndex(pathname) < 3 ? ["tab-forward"] : undefined;

  return (
    <>
      <DialogHeader className="flex-row items-center gap-3">
        <Avatar className="size-11 rounded-2xl">
          <AvatarFallback className="rounded-2xl bg-primary/20 font-medium text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate">{me?.name ?? "Mi órbita"}</DialogTitle>
          <DialogDescription className="truncate">{me?.email}</DialogDescription>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-3 gap-2.5">
        <SectionTile href="/habitos" label="Hábitos" icon={FlameIcon} tone="text-streak" active={pathname.startsWith("/habitos")} transitionTypes={transitionTypes} onNavigate={onNavigate}>
          <HabitsStat />
        </SectionTile>
        <SectionTile href="/finanzas" label="Finanzas" icon={WalletIcon} tone="text-income" active={pathname.startsWith("/finanzas")} transitionTypes={transitionTypes} onNavigate={onNavigate}>
          <MoneyStat />
        </SectionTile>
        <SectionTile href="/deseos" label="Deseos" icon={GiftIcon} tone="text-[#f472b6]" active={pathname.startsWith("/deseos")} transitionTypes={transitionTypes} onNavigate={onNavigate}>
          <WishStat />
        </SectionTile>
      </div>

      <ul className="flex flex-col overflow-hidden rounded-2xl bg-foreground/[0.04] ring-1 ring-foreground/[0.06]">
        <li>
          <label className="flex min-h-13 items-center gap-3 px-4">
            <MoonIcon className="size-5 text-muted-foreground" />
            <span className="flex-1 text-sm">Modo oscuro</span>
            <Switch checked={resolvedTheme === "dark"} onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")} />
          </label>
        </li>
        <li className="border-t border-foreground/[0.06]">
          <button type="button" onClick={() => setPasswordOpen(true)} className="flex min-h-13 w-full items-center gap-3 px-4 text-left active:bg-foreground/5">
            <KeyRoundIcon className="size-5 text-muted-foreground" />
            <span className="flex-1 text-sm">Cambiar contraseña</span>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </button>
        </li>
        {me?.isAdmin && (
          <li className="border-t border-foreground/[0.06]">
            <Link href="/usuarios" onClick={onNavigate} className="flex min-h-13 w-full items-center gap-3 px-4 text-left active:bg-foreground/5">
              <UsersIcon className="size-5 text-muted-foreground" />
              <span className="flex-1 text-sm">Usuarios</span>
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </Link>
          </li>
        )}
        <li className="border-t border-foreground/[0.06]">
          <button type="button" onClick={() => setPickerOpen(true)} className="flex min-h-13 w-full items-center gap-3 px-4 text-left active:bg-foreground/5">
            <ImageIcon className="size-5 text-muted-foreground" />
            <span className="flex-1 text-sm">Fondo de pantalla</span>
            <span className="text-sm text-muted-foreground">{BACKGROUNDS.find((b) => b.id === background)?.label}</span>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </button>
        </li>
        <InstallRow />
        <li className="border-t border-foreground/[0.06]">
          <button type="button" onClick={() => logout()} className="flex min-h-13 w-full items-center gap-3 px-4 text-left text-destructive active:bg-destructive/10">
            <LogOutIcon className="size-5" />
            <span className="flex-1 text-sm">Cerrar sesión</span>
          </button>
        </li>
      </ul>

      <BackgroundPicker open={pickerOpen} onOpenChange={setPickerOpen} />
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}

interface SectionTileProps {
  href: string;
  label: string;
  icon: typeof FlameIcon;
  tone: string;
  active: boolean;
  transitionTypes?: string[];
  onNavigate: () => void;
  children: React.ReactNode;
}

function SectionTile({ href, label, icon: Icon, tone, active, transitionTypes, onNavigate, children }: SectionTileProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      transitionTypes={transitionTypes}
      aria-current={active ? "page" : undefined}
      className={cn(
        "pressable flex flex-col gap-2 rounded-2xl bg-foreground/[0.05] p-3 ring-1 ring-foreground/[0.06] active:bg-foreground/10",
        active && "ring-primary/50",
      )}
    >
      <Icon className={cn("size-5", tone)} />
      <span className="text-sm font-medium">{label}</span>
      <span className="truncate text-xs text-muted-foreground tabular">{children}</span>
    </Link>
  );
}

function HabitsStat() {
  const today = new Date();
  const key = toDay(today);
  const { data: habits } = useHabits();
  const { data: checkins = [] } = useCheckins(key, key);
  if (!habits) return "…";
  const due = habits.filter((h) => h.days.includes(today.getDay()));
  if (!due.length) return "Nada hoy";
  const done = due.filter((h) => checkins.some((c) => c.habitId === h.id)).length;
  return `${done} de ${due.length} hoy`;
}

function MoneyStat() {
  const { data: summary } = useSummary(toMonth(new Date()));
  if (!summary) return "…";
  return `${summary.available >= 0 ? "+" : ""}${formatMoney(summary.available)}`;
}

function WishStat() {
  const { data: wishes } = useWishlist();
  if (!wishes) return "…";
  const pending = wishes.filter((w) => !w.purchased).length;
  return pending === 1 ? "1 pendiente" : `${pending} pendientes`;
}

// ---------- Instalar la app ----------

function subscribeDisplayMode(onChange: () => void) {
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Si todavía se usa desde el navegador, explica cómo instalarla. */
function InstallRow() {
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => true);
  const [open, setOpen] = useState(false);
  if (standalone) return null;
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <li className="border-t border-foreground/[0.06]">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-h-13 w-full items-center gap-3 px-4 text-left active:bg-foreground/5" aria-expanded={open}>
        <SmartphoneIcon className="size-5 text-primary" />
        <span className="flex-1 text-sm">Instalar como app</span>
        <ChevronRightIcon className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <p className="px-4 pb-4 text-sm text-muted-foreground">
          {ios
            ? "En Safari, tocá el botón Compartir (el cuadrado con la flecha) y elegí “Agregar a inicio”. Queda como un ícono más, a pantalla completa."
            : "En Chrome, abrí el menú ⋮ y elegí “Instalar app” (o “Agregar a la pantalla principal”)."}
        </p>
      )}
    </li>
  );
}
