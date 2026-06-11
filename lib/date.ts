// lib/date.ts
// Datum-helpers. Weekdag-index volgt de DB-conventie: 0 = zondag ... 6 = zaterdag.

import { WEEKDAY_LABELS_LONG, MONTH_LABELS } from '@/constants/categories';

/** ISO datum "YYYY-MM-DD" voor een Date (lokale tijd). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ISO datum van vandaag. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Parse een ISO datum naar een Date op lokale middernacht. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Weekdag-index (0=zo..6=za) voor een ISO datum. */
export function weekdayOf(iso: string): number {
  return fromISODate(iso).getDay();
}

/** ISO-8601 weeknummer (week begint maandag). */
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // ma=0..zo=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // donderdag van deze week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
}

/** Maandag (ISO weekstart) van de week waarin `date` valt. */
export function startOfISOWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNum = (d.getDay() + 6) % 7; // ma=0..zo=6
  d.setDate(d.getDate() - dayNum);
  return d;
}

/** De 7 ISO-datums (ma..zo) van de week waarin `iso` valt. */
export function weekDatesOf(iso: string): string[] {
  const monday = startOfISOWeek(fromISODate(iso));
  const result: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    result.push(toISODate(d));
  }
  return result;
}

/** Verschuif een ISO datum met een aantal dagen. */
export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** "Donderdag 11 juni" */
export function formatLongDate(iso: string): string {
  const d = fromISODate(iso);
  return `${WEEKDAY_LABELS_LONG[d.getDay()]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
}

/** "Week 24 — juni 2026" */
export function formatWeekLabel(iso: string): string {
  const d = fromISODate(iso);
  const week = isoWeekNumber(d);
  const monday = startOfISOWeek(d);
  return `Week ${week} — ${MONTH_LABELS[monday.getMonth()]} ${monday.getFullYear()}`;
}
