"use client";

import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UndoableDeleteOptions {
  /** Lista del cache de donde sacar el item (se aplica a todas las variantes: meses, rangos…). */
  queryKey: QueryKey;
  /** Borrado real en el backend. */
  request: (id: string) => Promise<unknown>;
  /** Texto del aviso, ej: "Tarea eliminada". */
  message: string;
  /** Otras queries a refrescar después de borrar. */
  invalidate?: QueryKey[];
}

/**
 * Borrado con "Deshacer": el item desaparece al instante y el backend recién se
 * entera cuando se va el aviso (4 s). Si tocás Deshacer, vuelve y no se borra nada.
 */
export function useUndoableDelete<T extends { id: string }>({ queryKey, request, message, invalidate = [] }: UndoableDeleteOptions) {
  const queryClient = useQueryClient();

  return (id: string) => {
    const snapshot = queryClient.getQueriesData<T[]>({ queryKey });
    const restore = () => snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    queryClient.setQueriesData<T[]>({ queryKey }, (list) => list?.filter((item) => item.id !== id));

    let settled = false;
    const commit = async () => {
      if (settled) return;
      settled = true;
      try {
        await request(id);
      } catch (error) {
        restore();
        toast.error((error as Error).message);
      } finally {
        for (const key of [queryKey, ...invalidate]) queryClient.invalidateQueries({ queryKey: key });
      }
    };

    toast(message, {
      duration: 4000,
      action: {
        label: "Deshacer",
        onClick: () => {
          settled = true;
          restore();
        },
      },
      onAutoClose: commit,
      onDismiss: commit,
    });
  };
}
