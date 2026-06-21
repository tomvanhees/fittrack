// components/today/RestTimerBar.tsx
// Zwevende rust-timer boven de footer-CTA. Telt af vanaf de absolute eindtijd
// in de store en trilt het toestel exact één keer wanneer de tijd op 0 staat.

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRestTimerStore } from '@/store/restTimerStore';
import { colors, fonts, radius } from '@/constants/colors';

function fmt(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface RestTimerBarProps {
  accent: string;
}

export function RestTimerBar({ accent }: RestTimerBarProps) {
  const { active, running, durationSec, endsAt, remainingMs, pause, resume, reset, addTime, stop } =
    useRestTimerStore();

  // Lokale "tick" om elke ~250ms te hertekenen terwijl de timer loopt.
  const [, force] = useState(0);
  const firedRef = useRef(false);

  // Resterende tijd: bij lopen afgeleid van endsAt, anders de bevroren waarde.
  const remaining = running ? Math.max(0, endsAt - Date.now()) : remainingMs;

  useEffect(() => {
    if (!active || !running) return;
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [active, running]);

  // Reset de "afgevuurd"-bewaking telkens een nieuwe timer start.
  useEffect(() => {
    firedRef.current = false;
  }, [endsAt, durationSec, active]);

  // Trillen wanneer de tijd op is — exact één keer.
  useEffect(() => {
    if (active && running && remaining <= 0 && !firedRef.current) {
      firedRef.current = true;
      Vibration.vibrate([0, 400, 200, 400]);
      stop();
    }
  }, [active, running, remaining, stop]);

  if (!active) return null;

  const progress = durationSec > 0 ? Math.max(0, Math.min(1, remaining / (durationSec * 1000))) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {/* Aftellende voortgangsvulling (loopt leeg). */}
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: `${accent}22` }]} />

        <Pressable
          onPress={running ? pause : resume}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityLabel={running ? 'Pauzeer rust-timer' : 'Hervat rust-timer'}
        >
          <Ionicons name={running ? 'pause' : 'play'} size={20} color={accent} />
        </Pressable>

        <View style={styles.center}>
          <Text style={styles.label}>RUST</Text>
          <Text style={[styles.time, { color: accent }]}>{fmt(remaining)}</Text>
        </View>

        <Pressable
          onPress={() => addTime(15)}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityLabel="Plus 15 seconden"
        >
          <Text style={[styles.plus, { color: colors.textMuted }]}>+15</Text>
        </Pressable>

        <Pressable onPress={reset} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Herstart rust-timer">
          <Ionicons name="refresh" size={19} color={colors.textMuted} />
        </Pressable>

        <Pressable onPress={stop} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Sla rust over">
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontFamily: fonts.jakarta700,
    color: colors.textFaint,
  },
  time: {
    fontSize: 26,
    fontFamily: fonts.grotesk700,
    lineHeight: 30,
  },
  plus: {
    fontSize: 14,
    fontFamily: fonts.grotesk700,
  },
});
