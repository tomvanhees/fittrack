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
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart } from '@/components/progress/BarChart';
import { LineChart } from '@/components/progress/LineChart';
import { CategoryBars } from '@/components/progress/CategoryBars';
import { StatCard } from '@/components/progress/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { colors, fontSize, radius, spacing } from '@/constants/colors';
import {
  getStrengthProgression,
  getTrackedExercises,
  getTrainingDaysByPeriod,
  getVolumeByCategory,
  getVolumeByPeriod,
  hasAnyLoggedSets,
  type TrackedExercise,
} from '@/db/queries/stats';
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
  const { width } = useWindowDimensions();
  const chartWidth = width - spacing.lg * 2 - spacing.lg * 2;

  const [granularity, setGranularity] = useState<Granularity>('month');
  const [exerciseId, setExerciseId] = useState<number | null>(null);
  const [data, setData] = useState<StatsData | null>(null);
  const [strength, setStrength] = useState<StrengthPoint[]>([]);

  const load = useCallback(
    (g: Granularity) => {
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
        category: getVolumeByCategory(sinceISO),
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
        return;
      }
      setStrength(getStrengthProgression(id, sinceISO));
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
    <ScrollView
      style={styles.screen}
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
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => changeGranularity(g)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {g === 'month' ? 'Maand' : 'Jaar'}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
              color={colors.primary}
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
                        style={[styles.chip, active && styles.chipActive]}
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
                  <LineChart points={strength} width={chartWidth} unit="kg" />
                )}
              </>
            )}
          </StatCard>

          {/* Volume per spiergroep */}
          <StatCard
            title="Volume per spiergroep"
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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
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
  segmentItemActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '700',
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
  chipActive: {
    backgroundColor: `${colors.primary}22`,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.text,
  },
  note: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingVertical: spacing.sm,
  },
});
