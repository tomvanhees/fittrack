// components/templates/TemplateDayEditor.tsx

import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WEEKDAY_LABELS, WEEKDAY_LABELS_LONG } from '@/constants/categories';
import { colors, fontSize, radius, spacing } from '@/constants/colors';
import type { TemplateWithDays } from '@/types';

// Weergavevolgorde: maandag..zondag, met DB-weekday-index erin.
const ORDERED_WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

interface TemplateDayEditorProps {
  template: TemplateWithDays;
  selectedWeekday: number;
  onSelectWeekday: (weekday: number) => void;
  onAddExercise: () => void;
  onRemoveExercise: (templateDayExerciseId: number) => void;
  onChangeSets: (templateDayExerciseId: number, sets: number) => void;
  onChangeLabel: (label: string) => void;
}

export function TemplateDayEditor({
  template,
  selectedWeekday,
  onSelectWeekday,
  onAddExercise,
  onRemoveExercise,
  onChangeSets,
  onChangeLabel,
}: TemplateDayEditorProps) {
  const day = template.days.find((d) => d.weekday === selectedWeekday);
  const exercises = day?.exercises ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.weekBar}>
        {ORDERED_WEEKDAYS.map((wd) => {
          const dayForWd = template.days.find((d) => d.weekday === wd);
          const hasContent = (dayForWd?.exercises.length ?? 0) > 0;
          const isSelected = wd === selectedWeekday;
          return (
            <Pressable
              key={wd}
              onPress={() => onSelectWeekday(wd)}
              style={[styles.weekCell, isSelected && styles.weekCellSelected]}
            >
              <Text style={[styles.weekday, isSelected && styles.textSelected]}>
                {WEEKDAY_LABELS[wd]}
              </Text>
              <Text style={[styles.weekState, isSelected && styles.textSelected]}>
                {hasContent ? '●' : '–'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.dayHeader}>
        <Ionicons name="calendar" size={16} color={colors.primary} />
        <Text style={styles.dayTitle}>
          {WEEKDAY_LABELS_LONG[selectedWeekday]}
          {day?.label ? ` — ${day.label}` : ''}
        </Text>
      </View>

      <View style={styles.divider} />

      {exercises.length === 0 ? (
        <Text style={styles.empty}>Nog geen oefeningen voor deze dag.</Text>
      ) : (
        <View style={styles.list}>
          {exercises.map((ex, i) => (
            <View key={ex.id} style={styles.item}>
              <Text style={styles.itemIndex}>{i + 1}.</Text>
              <Text style={styles.itemName} numberOfLines={1}>
                {ex.exercise.name}
              </Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => onChangeSets(ex.id, ex.sets - 1)}
                  hitSlop={6}
                  style={styles.stepBtn}
                  disabled={ex.sets <= 1}
                >
                  <Ionicons
                    name="remove"
                    size={16}
                    color={ex.sets <= 1 ? colors.textFaint : colors.primary}
                  />
                </Pressable>
                <Text style={styles.stepValue}>{ex.sets}</Text>
                <Pressable
                  onPress={() => onChangeSets(ex.id, ex.sets + 1)}
                  hitSlop={6}
                  style={styles.stepBtn}
                  disabled={ex.sets >= 9}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={ex.sets >= 9 ? colors.textFaint : colors.primary}
                  />
                </Pressable>
              </View>
              <Text style={styles.setsLabel}>sets</Text>
              <Pressable onPress={() => onRemoveExercise(ex.id)} hitSlop={8}>
                <Ionicons name="remove-circle-outline" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.addBtn} onPress={onAddExercise}>
        <Ionicons name="add" size={18} color={colors.primary} />
        <Text style={styles.addBtnText}>Oefening toevoegen</Text>
      </Pressable>

      <Text style={styles.fieldLabel}>Dag label</Text>
      <TextInput
        value={day?.label ?? ''}
        onChangeText={onChangeLabel}
        placeholder="bv. Push, Pull, Legs"
        placeholderTextColor={colors.textFaint}
        style={styles.labelInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  weekBar: {
    flexDirection: 'row',
    gap: 4,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekday: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  weekState: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
  },
  textSelected: {
    color: colors.primaryText,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontStyle: 'italic',
  },
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemIndex: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    width: 22,
  },
  itemName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    minWidth: 18,
    textAlign: 'center',
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  setsLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceAlt,
  },
  addBtnText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  labelInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
});
