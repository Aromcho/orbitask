"use client"

import * as React from "react"
import { cn } from "cn"
import { Dialog as DialogPrimitive } from "radix-ui"

import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { XIcon } from "lucide-react"

/** true cuando el diálogo se muestra como hoja inferior (celu). */
const SheetModeContext = React.createContext(false)

export function useSheetMode() {
  return React.useContext(SheetModeContext)
}

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}

/** En escritorio, diálogo centrado. En el celu, hoja que sube desde abajo. */
function DialogContent({ showCloseButton = true, ...props }: DialogContentProps) {
  const isMobile = useIsMobile()
  return isMobile ? <SheetContent {...props} /> : <CenteredContent showCloseButton={showCloseButton} {...props} />
}

function CenteredContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Cerrar</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function SheetContent({
  className,
  children,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const drag = useDragToClose(contentRef, () => closeRef.current?.click())

  return (
    <DialogPortal>
      <DialogOverlay className="bg-black/55 supports-backdrop-filter:backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="dialog-content"
        data-sheet=""
        // Al abrir no enfocamos el primer campo (en el celu eso abre el teclado y tapa la hoja),
        // salvo que el formulario haya pedido autoFocus a propósito (captura rápida).
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event)
          if (event.defaultPrevented) return
          event.preventDefault()
          if (!contentRef.current?.contains(document.activeElement)) contentRef.current?.focus({ preventScroll: true })
        }}
        className={cn(
          "fixed inset-x-0 bottom-[var(--keyboard-inset,0px)] z-50 mx-auto flex max-h-[calc(var(--vv-height,100dvh)-env(safe-area-inset-top)-0.75rem)] w-full flex-col gap-4 overflow-y-auto overscroll-contain rounded-t-[28px] bg-popover px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-sm text-popover-foreground shadow-[0_-16px_48px_-16px_rgb(0_0_0/0.6)] ring-1 ring-foreground/10 outline-none has-data-[slot=dialog-footer]:pb-0 data-open:animate-in data-open:duration-300 data-open:ease-[cubic-bezier(0.32,0.72,0,1)] data-open:slide-in-from-bottom data-closed:animate-out data-closed:duration-200 data-closed:slide-out-to-bottom",
          className
        )}
        {...props}
      >
        {/* Asa: arrastrala hacia abajo para cerrar */}
        <div
          {...drag}
          aria-hidden
          className="sticky top-0 z-20 -mx-4 -mb-3 flex shrink-0 cursor-grab touch-none justify-center bg-popover pt-2.5 pb-3 active:cursor-grabbing"
        >
          <span className="h-1.5 w-10 rounded-full bg-foreground/20" />
        </div>
        <SheetModeContext.Provider value={true}>{children}</SheetModeContext.Provider>
        <DialogPrimitive.Close ref={closeRef} className="sr-only">
          Cerrar
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/** Arrastrar el asa hacia abajo sigue al dedo; si pasa el umbral (o fue rápido), cierra. */
function useDragToClose(ref: React.RefObject<HTMLDivElement | null>, close: () => void) {
  const start = React.useRef<{ y: number; time: number } | null>(null)

  const end = (event: React.PointerEvent) => {
    const el = ref.current
    if (!start.current || !el) return
    const dy = event.clientY - start.current.y
    const speed = dy / Math.max(1, event.timeStamp - start.current.time)
    start.current = null
    el.style.transition = "transform 220ms cubic-bezier(0.32, 0.72, 0, 1)"
    if (dy > 110 || (speed > 0.5 && dy > 24)) {
      el.style.transform = "translateY(100%)"
      el.style.animation = "none" // ya salió deslizando: sin la animación de cierre
      setTimeout(close, 200)
    } else {
      el.style.transform = ""
    }
  }

  return {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      start.current = { y: event.clientY, time: event.timeStamp }
      event.currentTarget.setPointerCapture(event.pointerId)
      if (ref.current) ref.current.style.transition = "none"
    },
    onPointerMove: (event: React.PointerEvent) => {
      if (!start.current || !ref.current) return
      ref.current.style.transform = `translateY(${Math.max(0, event.clientY - start.current.y)}px)`
    },
    onPointerUp: end,
    onPointerCancel: end,
  }
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  const sheet = useSheetMode()
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className,
        // En la hoja: pie fijo abajo, siempre a mano, con la acción principal a lo ancho
        sheet &&
          "sticky bottom-0 z-10 mt-auto mb-0 flex-row items-center justify-stretch rounded-none bg-popover/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-md in-data-[keyboard=open]:pb-3 sm:justify-stretch"
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Cerrar</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  const sheet = useSheetMode()
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        sheet && "text-xl leading-tight font-semibold",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
