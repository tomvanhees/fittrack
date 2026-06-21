// app/(tabs)/templates.tsx

import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { GhostButton } from '@/components/shared/Button';
import {
  createTemplate,
  getAllTemplates,
  type TemplateSummary,
} from '@/db/queries/templates';
import { useWorkoutStore } from '@/store/workoutStore';
import { useAccent } from '@/store/prefsStore';
import { todayISO } from '@/lib/date';
import { colors, spacing } from '@/constants/colors';

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();
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
    applyTemplate(template.id, target);
    Alert.alert(
      'Toegepast',
      `"${template.name}" is toegepast op deze week. Bestaande oefeningen blijven behouden; nieuwe worden toegevoegd.`
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader kicker="Schema's" title="Templates" accent={accent} />
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

        <GhostButton label="Nieuwe template" accent={accent} onPress={handleNew} />
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
    paddingTop: spacing.md,
    gap: spacing.md,
  },
});
