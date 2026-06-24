// components/today/RecordBadge.tsx
//
// Toont een "PR"-badge wanneer de beste geschatte 1RM van de huidige sessie
// het vorige all-time record overtreft. Verschijnt enkel als er een eerder
// record bestond (anders dekt de "Nieuw"-badge dat al).

import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bestEstimatedOneRepMax } from '@/lib/oneRepMax';
import { colors, fontSize, radius } from '@/constants/colors';
import type { WorkoutSet } from '@/types';

interface RecordBadgeProps {
  currentSets: WorkoutSet[];
  priorBest1RM?: number;
}

export function RecordBadge({ currentSets, priorBest1RM }: RecordBadgeProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const current = bestEstimatedOneRepMax(currentSets);
  const isPR = !!priorBest1RM && priorBest1RM > 0 && current > priorBest1RM + 0.01;

  useEffect(() => {
    if (!isPR) return;
    opacity.setValue(0);
    Animated.spring(opacity, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, [isPR, opacity]);

  if (!isPR) return null;

  return (
    <Animated.View style={[styles.badge, { opacity }]}>
      <Ionicons name="trophy" size={13} color={colors.secondary} />
      <Text style={styles.label}>PR · {Math.round(current)} kg</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: `${colors.secondary}22`,
    borderColor: `${colors.secondary}55`,
  },
  label: {
    color: colors.secondary,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
});
