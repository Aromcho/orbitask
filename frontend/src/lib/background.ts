/**
 * Fondos disponibles. Las imágenes viven en /public/backgrounds/<id>.webp
 * (y <id>-thumb.webp para el selector). Para sumar uno nuevo: agregá los
 * dos archivos y una entrada acá. `light: true` = imagen clara: se oscurece más
 * en modo oscuro para que el texto se siga leyendo.
 */
export const BACKGROUNDS = [
  { id: "none", label: "Sin fondo" },
  { id: "burbujas", label: "Burbujas" },
  { id: "amatista", label: "Amatista" },
  { id: "fibra-optica", label: "Fibra óptica" },
  { id: "gemas", label: "Gemas" },
  { id: "prisma", label: "Prisma", light: true },
  { id: "spider-verse", label: "Spider-Verse", light: true },
] as const;

export type BackgroundId = (typeof BACKGROUNDS)[number]["id"];

export const DEFAULT_BACKGROUND: BackgroundId = "none";
export const BACKGROUND_STORAGE_KEY = "orbitask-bg";
export const BACKGROUND_CHANGE_EVENT = "orbitask-bg-change";

export function isBackgroundId(value: unknown): value is BackgroundId {
  return BACKGROUNDS.some((b) => b.id === value);
}

export function isLightBackground(id: BackgroundId) {
  return BACKGROUNDS.some((b) => b.id === id && "light" in b && b.light);
}

export function backgroundUrl(id: BackgroundId) {
  return `/backgrounds/${id}.webp`;
}

/** Recorte vertical (9:16) para el celu: <id>-mobile.webp, mucho más liviano. */
export function backgroundMobileUrl(id: BackgroundId) {
  return `/backgrounds/${id}-mobile.webp`;
}

/**
 * Script que corre antes de pintar la página, para que el fondo guardado
 * aparezca de entrada (sin "parpadeo").
 */
export const backgroundInitScript = `try{var b=localStorage.getItem(${JSON.stringify(BACKGROUND_STORAGE_KEY)});if(${JSON.stringify(
  BACKGROUNDS.map((b) => b.id).filter((id) => id !== "none"),
)}.indexOf(b)>-1){var d=document.documentElement;d.style.setProperty("--bg-image",'url("/backgrounds/'+b+'.webp")');d.style.setProperty("--bg-image-mobile",'url("/backgrounds/'+b+'-mobile.webp")');if(${JSON.stringify(
  BACKGROUNDS.filter((b) => "light" in b && b.light).map((b) => b.id),
)}.indexOf(b)>-1)d.dataset.bgTone="light"}}catch(e){}`;
