// app/modals/goal-edit.tsx
// Nieuw doel toevoegen of een bestaand doel bewerken. Type bepaalt welke velden
// zichtbaar zijn: 'strength' kiest een oefening + streefgewicht (en optioneel
// aantal reps), de periode-types een venster + streefwaarde.
//
// Bij een krachtdoel blijven de streefwaarden bovenaan staan terwijl de
// oefeningenlijst eronder scrollt, zodat je ze ziet tijdens het zoeken.

import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoider } from '@/components/shared/KeyboardAvoider';
import { NumberInput } from '@/components/shared/NumberInput';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { SolidButton } from '@/components/shared/Button';
import { getAllExercises } from '@/db/queries/exercises';
import { createGoal, getGoalById, updateGoal } from '@/db/queries/goals';
import { categoryColor } from '@/constants/categories';
import { useAccent } from '@/store/prefsStore';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/colors';
import type { Goal, GoalType, Granularity } from '@/types';

const TYPE_OPTIONS: { key: GoalType; label: string; hint: string }[] = [
  { key: 'strength', label: 'Kracht', hint: 'Max gewicht voor één oefening' },
  { key: 'consistency', label: 'Consistentie', hint: 'Aantal workouts per periode' },
  { key: 'volume', label: 'Volume', hint: 'Totaal getild per periode' },
];

function targetUnit(type: GoalType): string {
  return type === 'consistency' ? 'workouts' : 'kg';
}

export default function GoalEditModal() {
  const { accent } = useAccent();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : null;
  const existing = useMemo<Goal | null>(
    () => (editingId != null ? getGoalById(editingId) : null),
    [editingId]
  );
  const exercises = useMemo(() => getAllExercises(), []);

  const [type, setType] = useState<GoalType>(existing?.type ?? 'strength');
  const [exerciseId, setExerciseId] = useState<number | null>(
    existing?.exerciseId ?? null
  );
  const [granularity, setGranularity] = useState<Granularity>(
    existing?.granularity ?? 'month'
  );
  const [target, setTarget] = useState<string>(
    existing ? String(existing.targetValue) : ''
  );
  const [reps, setReps] = useState<string>(
    existing?.targetReps ? String(existing.targetReps) : ''
  );
  const [query, setQuery] = useState('');

  const filteredExercises = exercises.filter(
    (e) =>
      query.trim().length === 0 ||
      e.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const selectedExercise = exercises.find((e) => e.id === exerciseId);

  const targetNum = Number(target);
  const repsNum = reps.trim() === '' ? undefined : Number(reps);
  const valid = targetNum > 0 && (type !== 'strength' || exerciseId != null);

  function handleSave() {
    if (!valid) return;
    const isStrength = type === 'strength';
    if (editingId != null) {
      updateGoal(editingId, {
        type,
        exerciseId: isStrength ? exerciseId ?? undefined : undefined,
        targetValue: targetNum,
        targetReps: isStrength && repsNum ? repsNum : undefined,
        granularity: isStrength ? undefined : granularity,
      });
    } else {
      createGoal({
        type,
        exerciseId: isStrength ? exerciseId ?? undefined : undefined,
        targetValue: targetNum,
        targetReps: isStrength && repsNum ? repsNum : undefined,
        granularity: isStrength ? undefined : granularity,
      });
    }
    router.back();
  }

  const typeSegment = (
    <>
      <Text style={styles.label}>Type doel</Text>
      <View style={styles.segment}>
        {TYPE_OPTIONS.map((opt) => {
          const active = type === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[styles.segmentItem, active && { backgroundColor: accent }]}
              onPress={() => setType(opt.key)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  return (
    <KeyboardAvoider style={styles.screen} behavior="padding">
      <ScreenHeader
        kicker="Doel"
        title={editingId != null ? 'Bewerken' : 'Nieuw doel'}
        accent={accent}
        onBack={() => router.back()}
        backIcon="close"
      />
      {type === 'strength' ? (
        // Vaste kop met streefwaarden; alleen de oefeningenlijst scrollt.
        <View style={styles.flex}>
          <View style={styles.fixedTop}>
            {typeSegment}

            <Text style={styles.label}>Streefwaarde</Text>
            <View style={styles.targetGrid}>
              <View style={styles.targetField}>
                <Text style={styles.fieldCaption}>Gewicht</Text>
                <View style={styles.targetRow}>
                  <NumberInput
                    value={target}
                    onChangeNumber={setTarget}
                    allowDecimal
                    placeholder="0"
                    style={styles.targetInput}
                  />
                  <Text style={styles.unit}>kg</Text>
                </View>
              </View>
              <View style={styles.targetField}>
                <Text style={styles.fieldCaption}>Reps (optioneel)</Text>
                <View style={styles.targetRow}>
                  <NumberInput
                    value={reps}
                    onChangeNumber={setReps}
                    placeholder="alle"
                    style={styles.targetInput}
                  />
                  <Text style={styles.unit}>×</Text>
                </View>
              </View>
            </View>

            <Text style={styles.label}>
              Oefening{selectedExercise ? `: ${selectedExercise.name}` : ''}
            </Text>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Zoek oefening..."
                placeholderTextColor={colors.textFaint}
                style={styles.searchInput}
              />
            </View>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredExercises.slice(0, 60).map((ex) => {
              const active = ex.id === exerciseId;
              return (
                <Pressable
                  key={ex.id}
                  style={[
                    styles.exerciseRow,
                    active && { borderColor: accent, backgroundColor: `${accent}1A` },
                  ]}
                  onPress={() => setExerciseId(ex.id)}
                >
                  <View
                    style={[styles.dot, { backgroundColor: categoryColor(ex.category) }]}
                  />
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {ex.name}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={20} color={accent} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {typeSegment}
          <Text style={styles.hint}>
            {TYPE_OPTIONS.find((o) => o.key === type)?.hint}
          </Text>

          <Text style={styles.label}>Periode</Text>
          <View style={styles.segment}>
            {(['month', 'year'] as Granularity[]).map((g) => {
              const active = granularity === g;
              return (
                <Pressable
                  key={g}
                  style={[styles.segmentItem, active && { backgroundColor: accent }]}
                  onPress={() => setGranularity(g)}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {g === 'month' ? 'Per maand' : 'Per jaar'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Streefwaarde</Text>
          <View style={styles.targetRow}>
            <NumberInput
              value={target}
              onChangeNumber={setTarget}
              allowDecimal={type !== 'consistency'}
              placeholder="0"
              style={styles.targetInput}
            />
            <Text style={styles.unit}>{targetUnit(type)}</Text>
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <SolidButton
          label={editingId != null ? 'Opslaan' : 'Doel toevoegen'}
          accent={accent}
          onPress={handleSave}
          disabled={!valid}
        />
      </View>
    </KeyboardAvoider>
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
  fixedTop: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  hint: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
  },
  fieldCaption: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
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
    fontSize: fontSize.sm,
    fontFamily: fonts.jakarta700,
  },
  segmentTextActive: {
    color: colors.primaryText,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    padding: 0,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  exerciseName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  targetGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  targetField: {
    flex: 1,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  targetInput: {
    flex: 1,
    textAlign: 'left',
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
  },
  unit: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
