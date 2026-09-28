import { clearCache } from "./persist";

/** Error con el status HTTP y el mensaje que devolvió el backend. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string>;
}

/**
 * Llama al backend a través del rewrite /api de Next (ver next.config.ts).
 * Si la sesión venció, manda al login.
 */
export async function api<T>(path: string, { method = "GET", body, query }: RequestOptions = {}): Promise<T> {
  const url = `/api${path}${query ? `?${new URLSearchParams(query)}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && path !== "/auth/login") {
    // Recarga completa a propósito: limpia el cache de datos de la sesión anterior.
    clearCache();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
    throw new ApiError(401, "Tu sesión venció");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = Array.isArray(data?.message) ? data.message.join(" · ") : data?.message;
    throw new ApiError(res.status, message ?? `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
