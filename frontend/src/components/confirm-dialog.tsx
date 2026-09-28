"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  /** Botón que abre la confirmación. Sin trigger, se controla con open/onOpenChange. */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

/**
 * Pide confirmación antes de una acción destructiva.
 * En el celu aparece abajo, al alcance del pulgar, con botones grandes.
 */
export function ConfirmDialog({ trigger, open, onOpenChange, title, description, confirmLabel = "Eliminar", onConfirm }: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="max-md:top-auto max-md:bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] max-md:left-3 max-md:w-[calc(100%-1.5rem)] max-md:translate-x-0 max-md:translate-y-0 max-md:gap-5 max-md:rounded-3xl max-md:p-5 max-md:data-[size=default]:max-w-none max-md:data-open:slide-in-from-bottom-8 max-md:data-open:zoom-in-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="max-md:text-lg">{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter className="max-md:-mx-5 max-md:-mb-5 max-md:rounded-b-3xl max-md:p-4">
          <AlertDialogCancel className="max-md:h-12 max-md:w-full">Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" className="max-md:h-12 max-md:w-full" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
