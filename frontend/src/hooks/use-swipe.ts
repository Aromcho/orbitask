import * as React from "react"

/**
 * Deslizar el dedo de costado sobre un elemento (ej: pasar de día).
 * El elemento necesita `touch-action: pan-y` (clase touch-pan-y) para que el
 * scroll vertical siga funcionando. Con mouse no hace nada.
 */
export function useHorizontalSwipe(onSwipe: (direction: "left" | "right") => void, threshold = 56) {
  const start = React.useRef<{ x: number; y: number } | null>(null)
  const swiped = React.useRef(false)

  const handlers = {
    onPointerDown: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") return
      start.current = { x: event.clientX, y: event.clientY }
    },
    onPointerUp: (event: React.PointerEvent) => {
      const from = start.current
      start.current = null
      if (!from) return
      const dx = event.clientX - from.x
      const dy = event.clientY - from.y
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
        swiped.current = true
        onSwipe(dx < 0 ? "left" : "right")
      }
    },
    onPointerCancel: () => {
      start.current = null
    },
  }

  /** true si el último gesto fue un deslizamiento: sirve para ignorar el click que le sigue. */
  const consumeSwipe = () => {
    const was = swiped.current
    swiped.current = false
    return was
  }

  return { handlers, consumeSwipe }
}
