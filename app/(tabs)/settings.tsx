// app/(tabs)/settings.tsx

import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exportData } from '@/lib/backup';
import { getSchemaVersion } from '@/db/migrations';
import { db } from '@/db/schema';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { colors, fontSize, radius, spacing } from '@/constants/colors';

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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Oefeningen</Text>
      <View style={styles.card}>
        <Pressable style={styles.action} onPress={() => router.push('/library')}>
          <Ionicons name="barbell-outline" size={20} color={colors.primary} />
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Bibliotheek</Text>
            <Text style={styles.actionSubtitle}>
              Oefeningen zoeken, eigen oefeningen toevoegen en bewerken.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Lichaam</Text>
      <View style={styles.card}>
        <Pressable style={styles.action} onPress={() => router.push('/body')}>
          <Ionicons name="body-outline" size={20} color={colors.primary} />
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
          <Ionicons name="download-outline" size={20} color={colors.primary} />
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Gegevens exporteren</Text>
            <Text style={styles.actionSubtitle}>
              Volledige back-up als JSON (oefeningen, templates, workouts).
            </Text>
          </View>
          {exporting ? (
            <ActivityIndicator color={colors.primary} />
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
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : status === 'signedIn' ? (
          <>
            <Pressable style={styles.action} onPress={() => syncNow()} disabled={syncStatus === 'syncing'}>
              <Ionicons
                name={syncStatus === 'error' ? 'cloud-offline-outline' : 'sync-outline'}
                size={20}
                color={syncStatus === 'error' ? colors.danger : colors.primary}
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
                <ActivityIndicator color={colors.primary} />
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
            <Ionicons name="cloud-outline" size={20} color={colors.primary} />
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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
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
    fontWeight: '700',
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
