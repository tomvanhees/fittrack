// components/shared/CategoryPicker.tsx

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES } from '@/constants/categories';
import { colors, radius, spacing, fontSize } from '@/constants/colors';
import type { Category } from '@/types';

interface CategoryPickerProps {
  value: Category;
  onChange: (category: Category) => void;
}

/** Chip-raster om een oefeningcategorie te kiezen. Gedeeld tussen het
 *  toevoegen- en bewerken-scherm zodat de UI op één plek leeft. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((c) => {
        const active = value === c.key;
        return (
          <Pressable
            key={c.key}
            onPress={() => onChange(c.key)}
            style={[styles.chip, active && { backgroundColor: c.color, borderColor: c.color }]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primaryText,
  },
});
