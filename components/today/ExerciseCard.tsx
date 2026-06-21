// components/today/ExerciseCard.tsx
// Inklapbare oefenkaart met categorie-accentbalk. Uitgeklapt: set-rijen +
// gevulde "Set toevoegen"-knop + voortgangsbadge. Ingeklapt: enkel titel + chevron.

import { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { SetRow } from './SetRow';
import { ProgressBadge } from './ProgressBadge';
import { SolidButton } from '@/components/shared/Button';
import { useRestTimerStore } from '@/store/restTimerStore';
import { categoryColor } from '@/constants/categories';
import { colors, fonts, fontSize, radius } from '@/constants/colors';
import type { ExerciseWithSets, WorkoutSet } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExerciseCardProps {
  data: ExerciseWithSets;
  editable: boolean;
  accent: string;
  defaultExpanded?: boolean;
  onSaveSet: (workoutExerciseId: number, set: Partial<WorkoutSet>) => void;
  onRemoveSet: (workoutExerciseId: number, setNumber: number) => void;
  onRemoveExercise: (workoutExerciseId: number) => void;
}

export function ExerciseCard({
  data,
  editable,
  accent,
  defaultExpanded = false,
  onSaveSet,
  onRemoveSet,
  onRemoveExercise,
}: ExerciseCardProps) {
  const [extraRows, setExtraRows] = useState(0);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const startRest = useRestTimerStore((s) => s.start);

  const { exercise, previousSets, currentSets, workoutExerciseId, plannedSets } = data;
  const barColor = categoryColor(exercise.category);

  const baseRows = Math.max(previousSets.length, currentSets.length, plannedSets ?? 0, 1);
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

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  }

  function handleAddSet() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExtraRows((n) => n + 1);
  }

  function handleRemoveSet(setNumber: number) {
    if (rowCount <= 1) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (currentSets.some((s) => s.setNumber === setNumber)) {
      onRemoveSet(workoutExerciseId, setNumber);
    } else if (extraRows > 0) {
      setExtraRows((n) => Math.max(0, n - 1));
    }
  }

  function renderRightActions() {
    return (
      <Pressable style={styles.deleteAction} onPress={() => onRemoveExercise(workoutExerciseId)}>
        <Ionicons name="trash" size={22} color={colors.primaryText} />
        <Text style={styles.deleteLabel}>Verwijder</Text>
      </Pressable>
    );
  }

  const card = (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: barColor }]} pointerEvents="none" />

      <View style={styles.body}>
        <Pressable style={styles.header} onPress={toggle} hitSlop={6}>
          <Text style={styles.name} numberOfLines={1}>
            {exercise.name}
          </Text>
          {expanded ? (
            <>
              {editable ? (
                <Pressable
                  onPress={() => startRest()}
                  hitSlop={8}
                  style={styles.restBtn}
                  accessibilityLabel="Rust-timer starten"
                >
                  <Ionicons name="timer-outline" size={21} color={accent} />
                </Pressable>
              ) : null}
              <ProgressBadge previousSets={previousSets} currentSets={currentSets} accent={accent} />
            </>
          ) : (
            <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
          )}
        </Pressable>

        {expanded ? (
          <>
            <View style={styles.sets}>
              {rows.map((r) => (
                <SetRow
                  key={r.setNumber}
                  setNumber={r.setNumber}
                  previousSet={r.previousSet}
                  currentSet={r.currentSet}
                  editable={editable}
                  accent={accent}
                  onSave={(weight, reps) =>
                    onSaveSet(workoutExerciseId, { setNumber: r.setNumber, weight, reps })
                  }
                  onRemove={editable ? () => handleRemoveSet(r.setNumber) : undefined}
                />
              ))}
            </View>

            {editable ? (
              <SolidButton
                label="Set toevoegen"
                icon="add"
                accent={accent}
                onPress={handleAddSet}
                style={styles.addSet}
              />
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );

  if (!editable) return card;

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      {card}
    </Swipeable>
  );
}

const BAR_WIDTH = 4;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: BAR_WIDTH,
  },
  body: {
    paddingLeft: 18 + BAR_WIDTH,
    paddingRight: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minHeight: 30,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 19,
    fontFamily: fonts.jakarta800,
    letterSpacing: -0.3,
  },
  restBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sets: {
    marginTop: 12,
    gap: 2,
  },
  addSet: {
    marginTop: 14,
  },
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    borderRadius: radius.xl,
    gap: 2,
  },
  deleteLabel: {
    color: colors.primaryText,
    fontSize: fontSize.xs,
    fontFamily: fonts.jakarta700,
  },
});
