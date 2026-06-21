// components/goals/goalDisplay.ts
// Vertaalt een GoalProgress naar leesbare labels voor de ring en de lijst.

import {
  consistencyDeltaLabel,
  formatNumberNL,
  formatVolumeFull,
  formatVolumeShort,
  strengthDeltaLabel,
  volumeDeltaLabel,
} from '@/lib/stats';
import type { GoalProgress, Granularity } from '@/types';

function periodWord(g: Granularity | undefined): string {
  return g === 'year' ? 'dit jaar' : 'deze maand';
}

export interface GoalDisplay {
  title: string; // bv. "Bankdrukken"
  subtitle: string; // bv. "Max gewicht" of "Workouts deze maand"
  centerLabel: string; // huidige / target in de ring
  deltaLabel: string; // "12 kg te gaan"
  targetLabel: string; // volledige target-omschrijving voor de lijst
}

export function goalDisplay(p: GoalProgress): GoalDisplay {
  switch (p.goal.type) {
    case 'strength': {
      const reps = p.goal.targetReps;
      const repSuffix = reps ? ` × ${reps}` : '';
      return {
        title: p.exerciseName ?? 'Krachtdoel',
        subtitle: reps ? `Max gewicht × ${reps} reps` : 'Max gewicht',
        centerLabel: `${formatNumberNL(p.current)} / ${formatNumberNL(p.target)} kg${repSuffix}`,
        deltaLabel: strengthDeltaLabel(p.remaining, p.reached),
        targetLabel: `Tot ${formatNumberNL(p.target)} kg${repSuffix}`,
      };
    }
    case 'consistency': {
      return {
        title: 'Consistentie',
        subtitle: `Workouts ${periodWord(p.goal.granularity)}`,
        centerLabel: `${Math.round(p.current)} / ${Math.round(p.target)}`,
        deltaLabel: consistencyDeltaLabel(p.remaining, p.reached),
        targetLabel: `${Math.round(p.target)} workouts ${periodWord(p.goal.granularity)}`,
      };
    }
    case 'volume': {
      return {
        title: 'Volume',
        subtitle: `Getild ${periodWord(p.goal.granularity)}`,
        centerLabel: `${formatVolumeShort(p.current)} / ${formatVolumeShort(p.target)}`,
        deltaLabel: volumeDeltaLabel(p.remaining, p.reached),
        targetLabel: `${formatVolumeFull(p.target)} ${periodWord(p.goal.granularity)}`,
      };
    }
  }
}
