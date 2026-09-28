import { toast } from "sonner";
import { haptic } from "./haptics";

const COLORS = ["#8b7cf6", "#2dd4bf", "#fbbf24", "#fb7185", "#38bdf8", "#f472b6"];

/** Un estallido chico de papelitos en el centro de la pantalla (animación en globals.css). */
export function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const burst = document.createElement("div");
  burst.setAttribute("aria-hidden", "true");
  burst.style.cssText = "position:fixed;left:50%;top:40%;width:0;height:0;z-index:100;pointer-events:none";
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 70 + Math.random() * 150;
    piece.style.cssText = [
      "position:absolute",
      `width:${5 + Math.random() * 4}px`,
      `height:${8 + Math.random() * 6}px`,
      "border-radius:2px",
      `background:${COLORS[i % COLORS.length]}`,
      `--dx:${Math.cos(angle) * distance}px`,
      `--dy:${Math.sin(angle) * distance + 140}px`,
      `--rot:${Math.random() * 720 - 360}deg`,
      `animation:confetti-fall ${900 + Math.random() * 500}ms cubic-bezier(.2,.6,.3,1) forwards`,
    ].join(";");
    burst.appendChild(piece);
  }
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1600);
}

/**
 * Llamar al marcar un hábito de hoy. Si con este check se completan todos
 * los hábitos del día, festeja.
 */
export function celebrateIfDayComplete(doneAfter: number, total: number) {
  haptic();
  if (total > 0 && doneAfter === total) {
    celebrate();
    toast.success("¡Día completo! Hiciste todos tus hábitos 🔥");
  }
}
