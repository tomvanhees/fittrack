// components/shared/StatTiles.tsx
// Rij van compacte stat-tegels: groot cijfer (accent voor de primaire tegel) +
// gedempt label eronder. Gebruikt o.a. op Vandaag (sets / volume).

import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/constants/colors';

export interface StatTileData {
  value: string;
  label: string;
  accent?: boolean; // kleur het cijfer met de accentkleur
}

interface StatTilesProps {
  tiles: StatTileData[];
  accent: string;
}

export function StatTiles({ tiles, accent }: StatTilesProps) {
  return (
    <View style={styles.row}>
      {tiles.map((t, i) => (
        <View key={`${t.label}-${i}`} style={styles.tile}>
          <Text style={[styles.value, t.accent && { color: accent }]} numberOfLines={1}>
            {t.value}
          </Text>
          <Text style={styles.label} numberOfLines={1}>
            {t.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  value: {
    color: colors.text,
    fontSize: 28,
    fontFamily: fonts.grotesk700,
    letterSpacing: -0.5,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.jakarta600,
    marginTop: 2,
  },
});
