"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { clearCache } from "../persist";
import type { User } from "../types";

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => api<User>("/auth/me"), staleTime: Infinity });
}

export function login(email: string, password: string) {
  return api<User>("/auth/login", { method: "POST", body: { email, password } });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return api<void>("/auth/password", { method: "POST", body: { currentPassword, newPassword } });
}

export async function logout() {
  await api("/auth/logout", { method: "POST" });
  // Recarga completa a propósito: limpia el cache de datos de la sesión anterior.
  clearCache();
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = "/login";
}
