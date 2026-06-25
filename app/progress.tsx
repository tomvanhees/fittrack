// app/progress.tsx
// Voortgang — grafieken per maand of jaar.

import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from '@/components/progress/BarChart';
import { LineChart } from '@/components/progress/LineChart';
import { CategoryBars } from '@/components/progress/CategoryBars';
import { StatCard } from '@/components/progress/StatCard';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { GoalRing } from '@/components/goals/GoalRing';
import { goalDisplay } from '@/components/goals/goalDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAccent } from '@/store/prefsStore';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/colors';
import {
  getSetsByCategory,
  getStrengthProgression,
  getTrackedExercises,
  getTrainingDaysByPeriod,
  getVolumeByPeriod,
  hasAnyLoggedSets,
  type TrackedExercise,
} from '@/db/queries/stats';
import {
  getActiveGoalsWithProgress,
  getStrengthGoalTarget,
} from '@/db/queries/goals';
import type { GoalProgress } from '@/types';
import {
  bucketsFor,
  fillPeriods,
  formatVolumeFull,
  formatVolumeShort,
  maxValue,
  rangeStartISO,
  sumValues,
  type Granularity,
  type PeriodValue,
} from '@/lib/stats';
import type { StrengthPoint } from '@/db/queries/stats';

interface StatsData {
  hasData: boolean;
  consistency: PeriodValue[];
  volume: PeriodValue[];
  category: { category: TrackedExercise['category']; value: number }[];
  exercises: TrackedExercise[];
  sinceISO: string;
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { accent, partner } = useAccent();
  const { width } = useWindowDimensions();
  const chartWidth = width - spacing.lg * 2 - spacing.lg * 2;

  const [granularity, setGranularity] = useState<Granularity>('month');
  const [exerciseId, setExerciseId] = useState<number | null>(null);
  const [data, setData] = useState<StatsData | null>(null);
  const [strength, setStrength] = useState<StrengthPoint[]>([]);
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [strengthTarget, setStrengthTarget] = useState<number | null>(null);

  const load = useCallback(
    (g: Granularity) => {
      setGoals(getActiveGoalsWithProgress());
      if (!hasAnyLoggedSets()) {
        setData({
          hasData: false,
          consistency: [],
          volume: [],
          category: [],
          exercises: [],
          sinceISO: '',
        });
        return;
      }
      const buckets = bucketsFor(g, new Date());
      const sinceISO = rangeStartISO(buckets);
      const exercises = getTrackedExercises();
      setData({
        hasData: true,
        consistency: fillPeriods(buckets, getTrainingDaysByPeriod(g)),
        volume: fillPeriods(buckets, getVolumeByPeriod(g)),
        category: getSetsByCategory(sinceISO),
        exercises,
        sinceISO,
      });
      // Houd de gekozen oefening geldig; val anders terug op de eerste.
      setExerciseId((prev) => {
        if (prev != null && exercises.some((e) => e.id === prev)) return prev;
        return exercises[0]?.id ?? null;
      });
    },
    []
  );

