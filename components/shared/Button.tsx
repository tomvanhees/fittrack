// components/shared/Button.tsx
// Gedeelde knop-primitieven voor de hele app. Drie smaken:
//   • SolidButton    — gevulde accent-pill (primaire actie in een kaart/scherm)
//   • GradientButton  — accent→partner gradient met gloed (hoofd-CTA)
//   • GhostButton     — transparante stippellijn-knop (toevoegen/secundair)
//   • IconButton      — ronde icoonknop (header-acties)

import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius } from '@/constants/colors';

type IconName = keyof typeof Ionicons.glyphMap;

interface SolidProps {
  label: string;
  onPress: () => void;
  accent: string;
  icon?: IconName;
  pill?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SolidButton({ label, onPress, accent, icon, pill, disabled, loading, style }: SolidProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: accent, borderRadius: pill ? radius.pill : 16 },
        (pressed || disabled) && { opacity: disabled ? 0.45 : 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={19} color="#fff" /> : null}
          <Text style={styles.solidText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

interface GradientProps {
  label: string;
  onPress: () => void;
  accent: string;
  partner: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function GradientButton({ label, onPress, accent, partner, icon, style }: GradientProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.9 }, style]}>
      <LinearGradient
        colors={[accent, partner]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { shadowColor: accent }]}
      >
        {icon ? <Ionicons name={icon} size={20} color="#fff" /> : null}
        <Text style={styles.gradientText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

interface GhostProps {
  label: string;
  onPress: () => void;
  accent: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function GhostButton({ label, onPress, accent, icon = 'add', style }: GhostProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghost,
        { borderColor: `${accent}55`, backgroundColor: `${accent}0F` },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Ionicons name={icon} size={19} color={accent} />
      <Text style={[styles.ghostText, { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  color?: string;
  children?: ReactNode; // override content (bv. badge)
}

export function IconButton({ icon, onPress, color = colors.text, children }: IconButtonProps) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
      {children ?? <Ionicons name={icon} size={20} color={color} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  solidText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.jakarta800,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: radius.pill,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  gradientText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.jakarta800,
  },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  ghostText: {
    fontSize: 14,
    fontFamily: fonts.jakarta800,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
});
