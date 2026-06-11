// components/today/ProgressBadge.tsx

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateProgress } from '@/lib/progress';
import { colors, fontSize, radius } from '@/constants/colors';
import type { ProgressDirection, WorkoutSet } from '@/types';

interface ProgressBadgeProps {
  previousSets: WorkoutSet[];
  currentSets: WorkoutSet[];
}

const DIRECTION_STYLE: Record<
  ProgressDirection,
  { color: string; icon: keyof typeof Ionicons.glyphMap | null }
> = {
  up: { color: colors.up, icon: 'arrow-up' },
  down: { color: colors.down, icon: 'arrow-down' },
  neutral: { color: colors.neutral, icon: null },
  new: { color: colors.new, icon: 'sparkles' },
};

export function ProgressBadge({ previousSets, currentSets }: ProgressBadgeProps) {
  const { label, direction } = calculateProgress(previousSets, currentSets);
  const meta = DIRECTION_STYLE[direction];
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [label, direction, opacity]);

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: `${meta.color}22`, borderColor: `${meta.color}55`, opacity },
      ]}
    >
      {meta.icon ? <Ionicons name={meta.icon} size={13} color={meta.color} /> : null}
      <Text style={[styles.label, { color: meta.color }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
