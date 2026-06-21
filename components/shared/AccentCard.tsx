// components/shared/AccentCard.tsx
// Surface-kaart met een gekleurde accentbalk aan de linkerrand. De balk loopt
// volledig over de kaarthoogte (geclipt op de kaartradius). Optioneel pressable.

import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/colors';

interface AccentCardProps {
  accentColor: string;
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function AccentCard({ accentColor, children, onPress, style }: AccentCardProps) {
  const inner = (
    <>
      <View style={[styles.bar, { backgroundColor: accentColor }]} pointerEvents="none" />
      <View style={styles.body}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
        {inner}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{inner}</View>;
}

const BAR_WIDTH = 4;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: BAR_WIDTH,
  },
  body: {
    paddingLeft: 18 + BAR_WIDTH,
    paddingRight: 18,
    paddingVertical: 16,
  },
});
