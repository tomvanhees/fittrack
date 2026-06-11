// app/modals/edit-template.tsx

import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { TemplateDayEditor } from '@/components/templates/TemplateDayEditor';
import {
  deleteTemplate,
  getOrCreateTemplateDay,
  getTemplateWithDays,
  removeTemplateDayExercise,
  setTemplateDayLabel,
  updateTemplateName,
} from '@/db/queries/templates';
import { colors, fontSize, radius, spacing } from '@/constants/colors';
import type { TemplateWithDays } from '@/types';

export default function EditTemplateModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const templateId = Number(id);

  const [template, setTemplate] = useState<TemplateWithDays | null>(null);
  const [name, setName] = useState('');
  const [selectedWeekday, setSelectedWeekday] = useState(1); // maandag

  const reload = useCallback(() => {
    const t = getTemplateWithDays(templateId);
    setTemplate(t);
    if (t) setName(t.name);
  }, [templateId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  function persistName() {
    if (name.trim().length > 0) updateTemplateName(templateId, name);
  }

  function handleAddExercise() {
    const day = getOrCreateTemplateDay(templateId, selectedWeekday);
    router.push({
      pathname: '/modals/add-exercise',
      params: { templateDayId: String(day.id) },
    });
  }

  function handleRemoveExercise(tdeId: number) {
    removeTemplateDayExercise(tdeId);
    reload();
  }

  function handleChangeLabel(label: string) {
    if (!template) return;
    const day = getOrCreateTemplateDay(templateId, selectedWeekday);
    setTemplateDayLabel(day.id, label);
    setTemplate((prev) => {
      if (!prev) return prev;
      const days = [...prev.days];
      const idx = days.findIndex((d) => d.weekday === selectedWeekday);
      if (idx >= 0) {
        days[idx] = { ...days[idx], label };
      } else {
        days.push({
          id: day.id,
          templateId: prev.id,
          weekday: selectedWeekday,
          label,
          exercises: [],
        });
      }
      return { ...prev, days };
    });
  }

  function handleDelete() {
    Alert.alert('Template verwijderen', `"${name}" definitief verwijderen?`, [
      { text: 'Annuleer', style: 'cancel' },
      {
        text: 'Verwijder',
        style: 'destructive',
        onPress: () => {
          deleteTemplate(templateId);
          router.back();
        },
      },
    ]);
  }

  function handleSave() {
    persistName();
    router.back();
  }

  if (!template) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>Template niet gevonden.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.fieldLabel}>Naam</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        onBlur={persistName}
        placeholder="Template naam"
        placeholderTextColor={colors.textFaint}
        style={styles.nameInput}
      />

      <TemplateDayEditor
        template={template}
        selectedWeekday={selectedWeekday}
        onSelectWeekday={setSelectedWeekday}
        onAddExercise={handleAddExercise}
        onRemoveExercise={handleRemoveExercise}
        onChangeLabel={handleChangeLabel}
      />

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Ionicons name="save-outline" size={18} color={colors.primaryText} />
        <Text style={styles.saveBtnText}>Opslaan</Text>
      </Pressable>

      <Pressable style={styles.deleteBtn} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
        <Text style={styles.deleteBtnText}>Template verwijderen</Text>
      </Pressable>
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
    paddingBottom: spacing.xxl,
  },
  missing: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  nameInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  saveBtnText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
