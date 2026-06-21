// app/goals.tsx
// Doelen beheren: overzicht met voortgangsring per doel, nieuw doel toevoegen,
// bestaande bewerken/archiveren/verwijderen. Bereikbaar via Instellingen.

import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoalRing } from '@/components/goals/GoalRing';
import { goalDisplay } from '@/components/goals/goalDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { deleteGoal, getGoals, getGoalProgress, setGoalArchived } from '@/db/queries/goals';
import { colors, fontSize, radius, spacing } from '@/constants/colors';
import type { Goal, GoalProgress } from '@/types';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<GoalProgress[]>([]);
  const [archived, setArchived] = useState<Goal[]>([]);

  const load = useCallback(() => {
    const all = getGoals(true);
    setActive(all.filter((g) => !g.archived).map(getGoalProgress));
    setArchived(all.filter((g) => g.archived));
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  function openEdit(goalId?: number) {
    router.push(goalId != null ? `/modals/goal-edit?id=${goalId}` : '/modals/goal-edit');
  }

  function showActions(p: GoalProgress) {
    const d = goalDisplay(p);
    Alert.alert(d.title, d.targetLabel, [
      { text: 'Bewerken', onPress: () => openEdit(p.goal.id) },
      { text: 'Archiveren', onPress: () => { setGoalArchived(p.goal.id, true); load(); } },
      {
        text: 'Verwijderen',
        style: 'destructive',
        onPress: () => { deleteGoal(p.goal.id); load(); },
      },
      { text: 'Annuleer', style: 'cancel' },
    ]);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable style={styles.addBtn} onPress={() => openEdit()}>
        <Ionicons name="add" size={20} color={colors.primaryText} />
        <Text style={styles.addBtnText}>Nieuw doel</Text>
      </Pressable>

      {active.length === 0 ? (
        <EmptyState
          icon="flag-outline"
          title="Nog geen doelen"
          subtitle="Stel een doel in voor kracht, consistentie of volume en volg je voortgang."
        />
      ) : (
        active.map((p) => {
          const d = goalDisplay(p);
          return (
            <Pressable key={p.goal.id} style={styles.card} onPress={() => openEdit(p.goal.id)}>
              <GoalRing
                pct={p.pct}
                title=""
                centerLabel={d.centerLabel}
                deltaLabel=""
                reached={p.reached}
                size={84}
              />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{d.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>{d.subtitle}</Text>
                <Text
                  style={[styles.cardDelta, p.reached && { color: colors.success }]}
                  numberOfLines={1}
                >
                  {d.deltaLabel}
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => showActions(p)} style={styles.menuBtn}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
              </Pressable>
            </Pressable>
          );
        })
      )}

      {archived.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Gearchiveerd</Text>
          {archived.map((g) => {
            const d = goalDisplay(getGoalProgress(g));
            return (
              <Pressable
                key={g.id}
                style={[styles.card, styles.cardMuted]}
                onPress={() =>
                  Alert.alert(d.title, d.targetLabel, [
                    {
                      text: 'Herstellen',
                      onPress: () => { setGoalArchived(g.id, false); load(); },
                    },
                    {
                      text: 'Verwijderen',
                      style: 'destructive',
                      onPress: () => { deleteGoal(g.id); load(); },
                    },
                    { text: 'Annuleer', style: 'cancel' },
                  ])
                }
              >
                <Ionicons name="archive-outline" size={20} color={colors.textMuted} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{d.title}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>{d.targetLabel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </>
      ) : null}
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
    gap: spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  addBtnText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardMuted: {
    opacity: 0.7,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  cardDelta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: 4,
  },
  menuBtn: {
    padding: spacing.xs,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
  },
});
