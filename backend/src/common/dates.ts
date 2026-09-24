// Zona horaria de la app: define qué es "hoy" para hábitos, finanzas y cron jobs.
export const APP_TIMEZONE = 'America/Argentina/Buenos_Aires';

/** Devuelve la fecha actual como 'YYYY-MM-DD' en la zona horaria de la app. */
export function todayISO(date = new Date()): string {
  // en-CA formatea las fechas como YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(date);
}

/** Suma (o resta) días a una fecha 'YYYY-MM-DD'. */
export function addDays(day: string, amount: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

/** Día de la semana de una fecha 'YYYY-MM-DD' (0 = domingo … 6 = sábado). */
export function weekday(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}
