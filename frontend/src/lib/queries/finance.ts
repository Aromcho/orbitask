"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Category, FinanceSummary, MovementType, Recurring, Transaction } from "../types";
import { useApiMutation } from "./mutation";

export const CATEGORIES_KEY = ["categories"];
export const TRANSACTIONS_KEY = ["transactions"];
export const SUMMARY_KEY = ["summary"];
export const RECURRING_KEY = ["recurring"];

const MONEY_KEYS = [TRANSACTIONS_KEY, SUMMARY_KEY];

export interface TransactionInput {
  type: MovementType;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
}

export interface RecurringInput {
  type: MovementType;
  amount: number;
  categoryId: string;
  dayOfMonth: number;
  note: string;
  active?: boolean;
}

export function useCategories() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: () => api<Category[]>("/finance/categories") });
}

export function useTransactions(month: string) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, month],
    queryFn: () => api<Transaction[]>("/finance/transactions", { query: { month } }),
    placeholderData: (previous) => previous,
  });
}

export function useSummary(month: string) {
  return useQuery({
    queryKey: [...SUMMARY_KEY, month],
    queryFn: () => api<FinanceSummary>("/finance/summary", { query: { month } }),
    placeholderData: (previous) => previous,
  });
}

export function useRecurring() {
  return useQuery({ queryKey: RECURRING_KEY, queryFn: () => api<Recurring[]>("/finance/recurring") });
}

export function useSaveTransaction() {
  return useApiMutation(({ id, ...body }: TransactionInput & { id?: string }) =>
    id
      ? api<Transaction>(`/finance/transactions/${id}`, { method: "PATCH", body })
      : api<Transaction>("/finance/transactions", { method: "POST", body }), { invalidate: MONEY_KEYS });
}

export function useDeleteTransaction() {
  return useApiMutation((id: string) => api(`/finance/transactions/${id}`, { method: "DELETE" }), {
    invalidate: MONEY_KEYS,
    success: "Movimiento eliminado",
  });
}

export function useSaveCategory() {
  return useApiMutation(
    ({ id, type, ...body }: { id?: string; name: string; type: MovementType; color: string; emoji: string }) =>
      id
        ? api<Category>(`/finance/categories/${id}`, { method: "PATCH", body })
        : api<Category>("/finance/categories", { method: "POST", body: { ...body, type } }),
    { invalidate: [CATEGORIES_KEY, SUMMARY_KEY] },
  );
}

export function useDeleteCategory() {
  return useApiMutation((id: string) => api(`/finance/categories/${id}`, { method: "DELETE" }), {
    invalidate: [CATEGORIES_KEY],
    success: "Categoría eliminada",
  });
}

export function useSaveRecurring() {
  return useApiMutation(({ id, ...body }: Partial<RecurringInput> & { id?: string }) =>
    id
      ? api<Recurring>(`/finance/recurring/${id}`, { method: "PATCH", body })
      : api<Recurring>("/finance/recurring", { method: "POST", body }), { invalidate: [RECURRING_KEY] });
}

export function useDeleteRecurring() {
  return useApiMutation((id: string) => api(`/finance/recurring/${id}`, { method: "DELETE" }), {
    invalidate: [RECURRING_KEY],
    success: "Recurrente eliminado",
  });
}

export function useRunRecurring() {
  return useApiMutation(() => api<{ created: number }>("/finance/recurring/run", { method: "POST" }), {
    invalidate: [RECURRING_KEY, ...MONEY_KEYS],
  });
}

export function useSetCarry() {
  return useApiMutation((body: { month: string; carry: boolean }) => api("/finance/carry", { method: "PUT", body }), {
    invalidate: MONEY_KEYS,
  });
}
