// components/shared/ScreenHeader.tsx
// Gedeelde in-content schermheader (vervangt de native nav-titel). Vaste opbouw:
//   [← terug]            (optioneel)
//   KICKER · accent      [rechter-actie]
//   Grote titel
//   subtitel             (optioneel)

import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/constants/colors';

interface ScreenHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  accent: string;
  onBack?: () => void;
  backIcon?: keyof typeof Ionicons.glyphMap; // bv. 'close' voor modals
  right?: ReactNode;
}

export function ScreenHeader({ kicker, title, subtitle, accent, onBack, backIcon = 'chevron-back', right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 14 }]}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}>
          <Ionicons name={backIcon} size={22} color={colors.textMuted} />
        </Pressable>
      ) : null}

      <View style={styles.topRow}>
        {kicker ? (
          <Text style={[styles.kicker, { color: accent }]} numberOfLines={1}>
            {kicker}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  back: {
    marginBottom: 8,
    marginLeft: -4,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 30,
  },
  kicker: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.jakarta800,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  right: {
    marginLeft: 12,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 39,
    fontFamily: fonts.jakarta800,
    letterSpacing: -1,
    marginTop: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.jakarta600,
    marginTop: 6,
  },
});
