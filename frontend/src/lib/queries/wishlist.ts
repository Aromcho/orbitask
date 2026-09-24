"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { LinkPreview, Priority, Wish } from "../types";
import { useApiMutation } from "./mutation";

export const WISHLIST_KEY = ["wishlist"];

export interface WishInput {
  url?: string;
  title?: string;
  image?: string;
  price?: number | null;
  currency?: string;
  priority?: Priority;
  notes?: string;
  purchased?: boolean;
}

export function useWishlist() {
  return useQuery({ queryKey: WISHLIST_KEY, queryFn: () => api<Wish[]>("/wishlist") });
}

export function previewLink(url: string) {
  return api<LinkPreview>("/wishlist/preview", { method: "POST", body: { url } });
}

export function useSaveWish() {
  return useApiMutation(({ id, ...body }: WishInput & { id?: string }) =>
    id
      ? api<Wish>(`/wishlist/${id}`, { method: "PATCH", body })
      : api<Wish>("/wishlist", { method: "POST", body }), { invalidate: [WISHLIST_KEY] });
}

export function useRefreshWish() {
  return useApiMutation((id: string) => api<Wish>(`/wishlist/${id}/refresh`, { method: "POST" }), {
    invalidate: [WISHLIST_KEY],
    success: "Datos actualizados desde el link",
  });
}

export function useDeleteWish() {
  return useApiMutation((id: string) => api(`/wishlist/${id}`, { method: "DELETE" }), {
    invalidate: [WISHLIST_KEY],
    success: "Deseo eliminado",
  });
}
