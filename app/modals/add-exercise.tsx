// app/modals/add-exercise.tsx

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
import { getAllExercises } from '@/db/queries/exercises';
import { addTemplateDayExercise } from '@/db/queries/templates';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { SolidButton } from '@/components/shared/Button';
import { useWorkoutStore } from '@/store/workoutStore';
import { useAccent } from '@/store/prefsStore';
import { CATEGORIES, categoryColor, categoryLabel } from '@/constants/categories';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/colors';
import type { Category } from '@/types';

export default function AddExerciseModal() {
  const { accent } = useAccent();
  const params = useLocalSearchParams<{ date?: string; templateDayId?: string }>();
  const addExerciseToDate = useWorkoutStore((s) => s.addExerciseToDate);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | Category>('all');
  const [addedIds, setAddedIds] = useState<number[]>([]);

  const all = useMemo(() => getAllExercises(), []);
  const filtered = all.filter((e) => {
    const matchesCat = category === 'all' || e.category === category;
    const matchesQuery =
      query.trim().length === 0 || e.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCat && matchesQuery;
  });

  function handleAdd(exerciseId: number) {
    if (params.templateDayId) {
      addTemplateDayExercise(Number(params.templateDayId), exerciseId);
    } else if (params.date) {
      addExerciseToDate(params.date, exerciseId);
    }
    setAddedIds((ids) => [...ids, exerciseId]);
  }

  const filterTabs: ('all' | Category)[] = ['all', ...CATEGORIES.map((c) => c.key)];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        kicker="Toevoegen"
        title="Oefening"
        accent={accent}
        onBack={() => router.back()}
        backIcon="close"
      />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Zoek oefening..."
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
          autoFocus
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
      >
        {filterTabs.map((cat) => {
          const active = category === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.tab, active && { backgroundColor: accent, borderColor: accent }]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {cat === 'all' ? 'Alle' : categoryLabel(cat)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((ex) => {
          const added = addedIds.includes(ex.id);
          return (
            <Pressable key={ex.id} style={styles.row} onPress={() => handleAdd(ex.id)}>
              <View style={[styles.dot, { backgroundColor: categoryColor(ex.category) }]} />
              <Text style={styles.rowName} numberOfLines={1}>
                {ex.name}
              </Text>
              <Text style={styles.rowCat}>{categoryLabel(ex.category)}</Text>
              <Ionicons
                name={added ? 'checkmark-circle' : 'add-circle-outline'}
                size={22}
                color={added ? colors.success : accent}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <SolidButton
          label={`Klaar${addedIds.length > 0 ? ` (${addedIds.length} toegevoegd)` : ''}`}
          accent={accent}
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
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
  tabsScroll: {
    marginTop: spacing.md,
    flexGrow: 0,
  },
  tabs: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: fonts.jakarta600,
  },
  tabTextActive: {
    color: colors.primaryText,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
  },
  row: {
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
  rowName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  rowCat: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
