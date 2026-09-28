"use client";

import { useSyncExternalStore } from "react";
import {
  BACKGROUND_CHANGE_EVENT,
  BACKGROUND_STORAGE_KEY,
  type BackgroundId,
  backgroundMobileUrl,
  backgroundUrl,
  DEFAULT_BACKGROUND,
  isBackgroundId,
  isLightBackground,
} from "./background";

/** Pone la imagen en la variable CSS que usa .orbitask-bg (ver globals.css). */
function applyBackground(id: BackgroundId) {
  const root = document.documentElement;
  root.style.setProperty("--bg-image", id === "none" ? "none" : `url("${backgroundUrl(id)}")`);
  root.style.setProperty("--bg-image-mobile", id === "none" ? "none" : `url("${backgroundMobileUrl(id)}")`);
  if (isLightBackground(id)) root.dataset.bgTone = "light";
  else delete root.dataset.bgTone;
}

function readBackground(): BackgroundId {
  try {
    const stored = localStorage.getItem(BACKGROUND_STORAGE_KEY);
    return isBackgroundId(stored) ? stored : DEFAULT_BACKGROUND;
  } catch {
    return DEFAULT_BACKGROUND; // navegación privada o storage bloqueado
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange); // cambios desde otra pestaña
  window.addEventListener(BACKGROUND_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(BACKGROUND_CHANGE_EVENT, onChange);
  };
}

/** Fondo elegido (se guarda en este navegador) y función para cambiarlo. */
export function useBackground() {
  const background = useSyncExternalStore(subscribe, readBackground, () => DEFAULT_BACKGROUND);

  function setBackground(id: BackgroundId) {
    try {
      localStorage.setItem(BACKGROUND_STORAGE_KEY, id);
    } catch {
      // si no se puede guardar, igual lo aplicamos para esta sesión
    }
    applyBackground(id);
    window.dispatchEvent(new Event(BACKGROUND_CHANGE_EVENT));
  }

  return [background, setBackground] as const;
}
