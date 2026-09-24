import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

export const DEFAULT_CURRENCY = "ARS";

/** $ 12.345 (sin decimales si es un número entero). */
export function formatMoney(amount: number, currency = DEFAULT_CURRENCY) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    // Moneda inválida: mostramos el número igual
    return `${currency} ${amount.toLocaleString("es-AR")}`;
  }
}

/** Fecha local como 'YYYY-MM-DD' (lo que usa el backend para hábitos y finanzas). */
export function toDay(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function todayDay() {
  return toDay(new Date());
}

/** 'YYYY-MM-DD' → Date a las 00:00 locales. */
export function fromDay(day: string) {
  return parseISO(day);
}

export function toMonth(date: Date) {
  return format(date, "yyyy-MM");
}

/** Los 7 días (lunes a domingo) de la semana que contiene `date`. */
export function weekDays(date: Date) {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function fmt(date: Date | string, pattern: string) {
  return format(typeof date === "string" ? parseISO(date) : date, pattern, { locale: es });
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
