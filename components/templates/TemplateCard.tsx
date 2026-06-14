// components/templates/TemplateCard.tsx

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WEEKDAY_LABELS } from '@/constants/categories';
import { colors, fontSize, radius, shadow, spacing } from '@/constants/colors';
import type { TemplateSummary } from '@/db/queries/templates';

interface TemplateCardProps {
  template: TemplateSummary;
  onUse: () => void;
  onEdit: () => void;
}

export function TemplateCard({ template, onUse, onEdit }: TemplateCardProps) {
  const dayLabels = template.weekdays.map((w) => WEEKDAY_LABELS[w]).join(' • ');
  const summary =
    template.dayCount > 0
      ? `${dayLabels} — ${template.dayCount} ${template.dayCount === 1 ? 'dag' : 'dagen'}`
      : 'Nog geen dagen ingevuld';

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{template.name}</Text>
      <Text style={styles.summary}>{summary}</Text>

      <View style={styles.actions}>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onUse}>
          <Ionicons name="calendar-outline" size={16} color={colors.primaryText} />
          <Text style={styles.btnPrimaryText}>Gebruik deze week</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnIcon]} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  summary: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: colors.primaryText,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  btnIcon: {
    width: 44,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
