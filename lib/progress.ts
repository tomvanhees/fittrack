// lib/progress.ts

import type { ProgressResult, WorkoutSet } from '@/types';

/** Formatteert een getal zonder overbodige decimalen (5 i.p.v. 5.0). */
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/**
 * Vergelijkt de huidige sets met de vorige sessie.
 * Prioriteit: maximaal gewicht eerst, daarna totaal aantal reps.
 */
export function calculateProgress(
  previous: WorkoutSet[],
  current: WorkoutSet[]
): ProgressResult {
  if (previous.length === 0) return { label: 'Nieuw', direction: 'new' };
  // Zonder ingevulde huidige sets is er nog niets om te vergelijken.
  if (current.length === 0) return { label: '—', direction: 'neutral' };

  const prevTotalReps = previous.reduce((s, x) => s + x.reps, 0);
  const currTotalReps = current.reduce((s, x) => s + x.reps, 0);
  const repDiff = currTotalReps - prevTotalReps;

  const prevMaxWeight = Math.max(...previous.map((x) => x.weight));
  const currMaxWeight = Math.max(...current.map((x) => x.weight));
  const weightDiff = currMaxWeight - prevMaxWeight;

  if (weightDiff > 0) return { label: `+${fmt(weightDiff)} kg`, direction: 'up' };
  if (weightDiff < 0) return { label: `${fmt(weightDiff)} kg`, direction: 'down' };
  if (repDiff > 0) return { label: `+${repDiff} reps`, direction: 'up' };
  if (repDiff < 0) return { label: `${repDiff} reps`, direction: 'down' };
  return { label: 'Gelijk', direction: 'neutral' };
}
