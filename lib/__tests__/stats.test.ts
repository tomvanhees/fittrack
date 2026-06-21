// lib/__tests__/stats.test.ts

import {
  bucketsFor,
  consistencyDeltaLabel,
  fillPeriods,
  formatNumberNL,
  formatVolumeFull,
  formatVolumeShort,
  goalStanding,
  lastNMonths,
  lastNYears,
  maxValue,
  rangeStartISO,
  strengthDeltaLabel,
  sumValues,
  volumeDeltaLabel,
} from '@/lib/stats';

describe('stats helpers', () => {
  const ref = new Date(2026, 5, 14); // 14 juni 2026

  it('genereert de laatste 12 maanden, oudste eerst', () => {
    const b = lastNMonths(12, ref);
    expect(b).toHaveLength(12);
    expect(b[0].period).toBe('2025-07');
    expect(b[11].period).toBe('2026-06');
    expect(b[11].label).toBe('jun');
  });

  it('rolt correct over de jaargrens', () => {
    const b = lastNMonths(3, new Date(2026, 0, 10)); // januari
    expect(b.map((x) => x.period)).toEqual(['2025-11', '2025-12', '2026-01']);
  });

  it('genereert de laatste 5 jaren met korte labels', () => {
    const b = lastNYears(5, ref);
    expect(b.map((x) => x.period)).toEqual(['2022', '2023', '2024', '2025', '2026']);
    expect(b[4].label).toBe("'26");
  });

  it('kiest buckets op basis van granulariteit', () => {
    expect(bucketsFor('month', ref)).toHaveLength(12);
    expect(bucketsFor('year', ref)).toHaveLength(5);
  });

  it('vult ontbrekende periodes met 0', () => {
    const buckets = lastNMonths(3, new Date(2026, 0, 10)); // 2025-11, 2025-12, 2026-01
    const filled = fillPeriods(buckets, [{ period: '2025-12', value: 42 }]);
    expect(filled.map((f) => f.value)).toEqual([0, 42, 0]);
  });

  it('bepaalt de venster-startdatum voor maand en jaar', () => {
    expect(rangeStartISO([{ period: '2025-07', label: 'jul' }])).toBe('2025-07-01');
    expect(rangeStartISO([{ period: '2022', label: "'22" }])).toBe('2022-01-01');
    expect(rangeStartISO([])).toBe('0000-01-01');
  });

  it('formatteert getallen met NL-duizendtalscheiding', () => {
    expect(formatNumberNL(12345)).toBe('12.345');
    expect(formatNumberNL(999)).toBe('999');
    expect(formatNumberNL(1000000)).toBe('1.000.000');
  });

  it('formatteert volume compact en volledig', () => {
    expect(formatVolumeShort(850)).toBe('850');
    expect(formatVolumeShort(12345)).toBe('12k');
    expect(formatVolumeShort(2500)).toBe('2,5k');
    expect(formatVolumeFull(12345)).toBe('12.345 kg');
  });

  it('berekent som en maximum', () => {
    expect(sumValues([1, 2, 3])).toBe(6);
    expect(maxValue([1, 5, 3])).toBe(5);
    expect(maxValue([])).toBe(0);
  });
});

describe('doel-stand (goalStanding)', () => {
  it('berekent een gedeeltelijke voortgang', () => {
    const s = goalStanding(88, 100);
    expect(s.pct).toBeCloseTo(0.88);
    expect(s.remaining).toBe(12);
    expect(s.reached).toBe(false);
  });

  it('klemt op 100% en remaining op 0 wanneer bereikt of voorbij', () => {
    const exact = goalStanding(100, 100);
    expect(exact.pct).toBe(1);
    expect(exact.remaining).toBe(0);
    expect(exact.reached).toBe(true);

    const over = goalStanding(120, 100);
    expect(over.pct).toBe(1);
    expect(over.remaining).toBe(0);
    expect(over.reached).toBe(true);
  });

  it('behandelt een target <= 0 als direct bereikt', () => {
    const s = goalStanding(0, 0);
    expect(s.pct).toBe(1);
    expect(s.reached).toBe(true);
  });
});

describe('doel-delta labels', () => {
  it('toont resterende kracht en bereikt-status', () => {
    expect(strengthDeltaLabel(12, false)).toBe('12 kg te gaan');
    expect(strengthDeltaLabel(0, true)).toBe('Doel bereikt 🎉');
  });

  it('toont consistentie in hele workouts (afgerond omhoog)', () => {
    expect(consistencyDeltaLabel(1, false)).toBe('1 workout te gaan');
    expect(consistencyDeltaLabel(2.1, false)).toBe('3 workouts te gaan');
    expect(consistencyDeltaLabel(0, true)).toBe('Doel bereikt 🎉');
  });

  it('toont resterend volume', () => {
    expect(volumeDeltaLabel(12345, false)).toBe('12.345 kg te gaan');
    expect(volumeDeltaLabel(0, true)).toBe('Doel bereikt 🎉');
  });
});
