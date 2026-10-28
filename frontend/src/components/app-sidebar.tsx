"use client";

import {
  CalendarDaysIcon,
  ChevronsUpDownIcon,
  FlameIcon,
  GiftIcon,
  HouseIcon,
  ImageIcon,
  KeyRoundIcon,
  LogOutIcon,
  MoonIcon,
  SquareKanbanIcon,
  SunIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { BackgroundPicker } from "@/components/background-picker";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { logout, useMe } from "@/lib/queries/auth";

export const NAV = [
  { href: "/", label: "Inicio", icon: HouseIcon },
  { href: "/semana", label: "Semana", icon: CalendarDaysIcon },
  { href: "/tareas", label: "Tareas", icon: SquareKanbanIcon },
  { href: "/habitos", label: "Hábitos", icon: FlameIcon },
  { href: "/finanzas", label: "Finanzas", icon: WalletIcon },
  { href: "/deseos", label: "Deseos", icon: GiftIcon },
];

/** Solo lo ve el admin. */
export const ADMIN_NAV = { href: "/usuarios", label: "Usuarios", icon: UsersIcon };

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { data: me } = useMe();
  const nav = me?.isAdmin ? [...NAV, ADMIN_NAV] : NAV;

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="px-3 pt-4 pb-2 group-data-[collapsible=icon]:px-2">
        <Link href="/" className="rounded-md group-data-[collapsible=icon]:[&_span]:hidden">
          <Logo />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Mi órbita</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {nav.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="h-9 data-[active=true]:text-primary data-[active=true]:[&_svg]:text-primary"
                    >
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

function UserMenu() {
  const { data: me } = useMe();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const initials = (me?.name ?? "?").slice(0, 2).toUpperCase();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/20 font-medium text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{me?.name ?? "…"}</span>
                <span className="truncate text-xs text-muted-foreground">{me?.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Preferencias</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
              {isDark ? <SunIcon /> : <MoonIcon />}
              {isDark ? "Modo claro" : "Modo oscuro"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
              <KeyRoundIcon />
              Cambiar contraseña
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPickerOpen(true)}>
              <ImageIcon />
              Fondo de pantalla
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => logout()}>
              <LogOutIcon />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <BackgroundPicker open={pickerOpen} onOpenChange={setPickerOpen} />
        <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
