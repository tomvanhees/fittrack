// lib/__tests__/date.test.ts

import {
  addDays,
  formatLongDate,
  formatWeekLabel,
  fromISODate,
  isoWeekNumber,
  toISODate,
  weekDatesOf,
  weekdayOf,
} from '@/lib/date';

describe('date helpers', () => {
  it('rondt heen-en-weer tussen ISO-string en Date', () => {
    const iso = '2026-06-11';
    expect(toISODate(fromISODate(iso))).toBe(iso);
  });

  it('berekent de weekdag-index (0=zo..6=za)', () => {
    // 11 juni 2026 is een donderdag.
    expect(weekdayOf('2026-06-11')).toBe(4);
    // 14 juni 2026 is een zondag.
    expect(weekdayOf('2026-06-14')).toBe(0);
  });

  it('berekent het ISO-8601 weeknummer', () => {
    // Conform het technisch document: week 24.
    expect(isoWeekNumber(fromISODate('2026-06-11'))).toBe(24);
    // Eerste week van het jaar.
    expect(isoWeekNumber(fromISODate('2026-01-01'))).toBe(1);
  });

  it('geeft de 7 datums van een week terug (ma..zo)', () => {
    expect(weekDatesOf('2026-06-11')).toEqual([
      '2026-06-08',
      '2026-06-09',
      '2026-06-10',
      '2026-06-11',
      '2026-06-12',
      '2026-06-13',
      '2026-06-14',
    ]);
  });

  it('houdt dezelfde week aan ongeacht de gekozen dag erin', () => {
    expect(weekDatesOf('2026-06-08')).toEqual(weekDatesOf('2026-06-14'));
  });

  it('verschuift datums en respecteert maandgrenzen', () => {
    expect(addDays('2026-06-11', -7)).toBe('2026-06-04');
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('formatteert een lange Nederlandse datum', () => {
    expect(formatLongDate('2026-06-11')).toBe('Donderdag 11 juni');
  });

  it('formatteert een weeklabel', () => {
    expect(formatWeekLabel('2026-06-11')).toBe('Week 24 — juni 2026');
  });
});
