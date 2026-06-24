// app/(tabs)/today.tsx

import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from '@/components/today/ExerciseCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { KeyboardAvoider } from '@/components/shared/KeyboardAvoider';
import { useWorkoutStore } from '@/store/workoutStore';
import { formatLongDate, todayISO } from '@/lib/date';
import { colors, fontSize, radius, spacing } from '@/constants/colors';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const {
    todayDate,
    todayExercises,
    todayCompletedAt,
    todayNotes,
    loadToday,
    saveTodayNotes,
    saveSet,
    removeSet,
    removeExerciseFromToday,
    completeWorkout,
    reopenTodayWorkout,
  } = useWorkoutStore();

  const [notesDraft, setNotesDraft] = useState(todayNotes);

  useFocusEffect(
    useCallback(() => {
      // Zorg dat "vandaag" altijd de echte huidige dag is bij terugkeer.
      loadToday(todayISO());
    }, [loadToday])
  );

  // Houd het lokale tekstveld in sync met de store (bv. na een dag-wissel).
  useEffect(() => {
    setNotesDraft(todayNotes);
  }, [todayNotes, todayDate]);

  const isCompleted = !!todayCompletedAt;
  const count = todayExercises.length;

  function handleComplete() {
    if (count === 0) {
      Alert.alert('Geen oefeningen', 'Voeg eerst oefeningen toe aan vandaag.');
      return;
    }
    completeWorkout();
  }

  function handleRemoveExercise(workoutExerciseId: number) {
    Alert.alert('Oefening verwijderen', 'Weet je het zeker?', [
      { text: 'Annuleer', style: 'cancel' },
      {
        text: 'Verwijder',
        style: 'destructive',
        onPress: () => removeExerciseFromToday(workoutExerciseId),
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>{formatLongDate(todayDate)}</Text>
          <Text style={styles.subtitle}>
            {count} {count === 1 ? 'oefening' : 'oefeningen'}
            {isCompleted ? ' • afgerond' : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/progress')}
          style={styles.iconChip}
          hitSlop={8}
        >
          <Ionicons name="stats-chart-outline" size={20} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={isCompleted ? reopenTodayWorkout : handleComplete}
          style={[styles.completeChip, isCompleted && styles.completeChipDone]}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-done' : 'checkmark'}
            size={18}
            color={isCompleted ? colors.success : colors.primaryText}
          />
        </Pressable>
      </View>

      <KeyboardAvoider style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {count === 0 ? (
          <EmptyState
            icon="barbell-outline"
            title="Niets gepland vandaag"
            subtitle="Voeg een oefening toe om te beginnen met loggen."
          />
        ) : (
          todayExercises.map((data) => (
            <ExerciseCard
              key={data.workoutExerciseId}
              data={data}
              editable={!isCompleted}
              onSaveSet={saveSet}
              onRemoveSet={removeSet}
              onRemoveExercise={handleRemoveExercise}
            />
          ))
        )}

        {!isCompleted ? (
          <Pressable
            style={styles.addExercise}
            onPress={() =>
              router.push({ pathname: '/modals/add-exercise', params: { date: todayDate } })
            }
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addExerciseText}>Oefening toevoegen</Text>
          </Pressable>
        ) : null}

        {count > 0 ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Notities</Text>
            <TextInput
              style={styles.notesInput}
              value={notesDraft}
              onChangeText={setNotesDraft}
              onBlur={() => {
                if (notesDraft.trim() !== todayNotes.trim()) saveTodayNotes(notesDraft);
              }}
              placeholder="Hoe voelde de training? Blessures, energie, …"
              placeholderTextColor={colors.textFaint}
              multiline
              editable={!isCompleted}
            />
          </View>
        ) : null}
      </ScrollView>
      </KeyboardAvoider>

      {!isCompleted && count > 0 ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Pressable style={styles.completeBtn} onPress={handleComplete}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primaryText} />
            <Text style={styles.completeBtnText}>Workout afronden</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  date: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completeChip: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  completeChipDone: {
    backgroundColor: `${colors.success}22`,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  addExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addExerciseText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  notesLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesInput: {
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.success,
  },
  completeBtnText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: '800',
  },
});
