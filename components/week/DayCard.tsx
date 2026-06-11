// components/week/DayCard.tsx

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatLongDate } from '@/lib/date';
import { colors, fontSize, radius, spacing } from '@/constants/colors';
import type { WeekDayInfo } from '@/store/workoutStore';

interface DayCardProps {
  day: WeekDayInfo;
  onEdit: () => void;
  onApplyTemplate: () => void;
  onToggleRest: () => void;
}

export function DayCard({ day, onEdit, onApplyTemplate, onToggleRest }: DayCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={18} color={colors.primary} />
        <Text style={styles.date}>{formatLongDate(day.date)}</Text>
        {day.isCompleted ? (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark" size={12} color={colors.success} />
            <Text style={styles.completedText}>Afgerond</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.divider} />

      {day.isRestDay ? (
        <EmptyState icon="moon" title="Rustdag" subtitle="Geen workout gepland." />
      ) : day.exerciseNames.length === 0 ? (
        <EmptyState
          icon="add-circle-outline"
          title="Nog niets gepland"
          subtitle="Voeg oefeningen toe of pas een template toe."
        />
      ) : (
        <View style={styles.list}>
          {day.exerciseNames.map((name, i) => (
            <View key={`${name}-${i}`} style={styles.item}>
              <View style={styles.bullet} />
              <Text style={styles.itemText}>{name}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onEdit}>
          <Ionicons name="create-outline" size={16} color={colors.primaryText} />
          <Text style={styles.btnPrimaryText}>Bewerken</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onApplyTemplate}>
          <Ionicons name="clipboard-outline" size={16} color={colors.text} />
          <Text style={styles.btnSecondaryText}>Template</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onToggleRest}>
          <Ionicons name="moon-outline" size={16} color={colors.text} />
          <Text style={styles.btnSecondaryText}>{day.isRestDay ? 'Actief' : 'Rust'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  date: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${colors.success}22`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  completedText: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  itemText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: colors.primaryText,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
