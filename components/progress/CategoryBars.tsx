// components/progress/CategoryBars.tsx
// Horizontale staven voor het aantal sets per spiergroep — opgebouwd uit Views.

import { StyleSheet, Text, View } from 'react-native';
import { categoryColor, categoryLabel } from '@/constants/categories';
import { colors, fontSize, radius, spacing } from '@/constants/colors';
import type { Category } from '@/types';

export interface CategoryDatum {
  category: Category;
  value: number;
}

interface CategoryBarsProps {
  data: CategoryDatum[];
}

export function CategoryBars({ data }: CategoryBarsProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.list}>
      {data.map((d) => (
        <View key={d.category} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>
            {categoryLabel(d.category)}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max((d.value / max) * 100, 2)}%`,
                  backgroundColor: categoryColor(d.category),
                },
              ]}
            />
          </View>
          <Text style={styles.value}>{d.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    width: 76,
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  track: {
    flex: 1,
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.sm,
  },
  value: {
    width: 52,
    textAlign: 'right',
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
