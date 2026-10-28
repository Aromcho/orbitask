"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { User } from "../types";
import { useApiMutation } from "./mutation";

export const USERS_KEY = ["users"];

export interface UserInput {
  name?: string;
  email?: string;
  password?: string;
}

export function useUsers(enabled = true) {
  return useQuery({ queryKey: USERS_KEY, queryFn: () => api<User[]>("/users"), enabled });
}

export function useSaveUser() {
  return useApiMutation(
    ({ id, ...body }: UserInput & { id?: string }) =>
      id ? api<User>(`/users/${id}`, { method: "PATCH", body }) : api<User>("/users", { method: "POST", body }),
    { invalidate: [USERS_KEY, ["me"]] },
  );
}

export function useDeleteUser() {
  return useApiMutation((id: string) => api<void>(`/users/${id}`, { method: "DELETE" }), {
    invalidate: [USERS_KEY],
    success: "Usuario eliminado",
  });
}
