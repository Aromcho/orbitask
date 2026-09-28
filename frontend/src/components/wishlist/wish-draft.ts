import { previewLink } from "@/lib/queries/wishlist";
import type { WishDraft } from "./wish-dialog";

/** Primer link http(s) dentro de un texto ("Mirá esto https://…" → el link). */
export function extractUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  return match ? match[0] : null;
}

/**
 * Arma el borrador de un deseo a partir de lo que se pegó o escribió:
 * si hay un link, lee la tienda (foto, título, precio); si no, es el título.
 */
export async function draftFromInput(text: string): Promise<WishDraft> {
  const url = extractUrl(text);
  if (!url) return { url: "", title: text.trim(), preview: null, previewError: null };
  try {
    return { url, title: "", preview: await previewLink(url), previewError: null };
  } catch (err) {
    return { url, title: "", preview: null, previewError: (err as Error).message };
  }
}

/** Lee el portapapeles. En iPhone Safari muestra el globito "Pegar" para confirmar. */
export async function readClipboard() {
  try {
    return (await navigator.clipboard.readText()).trim() || null;
  } catch {
    return null;
  }
}
