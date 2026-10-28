"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormFooter } from "@/components/form/form-footer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/queries/auth";

export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Se desmonta al cerrar: el formulario arranca vacío cada vez */}
        {open && <ChangePasswordForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const mismatch = confirm.length > 0 && next !== confirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) return;
    setPending(true);
    try {
      await changePassword(current, next);
      toast.success("Contraseña actualizada");
      onDone();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Cambiar contraseña</DialogTitle>
        <DialogDescription>Mínimo 6 caracteres.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="current-password">Contraseña actual</Label>
        <Input id="current-password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <Input id="new-password" type="password" autoComplete="new-password" minLength={6} value={next} onChange={(e) => setNext(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm-password">Repetir nueva contraseña</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={mismatch}
          required
        />
        {mismatch && <p className="text-sm text-destructive">No coinciden</p>}
      </div>
      <FormFooter onCancel={onDone} pending={pending} disabled={mismatch || next.length < 6} />
    </form>
  );
}
