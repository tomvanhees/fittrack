// lib/stats.ts
// Pure helpers voor het Voortgang-scherm: periode-buckets genereren, DB-rijen
// invullen en waarden formatteren. Geen DB-afhankelijkheid → goed unit-testbaar.

import { MONTH_LABELS } from '@/constants/categories';

export type Granularity = 'month' | 'year';

export interface Bucket {
  period: string; // sleutel: "2026-06" (maand) of "2026" (jaar)
  label: string; // korte as-label: "jun" of "'26"
}

export interface PeriodValue {
  period: string;
  label: string;
  value: number;
}

/** Korte maandnaam, bv. "juni" → "jun". */
function monthShort(monthIndex: number): string {
  return MONTH_LABELS[monthIndex].slice(0, 3);
}

/** De laatste `n` maanden t.o.v. `ref`, oudste eerst. */
export function lastNMonths(n: number, ref: Date): Bucket[] {
  const out: Bucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    out.push({
      period: `${y}-${String(m + 1).padStart(2, '0')}`,
      label: monthShort(m),
    });
  }
  return out;
}

/** De laatste `n` jaren t.o.v. `ref`, oudste eerst. */
export function lastNYears(n: number, ref: Date): Bucket[] {
  const out: Bucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const y = ref.getFullYear() - i;
    out.push({ period: String(y), label: `'${String(y).slice(2)}` });
  }
  return out;
}

/** Buckets voor de gekozen granulariteit (12 maanden of 5 jaar). */
export function bucketsFor(granularity: Granularity, ref: Date): Bucket[] {
  return granularity === 'month' ? lastNMonths(12, ref) : lastNYears(5, ref);
}

/**
 * Koppelt DB-rijen aan de buckets; ontbrekende periodes krijgen waarde 0 zodat
 * de grafiek een doorlopende reeks toont.
 */
export function fillPeriods(
  buckets: Bucket[],
  rows: { period: string; value: number }[]
): PeriodValue[] {
  const map = new Map(rows.map((r) => [r.period, r.value]));
  return buckets.map((b) => ({
    period: b.period,
    label: b.label,
    value: map.get(b.period) ?? 0,
  }));
}

/** ISO-startdatum van het venster dat de buckets beslaan (eerste dag, eerste bucket). */
export function rangeStartISO(buckets: Bucket[]): string {
  if (buckets.length === 0) return '0000-01-01';
  const first = buckets[0].period;
  return first.length === 4 ? `${first}-01-01` : `${first}-01`;
}

/** Getalnotatie met punt als duizendtalscheiding (NL), bv. 12345 → "12.345". */
export function formatNumberNL(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Compacte volumeweergave voor as-labels, bv. 12345 → "12,3k". */
export function formatVolumeShort(kg: number): string {
  if (kg >= 1000) {
    const k = kg / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1).replace('.', ',')}k`;
  }
  return String(Math.round(kg));
}

/** Volledige volumeweergave, bv. 12345 → "12.345 kg". */
export function formatVolumeFull(kg: number): string {
  return `${formatNumberNL(kg)} kg`;
}

/** Som van de waarden. */
export function sumValues(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/** Hoogste waarde, of 0 bij lege reeks. */
export function maxValue(values: number[]): number {
  return values.reduce((m, v) => (v > m ? v : m), 0);
}
