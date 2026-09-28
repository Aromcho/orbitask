"use client";

import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const ACTION_WIDTH = 72;
const SWIPE_RIGHT_TRIGGER = 88;

export interface SwipeAction {
  label: string;
  icon: React.ReactNode;
  /** Clases de fondo y texto del botón (ej: "bg-expense text-white"). */
  className: string;
  onClick: () => void;
}

interface SwipeRowProps {
  children: React.ReactNode;
  /** Botones que aparecen al deslizar hacia la izquierda. */
  actions?: SwipeAction[];
  /** Acción al deslizar hacia la derecha (ej: completar), con su ícono de fondo. */
  onSwipeRight?: () => void;
  rightIcon?: React.ReactNode;
  rightClassName?: string;
  className?: string;
}

/**
 * Fila que se desliza con el dedo, como en Mail o Recordatorios:
 * a la izquierda muestra acciones; a la derecha dispara la acción principal.
 * El scroll vertical sigue funcionando (solo toma gestos claramente horizontales).
 */
export function SwipeRow({ children, actions = [], onSwipeRight, rightIcon, rightClassName, className }: SwipeRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{ x: number; y: number; from: number; axis: "x" | "y" | null } | null>(null);
  const suppressClick = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const openWidth = actions.length * ACTION_WIDTH;
  const open = offset < 0 && !dragging;

  // Con las acciones a la vista, tocar en cualquier otro lado las cierra
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rowRef.current?.contains(event.target as Node)) setOffset(0);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function onPointerDown(event: React.PointerEvent) {
    if (event.pointerType === "mouse") return;
    gesture.current = { x: event.clientX, y: event.clientY, from: offset, axis: null };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g) return;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    if (!g.axis) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        g.axis = "x";
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      } else if (Math.abs(dy) > 8) {
        g.axis = "y";
      }
    }
    if (g.axis !== "x") return;
    const min = -(openWidth + 24);
    const max = onSwipeRight ? SWIPE_RIGHT_TRIGGER + 40 : 0;
    setOffset(Math.min(max, Math.max(min, g.from + dx)));
  }

  function onPointerUp() {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.axis !== "x") return;
    setDragging(false);
    // El click que a veces sigue a un deslizamiento no tiene que abrir la fila
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 350);
    if (offset > SWIPE_RIGHT_TRIGGER && onSwipeRight) {
      haptic();
      onSwipeRight();
      setOffset(0);
    } else if (openWidth && offset < -openWidth / 2) {
      setOffset(-openWidth);
    } else {
      setOffset(0);
    }
  }

  return (
    <div ref={rowRef} className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Los fondos ocupan solo lo que se destapa: la fila puede ser translúcida */}
      {onSwipeRight && offset > 0 && (
        <div className={cn("absolute inset-y-0 left-0 flex items-center overflow-hidden pl-5", rightClassName)} style={{ width: offset }} aria-hidden>
          <span className={cn("transition-transform duration-150", offset > SWIPE_RIGHT_TRIGGER ? "scale-125" : "scale-100")}>{rightIcon}</span>
        </div>
      )}
      {actions.length > 0 && offset < 0 && (
        <div className={cn("absolute inset-y-0 right-0 flex overflow-hidden", !dragging && "transition-[width] duration-200 ease-out")} style={{ width: -offset }}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                setOffset(0);
                action.onClick();
              }}
              className={cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden text-[11px] font-semibold whitespace-nowrap", action.className)}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
      <div
        className={cn("relative touch-pan-y", !dragging && "transition-transform duration-200 ease-out")}
        style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        // Después de deslizar (o con las acciones abiertas) el toque no abre la fila
        onClickCapture={(event) => {
          if (suppressClick.current || offset !== 0) {
            event.stopPropagation();
            event.preventDefault();
            if (offset !== 0) setOffset(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