  // Herlaad de kracht-reeks wanneer oefening, granulariteit of venster wijzigt.
  const refreshStrength = useCallback(
    (id: number | null, sinceISO: string) => {
      if (id == null || !sinceISO) {
        setStrength([]);
        setStrengthTarget(null);
        return;
      }
      setStrength(getStrengthProgression(id, sinceISO));
      setStrengthTarget(getStrengthGoalTarget(id));
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      load(granularity);
    }, [load, granularity])
  );

  // Reageer op wijziging van oefening of venster.
  useEffect(() => {
    if (data?.hasData) refreshStrength(exerciseId, data.sinceISO);
  }, [exerciseId, data?.sinceISO, data?.hasData, refreshStrength]);

  function changeGranularity(g: Granularity) {
    if (g === granularity) return;
    setGranularity(g);
    load(g);
  }

  const periodWord = granularity === 'month' ? 'maand' : 'jaar';
  const selectedExercise = data?.exercises.find((e) => e.id === exerciseId);

  return (
    <View style={styles.screen}>
      <ScreenHeader kicker="Statistieken" title="Voortgang" accent={accent} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
      {/* Maand / Jaar toggle */}
      <View style={styles.segment}>
        {(['month', 'year'] as Granularity[]).map((g) => {
          const active = granularity === g;
          return (
            <Pressable
              key={g}
              style={[styles.segmentItem, active && { backgroundColor: accent }]}
              onPress={() => changeGranularity(g)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {g === 'month' ? 'Maand' : 'Jaar'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Doelen — voortgangsringen, of een tip om er een in te stellen */}
      {goals.length > 0 ? (
        <StatCard title="Doelen" subtitle="Voortgang naar je targets">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rings}
          >
            {goals.map((p) => {
              const d = goalDisplay(p);
              return (
                <GoalRing
                  key={p.goal.id}
                  pct={p.pct}
                  title={d.title}
                  centerLabel={d.centerLabel}
                  deltaLabel={d.deltaLabel}
                  reached={p.reached}
                  color={accent}
                />
              );
            })}
          </ScrollView>
        </StatCard>
      ) : (
        <Pressable style={styles.goalTeaser} onPress={() => router.push('/goals')}>
          <Ionicons name="flag-outline" size={18} color={accent} />
          <Text style={styles.goalTeaserText}>Stel een doel in</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      )}

      {!data ? null : !data.hasData ? (
        <EmptyState
          icon="stats-chart-outline"
          title="Nog geen voortgang"
          subtitle="Log eerst enkele workouts om je grafieken te zien verschijnen."
        />
      ) : (
        <>
          {/* Consistentie */}
          <StatCard
            title="Consistentie"
            subtitle={`Workouts per ${periodWord}`}
            value={`${sumValues(data.consistency.map((d) => d.value))}`}
          >
            <BarChart
              data={data.consistency}
              width={chartWidth}
              color={accent}
            />
          </StatCard>

          {/* Volume */}
          <StatCard
            title="Volume"
            subtitle={`Totaal getild per ${periodWord}`}
            value={formatVolumeFull(sumValues(data.volume.map((d) => d.value)))}
          >
            <BarChart
              data={data.volume}
              width={chartWidth}
              color={colors.up}
              formatValue={formatVolumeShort}
            />
          </StatCard>

          {/* Kracht per oefening */}
          <StatCard
            title="Kracht per oefening"
            subtitle={selectedExercise ? 'Max gewicht per sessie' : undefined}
          >
            {data.exercises.length === 0 ? (
              <Text style={styles.note}>Nog geen oefeningen met gewicht gelogd.</Text>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                >
                  {data.exercises.map((e) => {
                    const active = e.id === exerciseId;
                    return (
                      <Pressable
                        key={e.id}
                        style={[
                          styles.chip,
                          active && { backgroundColor: `${accent}22`, borderColor: accent },
                        ]}
                        onPress={() => setExerciseId(e.id)}
                      >
                        <Text
                          style={[styles.chipText, active && styles.chipTextActive]}
                          numberOfLines={1}
                        >
                          {e.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {strength.length === 0 ? (
                  <Text style={styles.note}>
                    Geen data voor deze oefening in deze periode.
                  </Text>
                ) : (
                  <LineChart
                    points={strength}
                    width={chartWidth}
                    unit="kg"
                    color={accent}
                    targetColor={partner}
                    targetValue={strengthTarget ?? undefined}
                  />
                )}
              </>
            )}
          </StatCard>

          {/* Sets per spiergroep */}
          <StatCard
            title="Sets per spiergroep"
            subtitle={`Laatste ${granularity === 'month' ? '12 maanden' : '5 jaar'}`}
          >
            {data.category.length === 0 ? (
              <Text style={styles.note}>Geen data in deze periode.</Text>
            ) : (
              <CategoryBars data={data.category} />
            )}
          </StatCard>
        </>
      )}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontFamily: fonts.jakarta700,
  },
  segmentTextActive: {
    color: colors.primaryText,
  },
  chips: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 160,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: fonts.jakarta600,
  },
  chipTextActive: {
    color: colors.text,
  },
  note: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingVertical: spacing.sm,
  },
  rings: {
    gap: spacing.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  goalTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  goalTeaserText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
