import * as React from "react"

/**
 * Devuelve `value`, o el último valor no nulo mientras `value` es null.
 * Sirve para que un diálogo siga mostrando su contenido durante la animación
 * de cierre (si no, la hoja se vacía y se encoge antes de irse).
 */
export function useLastValue<T>(value: T | null): T | null {
  const [last, setLast] = React.useState(value)
  if (value !== null && value !== last) setLast(value)
  return value ?? last
}
