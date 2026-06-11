// app/modals/exercise-detail.tsx

import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getExerciseById, deleteCustomExercise } from '@/db/queries/exercises';
import { getExerciseHistory } from '@/db/queries/workouts';
import { useWorkoutStore } from '@/store/workoutStore';
import { categoryColor, categoryLabel } from '@/constants/categories';
import { formatLongDate } from '@/lib/date';
import { colors, fontSize, radius, spacing } from '@/constants/colors';

export default function ExerciseDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(id);
  const addExerciseToToday = useWorkoutStore((s) => s.addExerciseToToday);

  const exercise = useMemo(() => getExerciseById(exerciseId), [exerciseId]);
  const history = useMemo(() => getExerciseHistory(exerciseId, 5), [exerciseId]);

  if (!exercise) {
    return (
      <View style={styles.screen}>
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: categoryColor(exercise.category) }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{exercise.name}</Text>
          <Text style={styles.category}>{categoryLabel(exercise.category)}</Text>
        </View>
      </View>

      <Pressable style={styles.addBtn} onPress={handleAddToToday}>
        <Ionicons name="add-circle" size={20} color={colors.primaryText} />
        <Text style={styles.addBtnText}>Toevoegen aan vandaag</Text>
      </Pressable>

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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  missing: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  category: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  addBtnText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: '700',
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
