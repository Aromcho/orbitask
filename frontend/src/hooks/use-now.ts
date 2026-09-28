import * as React from "react"

/** Hora actual, actualizada cada minuto (línea de "ahora", cuentas regresivas). */
export function useNow() {
  const [now, setNow] = React.useState(() => new Date())
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}
