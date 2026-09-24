"use client";

import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Options {
  /** Queries a refrescar cuando la mutación sale bien. */
  invalidate?: QueryKey[];
  /** Mensaje de éxito (opcional). */
  success?: string;
}

/** useMutation con manejo de errores y refresco de datos incluido. */
export function useApiMutation<TVars = void, TData = unknown>(
  mutationFn: (vars: TVars) => Promise<TData>,
  { invalidate = [], success }: Options = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      if (success) toast.success(success);
    },
    onError: (error) => toast.error(error.message),
  });
}
