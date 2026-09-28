let iosSwitch: HTMLLabelElement | null = null;

/**
 * Vibración cortita al completar algo. En Android usa navigator.vibrate.
 * Safari (iPhone) no lo tiene, pero desde iOS 18 da una vibración al tocar un
 * <input type="checkbox" switch>: tocamos uno escondido. Si no hay soporte, no pasa nada.
 * Tiene que llamarse dentro de un toque del usuario (onClick, onPointerUp…).
 */
export function haptic() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(8);
      return;
    }
    if (typeof document === "undefined") return;
    if (!iosSwitch) {
      iosSwitch = document.createElement("label");
      iosSwitch.setAttribute("aria-hidden", "true");
      iosSwitch.style.display = "none";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("switch", "");
      iosSwitch.appendChild(input);
      document.body.appendChild(iosSwitch);
    }
    iosSwitch.click();
  } catch {
    // sin vibración
  }
}
