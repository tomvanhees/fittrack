// app/(tabs)/today.tsx

import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { StatTiles } from '@/components/shared/StatTiles';
import { GhostButton, GradientButton, IconButton } from '@/components/shared/Button';
import { ExerciseCard } from '@/components/today/ExerciseCard';
import { RestTimerBar } from '@/components/today/RestTimerBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { KeyboardAvoider } from '@/components/shared/KeyboardAvoider';
import { useWorkoutStore } from '@/store/workoutStore';
import { useAccent } from '@/store/prefsStore';
import { todayISO, formatLongDate } from '@/lib/date';
import { formatVolumeCompact } from '@/lib/stats';
import { colors } from '@/constants/colors';
import type { ExerciseWithSets } from '@/types';

function summarize(exercises: ExerciseWithSets[]): { done: number; total: number; volume: number } {
  let done = 0;
  let total = 0;
  let volume = 0;
  for (const ex of exercises) {
    const rows = Math.max(ex.previousSets.length, ex.currentSets.length, ex.plannedSets ?? 0, 1);
    total += rows;
    for (const s of ex.currentSets) {
      if (s.weight > 0 && s.reps > 0) {
        done += 1;
        volume += s.weight * s.reps;
      }
    }
  }
  return { done, total, volume };
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { accent, partner } = useAccent();
  // Hoogte van de zwevende footer (timer + CTA) zodat we de scroll-inhoud
  // genoeg onderaan padden — anders verdwijnt "Oefening toevoegen" erachter.
  const [footerHeight, setFooterHeight] = useState(0);
  const {
    todayDate,
    todayExercises,
    todayCompletedAt,
    todaySessionLabel,
    loadToday,
    saveSet,
    removeSet,
    removeExerciseFromToday,
    completeWorkout,
    reopenTodayWorkout,
  } = useWorkoutStore();

  useFocusEffect(
    useCallback(() => {
      // Zorg dat "vandaag" altijd de echte huidige dag is bij terugkeer.
      loadToday(todayISO());
    }, [loadToday])
  );

  const isCompleted = !!todayCompletedAt;
  const count = todayExercises.length;
  const { done, total, volume } = useMemo(() => summarize(todayExercises), [todayExercises]);

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
      <KeyboardAvoider style={styles.flex}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: (count > 0 ? footerHeight : insets.bottom) + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            kicker={`Vandaag${todaySessionLabel ? ` · ${todaySessionLabel}` : ''}`}
            title={formatLongDate(todayDate)}
            accent={accent}
            right={<IconButton icon="stats-chart" onPress={() => router.push('/progress')} color={colors.text} />}
          />

          {count > 0 ? (
            <View style={styles.tiles}>
              <StatTiles
                accent={accent}
                tiles={[
                  { value: `${done}/${total}`, label: 'sets', accent: true },
                  { value: formatVolumeCompact(volume), label: 'volume' },
                ]}
              />
            </View>
          ) : null}

          <View style={styles.list}>
            {count === 0 ? (
              <EmptyState
                icon="barbell-outline"
                title="Niets gepland vandaag"
                subtitle="Voeg een oefening toe om te beginnen met loggen."
              />
            ) : (
              todayExercises.map((data, i) => (
                <ExerciseCard
                  key={data.workoutExerciseId}
                  data={data}
                  editable={!isCompleted}
                  accent={accent}
                  defaultExpanded={i === 0}
                  onSaveSet={saveSet}
                  onRemoveSet={removeSet}
                  onRemoveExercise={handleRemoveExercise}
                />
              ))
            )}

            {!isCompleted ? (
              <GhostButton
                label="Oefening toevoegen"
                accent={accent}
                onPress={() =>
                  router.push({ pathname: '/modals/add-exercise', params: { date: todayDate } })
                }
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoider>

      {count > 0 ? (
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
        >
          <LinearGradient
            colors={['rgba(19,18,17,0)', colors.background]}
            style={styles.footerFade}
            pointerEvents="none"
          />
          <RestTimerBar accent={accent} />
          <GradientButton
            label={isCompleted ? 'Afgerond — sterk werk!' : 'Workout afronden'}
            icon={isCompleted ? 'checkmark-circle' : 'flash'}
            accent={accent}
            partner={partner}
            onPress={isCompleted ? reopenTodayWorkout : handleComplete}
          />
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
  tiles: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 14,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -28,
    height: 28,
  },
});
