// app/(tabs)/templates.tsx

import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  createTemplate,
  getAllTemplates,
  weekHasExercises,
  type TemplateSummary,
} from '@/db/queries/templates';
import { useWorkoutStore } from '@/store/workoutStore';
import { todayISO } from '@/lib/date';
import { colors, fontSize, radius, spacing } from '@/constants/colors';

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const applyTemplate = useWorkoutStore((s) => s.applyTemplate);

  useFocusEffect(
    useCallback(() => {
      setTemplates(getAllTemplates());
    }, [])
  );

  function handleNew() {
    const created = createTemplate('Nieuwe template');
    router.push({ pathname: '/modals/edit-template', params: { id: String(created.id) } });
  }

  function handleUse(template: TemplateSummary) {
    if (template.dayCount === 0) {
      Alert.alert('Lege template', 'Voeg eerst oefeningen toe aan deze template.');
      return;
    }
    const target = todayISO();
    const apply = () => {
      applyTemplate(template.id, target);
      Alert.alert('Toegepast', `"${template.name}" is toegepast op deze week.`);
    };
    if (weekHasExercises(target)) {
      Alert.alert(
        'Week overschrijven?',
        'Deze week bevat al oefeningen. De betrokken dagen worden overschreven.',
        [
          { text: 'Annuleer', style: 'cancel' },
          { text: 'Overschrijf', style: 'destructive', onPress: apply },
        ]
      );
    } else {
      apply();
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {templates.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title="Nog geen templates"
            subtitle="Maak een herbruikbaar weekschema aan, bv. Push / Pull / Legs."
          />
        ) : (
          templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onUse={() => handleUse(t)}
              onEdit={() =>
                router.push({ pathname: '/modals/edit-template', params: { id: String(t.id) } })
              }
            />
          ))
        )}

        <Pressable style={styles.newBtn} onPress={handleNew}>
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.newBtnText}>Nieuwe template</Text>
        </Pressable>
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
    padding: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
    gap: spacing.md,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  newBtnText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
