// lib/__tests__/progress.test.ts

import { calculateProgress } from '@/lib/progress';
import type { WorkoutSet } from '@/types';

function set(partial: Partial<WorkoutSet>): WorkoutSet {
  return {
    id: partial.id ?? 1,
    workoutExerciseId: partial.workoutExerciseId ?? 1,
    setNumber: partial.setNumber ?? 1,
    weight: partial.weight ?? 0,
    reps: partial.reps ?? 0,
    completedAt: partial.completedAt ?? '2026-06-11T10:00:00',
  };
}

describe('calculateProgress', () => {
  it('markeert een oefening zonder vorige sessie als "Nieuw"', () => {
    const result = calculateProgress([], [set({ weight: 80, reps: 8 })]);
    expect(result).toEqual({ label: 'Nieuw', direction: 'new' });
  });

  it('geeft neutraal terug wanneer er nog geen huidige sets zijn', () => {
    const result = calculateProgress([set({ weight: 80, reps: 8 })], []);
    expect(result).toEqual({ label: '—', direction: 'neutral' });
  });

  it('prioriteert een hoger maximaal gewicht (omhoog)', () => {
    const previous = [set({ weight: 80, reps: 8 })];
    const current = [set({ weight: 85, reps: 6 })];
    expect(calculateProgress(previous, current)).toEqual({
      label: '+5 kg',
      direction: 'up',
    });
  });

  it('detecteert een lager maximaal gewicht (omlaag)', () => {
    const previous = [set({ weight: 80, reps: 8 })];
    const current = [set({ weight: 75, reps: 8 })];
    expect(calculateProgress(previous, current)).toEqual({
      label: '-5 kg',
      direction: 'down',
    });
  });

  it('valt terug op het totaal aantal reps bij gelijk gewicht (omhoog)', () => {
    const previous = [set({ weight: 80, reps: 8 }), set({ weight: 80, reps: 6 })];
    const current = [set({ weight: 80, reps: 8 }), set({ weight: 80, reps: 8 })];
    expect(calculateProgress(previous, current)).toEqual({
      label: '+2 reps',
      direction: 'up',
    });
  });

  it('detecteert minder reps bij gelijk gewicht (omlaag)', () => {
    const previous = [set({ weight: 80, reps: 8 })];
    const current = [set({ weight: 80, reps: 5 })];
    expect(calculateProgress(previous, current)).toEqual({
      label: '-3 reps',
      direction: 'down',
    });
  });

  it('geeft "Gelijk" terug bij identieke prestatie', () => {
    const previous = [set({ weight: 80, reps: 8 })];
    const current = [set({ weight: 80, reps: 8 })];
    expect(calculateProgress(previous, current)).toEqual({
      label: 'Gelijk',
      direction: 'neutral',
    });
  });

  it('formatteert decimale gewichtstoename zonder overbodige nullen', () => {
    const previous = [set({ weight: 80, reps: 8 })];
    const current = [set({ weight: 82.5, reps: 8 })];
    expect(calculateProgress(previous, current)).toEqual({
      label: '+2.5 kg',
      direction: 'up',
    });
  });
});
