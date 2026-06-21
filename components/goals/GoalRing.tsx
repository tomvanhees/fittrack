// components/goals/GoalRing.tsx
// Compacte voortgangsring voor één doel: gevulde boog = % bereikt, met de
// huidige/target-waarde in het midden en een korte delta-tekst eronder.

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fontSize } from '@/constants/colors';

interface GoalRingProps {
  /** 0..1, geklemd door de aanroeper (zie goalStanding). */
  pct: number;
  /** Korte titel boven de ring, bv. "Bankdrukken". */
  title: string;
  /** Centrale waarde, bv. "88 / 100 kg". */
  centerLabel: string;
  /** Delta-tekst onder de ring, bv. "12 kg te gaan". */
  deltaLabel: string;
  reached?: boolean;
  size?: number;
  color?: string;
}

export function GoalRing({
  pct,
  title,
  centerLabel,
  deltaLabel,
  reached = false,
  size = 116,
  color = colors.primary,
}: GoalRingProps) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const ringColor = reached ? colors.success : color;
  const dash = Math.max(0, Math.min(1, pct)) * circ;

  return (
    <View style={[styles.wrap, { width: size }]}>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* spoor */}
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={colors.surfaceAlt}
            strokeWidth={stroke}
            fill="none"
          />
          {/* voortgang — start bovenaan (12 uur), met de klok mee */}
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${circ}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.pct}>{Math.round(pct * 100)}%</Text>
          <Text style={styles.centerLabel} numberOfLines={1}>
            {centerLabel}
          </Text>
        </View>
      </View>
      {deltaLabel ? (
        <Text
          style={[styles.delta, reached && { color: colors.success }]}
          numberOfLines={1}
        >
          {deltaLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
    maxWidth: '100%',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  centerLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: 1,
  },
  delta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
