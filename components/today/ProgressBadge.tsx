// components/today/ProgressBadge.tsx

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateProgress } from '@/lib/progress';
import { colors, fonts } from '@/constants/colors';
import type { ProgressDirection, WorkoutSet } from '@/types';

interface ProgressBadgeProps {
  previousSets: WorkoutSet[];
  currentSets: WorkoutSet[];
  accent: string;
}

interface VariantStyle {
  bg: string;
  fg: string;
  icon: keyof typeof Ionicons.glyphMap;
  label?: string; // override
}

export function ProgressBadge({ previousSets, currentSets, accent }: ProgressBadgeProps) {
  const { label, direction } = calculateProgress(previousSets, currentSets);

  const variants: Record<ProgressDirection, VariantStyle> = {
    new: { bg: accent, fg: '#fff', icon: 'sparkles', label: 'NIEUW' },
    up: { bg: colors.prUpBg, fg: colors.prUpText, icon: 'trending-up' },
    down: { bg: colors.prDownBg, fg: colors.prDownText, icon: 'trending-down' },
    neutral: { bg: colors.prEqualBg, fg: colors.prEqualText, icon: 'remove', label: 'Gelijk' },
  };
  const v = variants[direction];

  const scale = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    scale.setValue(0.8);
    Animated.timing(scale, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [label, direction, scale]);

  // Nieuwe oefeningen krijgen geen badge meer — enkel echte voortgang tonen.
  if (direction === 'new') return null;

  return (
    <Animated.View style={[styles.badge, { backgroundColor: v.bg, transform: [{ scale }] }]}>
      <Ionicons name={v.icon} size={14} color={v.fg} />
      <Text style={[styles.label, { color: v.fg }]}>{v.label ?? label}</Text>
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
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.jakarta800,
  },
});
