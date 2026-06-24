// components/today/SetRow.tsx

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NumberInput } from '@/components/shared/NumberInput';
import { colors, fontSize, spacing } from '@/constants/colors';
import type { WorkoutSet } from '@/types';

interface SetRowProps {
  setNumber: number;
  previousSet?: WorkoutSet;
  currentSet?: WorkoutSet;
  editable: boolean;
  onSave: (weight: number, reps: number, rpe?: number) => void;
  onRemove?: () => void;
}

function numToStr(n: number | undefined): string {
  if (n === undefined || n === 0) return '';
  return Number.isInteger(n) ? String(n) : String(n);
}

export function SetRow({
  setNumber,
  previousSet,
  currentSet,
  editable,
  onSave,
  onRemove,
}: SetRowProps) {
  const [weight, setWeight] = useState(numToStr(currentSet?.weight));
  const [reps, setReps] = useState(numToStr(currentSet?.reps));
  const [rpe, setRpe] = useState(numToStr(currentSet?.rpe));

  // Sync wanneer de onderliggende set verandert (bv. na reload).
  useEffect(() => {
    setWeight(numToStr(currentSet?.weight));
    setReps(numToStr(currentSet?.reps));
    setRpe(numToStr(currentSet?.rpe));
  }, [currentSet?.id, currentSet?.weight, currentSet?.reps, currentSet?.rpe]);

  function commit() {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    const rpeNum = parseFloat(rpe);
    // Sla enkel op als er iets ingevuld is.
    if (weight === '' && reps === '' && rpe === '') return;
    onSave(
      Number.isFinite(w) ? w : 0,
      Number.isFinite(r) ? r : 0,
      Number.isFinite(rpeNum) ? rpeNum : undefined
    );
  }

  const prevLabel = previousSet
    ? `${numToStr(previousSet.weight) || '0'}kg×${previousSet.reps}`
    : '—';

  return (
    <View style={styles.row}>
      <Text style={styles.setLabel}>S{setNumber}</Text>

      <Text style={styles.previous} numberOfLines={1}>
        {prevLabel}
      </Text>

      <NumberInput
        value={weight}
        onChangeNumber={setWeight}
        onBlur={commit}
        editable={editable}
        allowDecimal
        placeholder={previousSet ? String(previousSet.weight) : '0'}
        style={styles.input}
        accessibilityLabel={`Gewicht set ${setNumber}`}
      />
      <Text style={styles.times}>×</Text>
      <NumberInput
        value={reps}
        onChangeNumber={setReps}
        onBlur={commit}
        editable={editable}
        placeholder={previousSet ? String(previousSet.reps) : '0'}
        style={styles.input}
        accessibilityLabel={`Reps set ${setNumber}`}
      />
      <NumberInput
        value={rpe}
        onChangeNumber={setRpe}
        onBlur={commit}
        editable={editable}
        allowDecimal
        placeholder={previousSet?.rpe ? String(previousSet.rpe) : 'RPE'}
        style={styles.rpeInput}
        accessibilityLabel={`RPE set ${setNumber}`}
      />

      {editable && onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
          <Ionicons name="close-circle" size={20} color={colors.textFaint} />
        </Pressable>
      ) : (
        <View style={styles.remove} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  setLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
    width: 26,
  },
  previous: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    width: 72,
  },
  input: {
    flex: 1,
  },
  rpeInput: {
    width: 56,
    minWidth: 48,
    flexGrow: 0,
  },
  times: {
    color: colors.textFaint,
    fontSize: fontSize.md,
  },
  remove: {
    width: 24,
    alignItems: 'center',
  },
});
