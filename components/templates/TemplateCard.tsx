// components/templates/TemplateCard.tsx

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccentCard } from '@/components/shared/AccentCard';
import { SolidButton } from '@/components/shared/Button';
import { WEEKDAY_LABELS } from '@/constants/categories';
import { useAccent } from '@/store/prefsStore';
import { colors, fonts, fontSize } from '@/constants/colors';
import type { TemplateSummary } from '@/db/queries/templates';

interface TemplateCardProps {
  template: TemplateSummary;
  onUse: () => void;
  onEdit: () => void;
}

export function TemplateCard({ template, onUse, onEdit }: TemplateCardProps) {
  const { accent } = useAccent();
  const dayLabels = template.weekdays.map((w) => WEEKDAY_LABELS[w]).join(' • ');
  const summary =
    template.dayCount > 0
      ? `${dayLabels} — ${template.dayCount} ${template.dayCount === 1 ? 'dag' : 'dagen'}`
      : 'Nog geen dagen ingevuld';

  return (
    <AccentCard accentColor={accent}>
      <Text style={styles.name}>{template.name}</Text>
      <Text style={styles.summary}>{summary}</Text>

      <View style={styles.actions}>
        <SolidButton
          label="Gebruik deze week"
          icon="calendar-outline"
          accent={accent}
          onPress={onUse}
          style={styles.useBtn}
        />
        <Pressable style={styles.editBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color={colors.text} />
        </Pressable>
      </View>
    </AccentCard>
  );
}

const styles = StyleSheet.create({
  name: {
    color: colors.text,
    fontSize: 19,
    fontFamily: fonts.jakarta800,
    letterSpacing: -0.3,
  },
  summary: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: fonts.jakarta500,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  useBtn: {
    flex: 1,
    paddingVertical: 12,
  },
  editBtn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
  },
});
