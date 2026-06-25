// lib/__tests__/oneRepMax.test.ts

import { bestEstimatedOneRepMax, estimateOneRepMax } from '@/lib/oneRepMax';

describe('estimateOneRepMax', () => {
  it('geeft het gewicht zelf terug bij één herhaling', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });

  it('past de Epley-formule toe bij meerdere herhalingen', () => {
    // 100 × (1 + 5/30) = 116.666…
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.6667, 3);
  });

  it('geeft 0 bij ongeldige invoer (geen gewicht of geen reps)', () => {
    expect(estimateOneRepMax(0, 5)).toBe(0);
    expect(estimateOneRepMax(80, 0)).toBe(0);
    expect(estimateOneRepMax(-10, 5)).toBe(0);
  });

  it('stijgt monotoon met meer reps bij gelijk gewicht', () => {
    expect(estimateOneRepMax(100, 8)).toBeGreaterThan(estimateOneRepMax(100, 5));
  });
});

describe('bestEstimatedOneRepMax', () => {
  it('geeft 0 terug voor een lege set-lijst', () => {
    expect(bestEstimatedOneRepMax([])).toBe(0);
  });

  it('kiest de hoogste geschatte 1RM uit de sets', () => {
    const sets = [
      { weight: 100, reps: 1 }, // 100
      { weight: 90, reps: 5 }, // 105
      { weight: 80, reps: 8 }, // 101.33
    ];
    expect(bestEstimatedOneRepMax(sets)).toBeCloseTo(105, 5);
  });
});
