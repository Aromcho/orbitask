import * as React from "react"

/**
 * Publica en <html> cuánto tapa el teclado del celu:
 * - --keyboard-inset: alto del teclado (0 si está cerrado)
 * - --vv-height: alto visible real
 * - data-keyboard="open" mientras está abierto
 *
 * En iPhone el teclado se dibuja encima de la página sin achicarla, así que las
 * hojas y barras fijas abajo usan --keyboard-inset para quedar por encima.
 */
export function useViewportVars() {
  React.useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement
    let frame = 0

    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        // Con zoom (pellizco) el alto visible también baja: eso no es el teclado
        const zoomed = viewport.scale > 1.01
        const inset = zoomed ? 0 : Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
        root.style.setProperty("--keyboard-inset", `${inset}px`)
        root.style.setProperty("--vv-height", `${Math.round(viewport.height)}px`)
        if (inset > 120) root.dataset.keyboard = "open"
        else delete root.dataset.keyboard
      })
    }

    update()
    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
    }
  }, [])
}
