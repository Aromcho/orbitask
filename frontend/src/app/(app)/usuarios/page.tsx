"use client";

import { PencilIcon, PlusIcon, ShieldCheckIcon } from "lucide-react";
import { useState } from "react";
import { FormFooter } from "@/components/form/form-footer";
import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/lib/queries/auth";
import { useDeleteUser, useSaveUser, useUsers } from "@/lib/queries/users";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const { data: me } = useMe();
  const { data: users, isLoading } = useUsers(!!me?.isAdmin);
  const [target, setTarget] = useState<User | "new" | null>(null);

  if (me && !me.isAdmin) {
    return (
      <PageTransition>
        <PageHeader title="Usuarios" description="Esta sección es solo para el admin." />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Usuarios"
        description="Quién puede entrar a Orbitask."
        actions={
          <Button onClick={() => setTarget("new")}>
            <PlusIcon />
            Nuevo usuario
          </Button>
        }
        mobileActions={
          <Button size="icon" variant="ghost" onClick={() => setTarget("new")} aria-label="Nuevo usuario">
            <PlusIcon />
          </Button>
        }
      />

      {isLoading || !users ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : (
        <Card className="gap-0 py-0">
          <ul className="divide-y divide-foreground/[0.06]">
            {users.map((user) => (
              <li key={user.id}>
                <button type="button" onClick={() => setTarget(user)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-foreground/5 active:bg-foreground/10">
                  <Avatar className="size-10 rounded-xl">
                    <AvatarFallback className="rounded-xl bg-primary/20 font-medium text-primary">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-medium">
                      {user.name}
                      {user.isAdmin && (
                        <Badge variant="secondary" className="gap-1">
                          <ShieldCheckIcon className="size-3" />
                          Admin
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <PencilIcon className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          {target !== null && <UserForm user={target === "new" ? null : target} onDone={() => setTarget(null)} />}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

function UserForm({ user, onDone }: { user: User | null; onDone: () => void }) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const save = useSaveUser();
  const remove = useDeleteUser();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    save.mutate({ id: user?.id, name, email, ...(password ? { password } : {}) }, { onSuccess: onDone });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{user ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
        <DialogDescription>{user ? "Dejá la contraseña vacía para no cambiarla." : "Podrá entrar con este email y contraseña."}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="user-name">Nombre</Label>
        <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={user?.isAdmin}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="user-password">{user ? "Nueva contraseña" : "Contraseña"}</Label>
        <Input
          id="user-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={user ? "Sin cambios" : "Mínimo 6 caracteres"}
          required={!user}
        />
      </div>
      <FormFooter
        onCancel={onDone}
        pending={save.isPending}
        remove={
          user && !user.isAdmin
            ? {
                title: `¿Eliminar a ${user.name}?`,
                description: "Se borran también todos sus datos. No se puede deshacer.",
                onConfirm: () => remove.mutate(user.id, { onSuccess: onDone }),
              }
            : undefined
        }
      />
    </form>
  );
}
