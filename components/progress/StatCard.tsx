// components/progress/StatCard.tsx

import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, radius, shadow, spacing } from '@/constants/colors';

interface StatCardProps {
  title: string;
  /** Optionele grote waarde rechtsboven, bv. "12.345 kg". */
  value?: string;
  /** Optioneel bijschrift onder de titel. */
  subtitle?: string;
  children: ReactNode;
}

export function StatCard({ title, value, subtitle, children }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fonts.jakarta700,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontFamily: fonts.grotesk700,
  },
});
