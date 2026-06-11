// components/today/ExerciseCard.tsx

import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { SetRow } from './SetRow';
import { ProgressBadge } from './ProgressBadge';
import { categoryColor } from '@/constants/categories';
import { colors, fontSize, radius, spacing } from '@/constants/colors';
import type { ExerciseWithSets, WorkoutSet } from '@/types';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExerciseCardProps {
  data: ExerciseWithSets;
  editable: boolean;
  onSaveSet: (workoutExerciseId: number, set: Partial<WorkoutSet>) => void;
  onRemoveSet: (workoutExerciseId: number, setNumber: number) => void;
  onRemoveExercise: (workoutExerciseId: number) => void;
}

export function ExerciseCard({
  data,
  editable,
  onSaveSet,
  onRemoveSet,
  onRemoveExercise,
}: ExerciseCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [extraRows, setExtraRows] = useState(0);

  const { exercise, previousSets, currentSets, workoutExerciseId } = data;

  const baseRows = Math.max(previousSets.length, currentSets.length, 1);
  const rowCount = baseRows + extraRows;

  const rows = useMemo(() => {
    return Array.from({ length: rowCount }, (_, i) => {
      const setNumber = i + 1;
      return {
        setNumber,
        previousSet: previousSets.find((s) => s.setNumber === setNumber),
        currentSet: currentSets.find((s) => s.setNumber === setNumber),
      };
    });
  }, [rowCount, previousSets, currentSets]);

  function toggleCollapse() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed((c) => !c);
  }

  function handleAddSet() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExtraRows((n) => n + 1);
  }

  function handleRemoveSet(setNumber: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    // Verwijder een opgeslagen set; krimp anders het lokale aantal rijen.
    if (currentSets.some((s) => s.setNumber === setNumber)) {
      onRemoveSet(workoutExerciseId, setNumber);
    } else if (extraRows > 0) {
      setExtraRows((n) => Math.max(0, n - 1));
    }
  }

  function renderRightActions() {
    return (
      <Pressable
        style={styles.deleteAction}
        onPress={() => onRemoveExercise(workoutExerciseId)}
      >
        <Ionicons name="trash" size={22} color={colors.primaryText} />
        <Text style={styles.deleteLabel}>Verwijder</Text>
      </Pressable>
    );
  }

  const card = (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: categoryColor(exercise.category) }]} />
        <Text style={styles.name} numberOfLines={1}>
          {exercise.name}
        </Text>
        {editable ? (
          <Pressable
            onPress={() => onRemoveExercise(workoutExerciseId)}
            hitSlop={8}
            style={styles.headerBtn}
          >
            <Ionicons name="remove-circle-outline" size={22} color={colors.textMuted} />
          </Pressable>
        ) : null}
        <Pressable onPress={toggleCollapse} hitSlop={8} style={styles.headerBtn}>
          <Ionicons
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={22}
            color={colors.textMuted}
          />
        </Pressable>
      </View>

      {!collapsed ? (
        <>
          <View style={styles.divider} />
          <View style={styles.columns}>
            <Text style={[styles.colLabel, styles.colSet]} />
            <Text style={[styles.colLabel, styles.colPrev]}>Vorige</Text>
            <Text style={[styles.colLabel, styles.colNew]}>Nieuw</Text>
          </View>

          {rows.map((r) => (
            <SetRow
              key={r.setNumber}
              setNumber={r.setNumber}
              previousSet={r.previousSet}
              currentSet={r.currentSet}
              editable={editable}
              onSave={(weight, reps) =>
                onSaveSet(workoutExerciseId, { setNumber: r.setNumber, weight, reps })
              }
              onRemove={editable ? () => handleRemoveSet(r.setNumber) : undefined}
            />
          ))}

          <View style={styles.footer}>
            {editable ? (
              <Pressable onPress={handleAddSet} style={styles.addSet} hitSlop={6}>
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={styles.addSetText}>Set</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <ProgressBadge previousSets={previousSets} currentSets={currentSets} />
          </View>
        </>
      ) : null}
    </View>
  );

  if (!editable) return card;

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      {card}
    </Swipeable>
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  headerBtn: {
    padding: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  colLabel: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  colSet: { width: 26 },
  colPrev: { width: 72 },
  colNew: { flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  addSetText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    marginVertical: 0,
    borderRadius: radius.lg,
    gap: 2,
  },
  deleteLabel: {
    color: colors.primaryText,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
});
