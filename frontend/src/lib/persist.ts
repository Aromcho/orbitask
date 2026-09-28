import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query";

/**
 * Guarda los datos ya cargados en el dispositivo para que, al abrir la app,
 * se vea lo último al instante mientras se refresca desde el backend.
 * Se borra al cerrar sesión (y cuando vence la sesión).
 */
const CACHE_KEY = "orbitask-cache-v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 3; // 3 días

export function restoreCache(queryClient: QueryClient) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const { savedAt, state } = JSON.parse(raw);
    if (Date.now() - savedAt > MAX_AGE_MS) return clearCache();
    hydrate(queryClient, state);
  } catch {
    clearCache();
  }
}

/** Guarda el cache cada vez que cambia (agrupando cambios seguidos). Devuelve la función para dejar de guardar. */
export function persistCache(queryClient: QueryClient) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const save = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const state = dehydrate(queryClient, { shouldDehydrateQuery: (query) => query.state.status === "success" });
        localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), state }));
      } catch {
        // storage lleno o bloqueado: seguimos sin cache
      }
    }, 800);
  };
  const unsubscribe = queryClient.getQueryCache().subscribe(save);
  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}

export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // nada que borrar
  }
}
