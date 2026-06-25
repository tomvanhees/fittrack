// app/records.tsx
// High scores — gecombineerd records-overzicht over alle oefeningen, gesorteerd
// op geschatte 1RM. Tik een regel om de volledige oefeningdetail te openen.

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { getAllExerciseRecords, type ExerciseRecordSummary } from '@/db/queries/stats';
import { categoryColor, categoryLabel } from '@/constants/categories';
import { formatNumberNL } from '@/lib/stats';
import { useAccent } from '@/store/prefsStore';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/colors';

/** Gewicht compact: 60 → "60", 22.5 → "22,5". */
function fmtWeight(kg: number): string {
  return (Number.isInteger(kg) ? String(kg) : kg.toFixed(1)).replace('.', ',');
}

/** Medaillekleur voor de top 3, anders null. */
function medalColor(rank: number): string | null {
  if (rank === 1) return '#FFD24A'; // goud
  if (rank === 2) return '#C8CDD6'; // zilver
  if (rank === 3) return '#E0985C'; // brons
  return null;
}

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();
  const [records, setRecords] = useState<ExerciseRecordSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      setRecords(getAllExerciseRecords());
    }, [])
  );

  function openExercise(exerciseId: number) {
    router.push({ pathname: '/modals/exercise-detail', params: { id: String(exerciseId) } });
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        kicker="Records"
        title="High scores"
        subtitle={records.length > 0 ? 'Je beste lift per oefening, op geschatte 1RM' : undefined}
        accent={accent}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {records.length === 0 ? (
          <EmptyState
            icon="trophy-outline"
            title="Nog geen records"
            subtitle="Log een set met gewicht én reps om je eerste high score vast te zetten."
          />
        ) : (
          records.map((r, i) => {
            const rank = i + 1;
            const medal = medalColor(rank);
            return (
              <Pressable
                key={r.exerciseId}
                style={styles.card}
                onPress={() => openExercise(r.exerciseId)}
                accessibilityLabel={`${r.name} records`}
              >
                <View style={[styles.rank, medal ? { backgroundColor: medal } : null]}>
                  {medal ? (
                    <Ionicons name="trophy" size={15} color="#1A1814" />
                  ) : (
                    <Text style={styles.rankText}>{rank}</Text>
                  )}
                </View>

                <View style={styles.body}>
                  <View style={styles.nameRow}>
                    <View style={[styles.dot, { backgroundColor: categoryColor(r.category) }]} />
                    <Text style={styles.name} numberOfLines={1}>
                      {r.name}
                    </Text>
                  </View>
                  <Text style={styles.sub} numberOfLines={1}>
                    {categoryLabel(r.category)} · max {fmtWeight(r.maxWeight)}kg · {r.maxReps} reps
                    {' · '}
                    {formatNumberNL(r.bestSetVolume)} kg volume
                  </Text>
                </View>

                <View style={styles.score}>
                  <Text style={styles.scoreValue}>{Math.round(r.bestEstimated1RM)}</Text>
                  <Text style={styles.scoreUnit}>kg 1RM</Text>
                </View>
              </Pressable>
            );
          })
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
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rank: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  rankText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: fonts.grotesk700,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fonts.jakarta700,
  },
  sub: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: fonts.jakarta500,
  },
  score: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontFamily: fonts.grotesk700,
  },
  scoreUnit: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontFamily: fonts.jakarta600,
    marginTop: -2,
  },
});
