// app/modals/exercise-detail.tsx

import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getExerciseById, deleteCustomExercise } from '@/db/queries/exercises';
import { getExerciseHistory } from '@/db/queries/workouts';
import { getExerciseRecords } from '@/db/queries/stats';
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
  const records = useMemo(() => getExerciseRecords(exerciseId), [exerciseId]);

  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const recordItems = [
    records.bestEstimated1RM && {
      label: 'Geschat 1RM',
      value: `${Math.round(records.bestEstimated1RM.value)} kg`,
      sub: `${fmt(records.bestEstimated1RM.weight)}kg × ${records.bestEstimated1RM.reps}`,
    },
    records.maxWeight && {
      label: 'Zwaarste set',
      value: `${fmt(records.maxWeight.weight)} kg`,
      sub: `× ${records.maxWeight.reps}`,
    },
    records.bestSetVolume && {
      label: 'Beste setvolume',
      value: `${Math.round(records.bestSetVolume.value)} kg`,
      sub: `${fmt(records.bestSetVolume.weight)}kg × ${records.bestSetVolume.reps}`,
    },
  ].filter(Boolean) as { label: string; value: string; sub: string }[];

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

      {recordItems.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Records</Text>
          <View style={styles.recordsRow}>
            {recordItems.map((r) => (
              <View key={r.label} style={styles.recordCard}>
                <Ionicons name="trophy" size={16} color={colors.secondary} />
                <Text style={styles.recordValue}>{r.value}</Text>
                <Text style={styles.recordLabel}>{r.label}</Text>
                <Text style={styles.recordSub}>{r.sub}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

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
                    {s.rpe ? ` @${s.rpe}` : ''}
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
  recordsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recordCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  recordValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginTop: 2,
  },
  recordLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recordSub: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
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
