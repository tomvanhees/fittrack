// app/body.tsx
// Lichaam — log je lichaamsgewicht en volg het verloop.

import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from '@/components/progress/LineChart';
import { NumberInput } from '@/components/shared/NumberInput';
import { EmptyState } from '@/components/shared/EmptyState';
import { KeyboardAvoider } from '@/components/shared/KeyboardAvoider';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { useAccent } from '@/store/prefsStore';
import {
  deleteBodyMetric,
  getBodyMetricByDate,
  listBodyMetrics,
  upsertBodyMetric,
} from '@/db/queries/bodyMetrics';
import { formatLongDate, todayISO } from '@/lib/date';
import { colors, fontSize, radius, spacing } from '@/constants/colors';
import type { BodyMetric } from '@/types';

export default function BodyScreen() {
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();
  const { width } = useWindowDimensions();
  const chartWidth = width - spacing.lg * 2 - spacing.lg * 2;

  const [weight, setWeight] = useState('');
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);

  const load = useCallback(() => {
    const all = listBodyMetrics();
    setMetrics(all);
    // Voorvul met de meting van vandaag, indien aanwezig.
    const today = getBodyMetricByDate(todayISO());
    setWeight(today ? String(today.weight) : '');
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  function handleSave() {
    const w = parseFloat(weight);
    if (!Number.isFinite(w) || w <= 0) {
      Alert.alert('Ongeldig gewicht', 'Vul een geldig lichaamsgewicht in (kg).');
      return;
    }
    upsertBodyMetric(todayISO(), { weight: w });
    load();
  }

  function handleDelete(date: string) {
    Alert.alert('Verwijderen', 'Deze meting verwijderen?', [
      { text: 'Annuleer', style: 'cancel' },
      {
        text: 'Verwijder',
        style: 'destructive',
        onPress: () => {
          deleteBodyMetric(date);
          load();
        },
      },
    ]);
  }

  const points = metrics.map((m) => ({ date: m.date, value: m.weight }));
  const recent = [...metrics].reverse(); // nieuwste eerst voor de lijst
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        kicker="Lichaam"
        title="Lichaamsgewicht"
        accent={accent}
        onBack={() => router.back()}
      />
      <KeyboardAvoider style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Invoer voor vandaag */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vandaag</Text>
          <View style={styles.inputRow}>
            <NumberInput
              value={weight}
              onChangeNumber={setWeight}
              allowDecimal
              placeholder={latest ? String(latest.weight) : '0'}
              style={styles.weightInput}
              accessibilityLabel="Lichaamsgewicht"
            />
            <Text style={styles.unit}>kg</Text>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark" size={18} color={colors.primaryText} />
              <Text style={styles.saveBtnText}>Bewaren</Text>
            </Pressable>
          </View>
        </View>

        {/* Grafiek */}
        {points.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verloop</Text>
            <LineChart points={points} width={chartWidth} unit="kg" />
          </View>
        ) : (
          <EmptyState
            icon="body-outline"
            title="Nog geen metingen"
            subtitle="Log je gewicht om je verloop in de grafiek te zien."
          />
        )}

        {/* Recente metingen */}
        {recent.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recente metingen</Text>
            {recent.map((m) => (
              <View key={m.date} style={styles.entryRow}>
                <Text style={styles.entryDate}>{formatLongDate(m.date)}</Text>
                <Text style={styles.entryWeight}>{m.weight} kg</Text>
                <Pressable onPress={() => handleDelete(m.date)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        </ScrollView>
      </KeyboardAvoider>
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
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  weightInput: {
    flex: 1,
  },
  unit: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  saveBtnText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  entryDate: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },
  entryWeight: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
