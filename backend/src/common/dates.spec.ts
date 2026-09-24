import { addDays, todayISO, weekday } from './dates.js';

describe('dates', () => {
  it('todayISO usa la zona horaria de la app', () => {
    // 02:00 UTC del 24/9 todavía es 23/9 en Buenos Aires (UTC-3)
    expect(todayISO(new Date('2026-09-24T02:00:00Z'))).toBe('2026-09-23');
  });

  it('addDays cruza meses y años', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('weekday devuelve 0 para domingo', () => {
    expect(weekday('2026-09-27')).toBe(0);
    expect(weekday('2026-09-23')).toBe(3);
  });
});
