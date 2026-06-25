// components/today/SetRow.tsx
// Eén set-rij: genummerde chip (gevuld met accent zodra ingevuld), "vorige"-hint
// en grote, borderloze cijfer-inputs in de stijl "62.5 kg × 10".

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NumberInput } from '@/components/shared/NumberInput';
import { colors, fonts, radius } from '@/constants/colors';
import type { WorkoutSet } from '@/types';

interface SetRowProps {
  setNumber: number;
  previousSet?: WorkoutSet;
  currentSet?: WorkoutSet;
  editable: boolean;
  accent: string;
  onSave: (weight: number, reps: number, rpe?: number) => void;
  onRemove?: () => void;
}

function numToStr(n: number | undefined): string {
  if (n === undefined || n === 0) return '';
  return String(n);
}

export function SetRow({
  setNumber,
  previousSet,
  currentSet,
  editable,
  accent,
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

  const hasWeight = weight !== '' && parseFloat(weight) > 0;
  const hasReps = reps !== '' && parseInt(reps, 10) > 0;
  const filled = hasWeight && hasReps;

  const prevLabel = previousSet
    ? `vorige ${numToStr(previousSet.weight) || '0'}×${previousSet.reps}`
    : 'nieuw';

  return (
    <View style={styles.row}>
      <View style={[styles.setChip, filled ? { backgroundColor: accent } : styles.setChipIdle]}>
        <Text style={[styles.setChipText, filled && { color: '#fff' }]}>{setNumber}</Text>
      </View>

      <Text style={styles.previous} numberOfLines={1}>
        {prevLabel}
      </Text>

      <View style={styles.values}>
        <NumberInput
          value={weight}
          onChangeNumber={setWeight}
          onBlur={commit}
          editable={editable}
          allowDecimal
          placeholder="—"
          placeholderTextColor={colors.textPlaceholder}
          style={[styles.input, styles.inputWeight, hasWeight && { color: accent }]}
          accessibilityLabel={`Gewicht set ${setNumber}`}
        />
        <Text style={styles.unit}>kg ×</Text>
        <NumberInput
          value={reps}
          onChangeNumber={setReps}
          onBlur={commit}
          editable={editable}
          placeholder="—"
          placeholderTextColor={colors.textPlaceholder}
          style={[styles.input, styles.inputReps, hasReps && { color: colors.text }]}
          accessibilityLabel={`Reps set ${setNumber}`}
        />
        <NumberInput
          value={rpe}
          onChangeNumber={setRpe}
          onBlur={commit}
          editable={editable}
          allowDecimal
          placeholder="RPE"
          placeholderTextColor={colors.textPlaceholder}
          style={[styles.input, styles.inputRpe, rpe !== '' && { color: colors.textMuted }]}
          accessibilityLabel={`RPE set ${setNumber}`}
        />
      </View>

      {editable && onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
          <Ionicons name="close" size={18} color={colors.textPlaceholder} />
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
    gap: 12,
    paddingVertical: 6,
  },
  setChip: {
    width: 28,
    height: 28,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setChipIdle: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  setChipText: {
    fontSize: 13,
    fontFamily: fonts.grotesk700,
    color: colors.textMuted,
  },
  previous: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.jakarta500,
    color: colors.textFaint,
  },
  values: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    paddingVertical: 2,
    paddingHorizontal: 0,
    textAlign: 'right',
    fontSize: 22,
    fontFamily: fonts.grotesk700,
    color: colors.text,
    minWidth: 0,
  },
  inputWeight: { width: 64 },
  inputReps: { width: 38 },
  inputRpe: {
    width: 48,
    fontSize: 14,
    color: colors.textFaint,
  },
  unit: {
    fontSize: 13,
    color: colors.textFaint,
    fontFamily: fonts.jakarta600,
  },
  remove: {
    width: 22,
    alignItems: 'center',
  },
});
