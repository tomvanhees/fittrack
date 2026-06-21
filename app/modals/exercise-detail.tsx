// app/modals/exercise-detail.tsx

import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getExerciseById, deleteCustomExercise } from '@/db/queries/exercises';
import { getExerciseHistory } from '@/db/queries/workouts';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { SolidButton } from '@/components/shared/Button';
import { useWorkoutStore } from '@/store/workoutStore';
import { categoryColor, categoryLabel } from '@/constants/categories';
import { formatLongDate } from '@/lib/date';
import { useAccent } from '@/store/prefsStore';
import { colors, fontSize, radius, spacing } from '@/constants/colors';

export default function ExerciseDetailModal() {
  const { accent } = useAccent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(id);
  const addExerciseToToday = useWorkoutStore((s) => s.addExerciseToToday);

  const exercise = useMemo(() => getExerciseById(exerciseId), [exerciseId]);
  const history = useMemo(() => getExerciseHistory(exerciseId, 5), [exerciseId]);

  if (!exercise) {
    return (
      <View style={styles.screen}>
        <ScreenHeader kicker="Oefening" title="Detail" accent={accent} onBack={() => router.back()} backIcon="close" />
        <Text style={styles.missing}>Oefening niet gevonden.</Text>
      </View>
    );
  }

  function handleAddToToday() {
    addExerciseToToday(exerciseId);
    Alert.alert('Toegevoegd', `${exercise!.name} is toegevoegd aan vandaag.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  function handleDelete() {
    Alert.alert('Verwijderen', `"${exercise!.name}" verwijderen?`, [
      { text: 'Annuleer', style: 'cancel' },
      {
        text: 'Verwijder',
        style: 'destructive',
        onPress: () => {
          const ok = deleteCustomExercise(exerciseId);
          if (!ok) {
            Alert.alert(
              'Niet mogelijk',
              'Deze oefening wordt nog gebruikt in een workout of template.'
            );
            return;
          }
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        kicker={categoryLabel(exercise.category)}
        title={exercise.name}
        accent={categoryColor(exercise.category)}
        onBack={() => router.back()}
        backIcon="close"
      />
      <ScrollView contentContainerStyle={styles.content}>
      <SolidButton
        label="Toevoegen aan vandaag"
        icon="add-circle"
        accent={accent}
        onPress={handleAddToToday}
      />

      <Text style={styles.sectionTitle}>Recente sessies</Text>

      {history.length === 0 ? (
        <Text style={styles.empty}>Nog geen sessies gelogd voor deze oefening.</Text>
      ) : (
        history.map((session, i) => (
          <View key={`${session.date}-${i}`} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionDate}>{formatLongDate(session.date)}</Text>
              {session.completedAt ? (
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              ) : null}
            </View>
            <View style={styles.sets}>
              {session.sets.map((s) => (
                <View key={s.id} style={styles.setPill}>
                  <Text style={styles.setPillText}>
                    {s.weight}kg × {s.reps}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))
      )}

      {exercise.isCustom ? (
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.deleteBtnText}>Oefening verwijderen</Text>
        </Pressable>
      ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  missing: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontStyle: 'italic',
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionDate: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  sets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  setPill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  setPillText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
