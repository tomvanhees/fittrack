// app/(tabs)/settings.tsx

import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { exportData } from '@/lib/backup';
import { getSchemaVersion } from '@/db/migrations';
import { db } from '@/db/schema';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { usePrefsStore, useAccent } from '@/store/prefsStore';
import { ACCENT_PRESETS, colors, fonts, fontSize, radius, spacing } from '@/constants/colors';

const REST_PRESETS = [60, 90, 120, 150, 180];

function fmtRest(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function syncLabel(status: 'idle' | 'syncing' | 'error', lastSyncedAt: number | null): string {
  if (status === 'syncing') return 'Bezig met synchroniseren…';
  if (status === 'error') return 'Synchronisatie mislukt — tik om opnieuw te proberen';
  if (lastSyncedAt) {
    const t = new Date(lastSyncedAt);
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    return `Laatst gesynchroniseerd om ${hh}:${mm}`;
  }
  return 'Tik om nu te synchroniseren';
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState(false);
  const { status, user, configured, signOut } = useAuthStore();
  const { status: syncStatus, lastSyncedAt, error: syncError, syncNow } = useSyncStore();
  const { accent } = useAccent();
  const accentId = usePrefsStore((s) => s.accentId);
  const setAccent = usePrefsStore((s) => s.setAccent);
  const restSeconds = usePrefsStore((s) => s.restSeconds);
  const setRestSeconds = usePrefsStore((s) => s.setRestSeconds);

  function handleSignOut() {
    Alert.alert('Afmelden', 'Weet je zeker dat je wilt afmelden?', [
      { text: 'Annuleer', style: 'cancel' },
      { text: 'Afmelden', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  const appVersion = Constants.expoConfig?.version ?? '—';
  const schemaVersion = getSchemaVersion(db);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await exportData();
      if (!result.shared) {
        Alert.alert(
          'Geëxporteerd',
          `Back-up met ${result.rowCount} rijen opgeslagen:\n${result.uri}`
        );
      }
    } catch (e) {
      Alert.alert('Export mislukt', e instanceof Error ? e.message : 'Onbekende fout.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader kicker="Instellingen & data" title="Meer" accent={accent} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.sectionTitle}>Weergave</Text>
      <View style={styles.card}>
        <View style={styles.accentRow}>
          <Text style={styles.accentLabel}>Accentkleur</Text>
          <View style={styles.swatches}>
            {ACCENT_PRESETS.map((p) => {
              const selected = p.id === accentId;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setAccent(p.id)}
                  hitSlop={6}
                  accessibilityLabel={`Accent ${p.label}`}
                  style={[
                    styles.swatch,
                    { backgroundColor: p.accent },
                    selected && { borderColor: colors.text },
                  ]}
                >
                  <View style={[styles.swatchInner, { backgroundColor: p.partner }]} />
                  {selected ? (
                    <Ionicons name="checkmark" size={16} color="#fff" style={styles.swatchCheck} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Workout</Text>
      <View style={styles.card}>
        <View style={styles.restRow}>
          <View style={styles.restHead}>
            <Text style={styles.actionTitle}>Rusttijd tussen sets</Text>
            <Text style={[styles.restValue, { color: accent }]}>{fmtRest(restSeconds)}</Text>
          </View>
          <Text style={styles.actionSubtitle}>
            Standaardduur voor de rust-timer die je per set kan starten.
          </Text>

          <View style={styles.presetRow}>
            {REST_PRESETS.map((s) => {
              const active = s === restSeconds;
              return (
                <Pressable
                  key={s}
                  onPress={() => setRestSeconds(s)}
                  style={[
                    styles.chip,
                    active ? { backgroundColor: accent, borderColor: accent } : null,
                  ]}
                  accessibilityLabel={`Rusttijd ${fmtRest(s)}`}
                >
                  <Text style={[styles.chipText, active && { color: '#fff' }]}>{fmtRest(s)}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.stepper}>
            <Pressable
              onPress={() => setRestSeconds(restSeconds - 15)}
              style={styles.stepperBtn}
              accessibilityLabel="15 seconden minder"
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </Pressable>
            <Text style={styles.stepperLabel}>Fijn afstellen · ±15s</Text>
            <Pressable
              onPress={() => setRestSeconds(restSeconds + 15)}
              style={styles.stepperBtn}
              accessibilityLabel="15 seconden meer"
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Oefeningen</Text>
      <View style={styles.card}>
        <Pressable style={styles.action} onPress={() => router.push('/library')}>
          <Ionicons name="barbell-outline" size={20} color={accent} />
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Bibliotheek</Text>
            <Text style={styles.actionSubtitle}>
              Oefeningen zoeken, eigen oefeningen toevoegen en bewerken.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Doelen</Text>
      <View style={styles.card}>
        <Pressable style={styles.action} onPress={() => router.push('/goals')}>
          <Ionicons name="flag-outline" size={20} color={accent} />
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Doelen & targets</Text>
            <Text style={styles.actionSubtitle}>
              Stel doelen in voor kracht, consistentie en volume.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Lichaam</Text>
      <View style={styles.card}>
        <Pressable style={styles.action} onPress={() => router.push('/body')}>
          <Ionicons name="body-outline" size={20} color={accent} />
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Lichaamsgewicht</Text>
            <Text style={styles.actionSubtitle}>
              Log je gewicht en volg het verloop in een grafiek.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Gegevens</Text>
      <View style={styles.card}>
        <Pressable style={styles.action} onPress={handleExport} disabled={exporting}>
          <Ionicons name="download-outline" size={20} color={accent} />
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Gegevens exporteren</Text>
            <Text style={styles.actionSubtitle}>
              Volledige back-up als JSON (oefeningen, templates, workouts).
            </Text>
          </View>
          {exporting ? (
            <ActivityIndicator color={accent} />
          ) : (
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          )}
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Account & sync</Text>
      <View style={styles.card}>
        {!configured ? (
          <View style={styles.action}>
            <Ionicons name="cloud-offline-outline" size={20} color={colors.textMuted} />
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>Cloud-sync</Text>
              <Text style={styles.actionSubtitle}>
                Niet geconfigureerd — voeg je Supabase-keys toe aan .env.
              </Text>
            </View>
          </View>
        ) : status === 'loading' ? (
          <View style={styles.action}>
            <Ionicons name="cloud-outline" size={20} color={colors.textMuted} />
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>Cloud-sync</Text>
              <Text style={styles.actionSubtitle}>Sessie laden…</Text>
            </View>
            <ActivityIndicator color={accent} />
          </View>
        ) : status === 'signedIn' ? (
          <>
            <Pressable style={styles.action} onPress={() => syncNow()} disabled={syncStatus === 'syncing'}>
              <Ionicons
                name={syncStatus === 'error' ? 'cloud-offline-outline' : 'sync-outline'}
                size={20}
                color={syncStatus === 'error' ? colors.danger : accent}
              />
              <View style={styles.actionBody}>
                <Text style={styles.actionTitle}>Nu synchroniseren</Text>
                <Text
                  style={[styles.actionSubtitle, syncStatus === 'error' && { color: colors.danger }]}
                  numberOfLines={2}
                >
                  {syncStatus === 'error' && syncError
                    ? syncError
                    : syncLabel(syncStatus, lastSyncedAt)}
                </Text>
              </View>
              {syncStatus === 'syncing' ? (
                <ActivityIndicator color={accent} />
              ) : (
                <Ionicons name="refresh" size={18} color={colors.textMuted} />
              )}
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.action} onPress={handleSignOut}>
              <Ionicons name="cloud-done-outline" size={20} color={colors.success} />
              <View style={styles.actionBody}>
                <Text style={styles.actionTitle}>{user?.email ?? 'Aangemeld'}</Text>
                <Text style={styles.actionSubtitle}>Aangemeld — tik om af te melden.</Text>
              </View>
              <Ionicons name="log-out-outline" size={20} color={colors.textMuted} />
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.action} onPress={() => router.push('/modals/auth')}>
            <Ionicons name="cloud-outline" size={20} color={accent} />
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>Aanmelden</Text>
              <Text style={styles.actionSubtitle}>
                Bewaar en synchroniseer je workouts in de cloud.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <Text style={styles.sectionTitle}>Over</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App-versie</Text>
          <Text style={styles.infoValue}>{appVersion}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Databaseschema</Text>
          <Text style={styles.infoValue}>v{schemaVersion}</Text>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: fonts.jakarta700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentRow: {
    padding: spacing.md,
    gap: spacing.md,
  },
  accentLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fonts.jakarta700,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchInner: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  swatchCheck: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 2,
  },
  restRow: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  restHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restValue: {
    fontSize: fontSize.lg,
    fontFamily: fonts.grotesk700,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: fonts.grotesk700,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  stepperBtn: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: fonts.jakarta600,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  actionBody: {
    flex: 1,
  },
  actionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: fonts.jakarta700,
  },
  actionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  infoLabel: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  infoValue: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});
