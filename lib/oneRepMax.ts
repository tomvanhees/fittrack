// lib/oneRepMax.ts
//
// Schatting van het één-herhalingsmaximum (1RM) op basis van een set. We
// gebruiken de Epley-formule: 1RM = gewicht × (1 + reps / 30). Bij één
// herhaling is het gewicht zelf al het maximum; ongeldige invoer geeft 0.

/** Geschat 1RM (kg) voor een set van `weight` × `reps`. */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Hoogste geschatte 1RM over een reeks sets (gewicht/reps-paren). */
export function bestEstimatedOneRepMax(
  sets: { weight: number; reps: number }[]
): number {
  return sets.reduce((max, s) => Math.max(max, estimateOneRepMax(s.weight, s.reps)), 0);
}
