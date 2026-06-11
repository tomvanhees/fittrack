// components/week/WeekBar.tsx

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WEEKDAY_LABELS } from '@/constants/categories';
import { fromISODate } from '@/lib/date';
import { colors, fontSize, radius, spacing } from '@/constants/colors';
import type { WeekDayInfo } from '@/store/workoutStore';

interface WeekBarProps {
  weekDays: WeekDayInfo[];
  selectedDate: string;
  todayDate: string;
  weekLabel: string;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

function statusIcon(d: WeekDayInfo): { name: keyof typeof Ionicons.glyphMap; color: string } {
  if (d.isCompleted) return { name: 'checkmark-circle', color: colors.success };
  if (d.isRestDay || !d.hasWorkout) return { name: 'moon', color: colors.rest };
  return { name: 'barbell', color: colors.primary };
}

export function WeekBar({
  weekDays,
  selectedDate,
  todayDate,
  weekLabel,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: WeekBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <Pressable onPress={onPrevWeek} hitSlop={8} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <Pressable onPress={onNextWeek} hitSlop={8} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.days}>
        {weekDays.map((d) => {
          const isSelected = d.date === selectedDate;
          const isToday = d.date === todayDate;
          const icon = statusIcon(d);
          const dayNum = fromISODate(d.date).getDate();
          return (
            <Pressable
              key={d.date}
              onPress={() => onSelectDate(d.date)}
              style={[styles.day, isSelected && styles.daySelected]}
            >
              <Text style={[styles.weekday, isSelected && styles.textSelected]}>
                {WEEKDAY_LABELS[d.weekday]}
              </Text>
              <Text style={[styles.dayNum, isSelected && styles.textSelected]}>{dayNum}</Text>
              <Ionicons name={icon.name} size={15} color={isSelected ? colors.primaryText : icon.color} />
              <View style={[styles.todayDot, isToday ? styles.todayDotOn : undefined]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    padding: spacing.xs,
  },
  weekLabel: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  daySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekday: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  dayNum: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  textSelected: {
    color: colors.primaryText,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  todayDotOn: {
    backgroundColor: colors.new,
  },
});
