// app/_layout.tsx

import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from '@/db/schema';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { colors } from '@/constants/colors';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      initDatabase();
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Database-initialisatie mislukt');
    }
  }, []);

  // Auth-sessie laden + op wijzigingen luisteren (no-op zonder Supabase-config).
  useEffect(() => useAuthStore.getState().init(), []);

  // Auto-sync: bij aanmelden en bij elke voorgrond-activatie.
  useEffect(() => useSyncStore.getState().init(), []);

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="library" options={{ title: 'Bibliotheek' }} />
          <Stack.Screen name="progress" options={{ title: 'Voortgang' }} />
          <Stack.Screen name="body" options={{ title: 'Lichaam' }} />
          <Stack.Screen
            name="modals/add-exercise"
            options={{ presentation: 'modal', title: 'Oefening toevoegen' }}
          />
          <Stack.Screen
            name="modals/edit-template"
            options={{ presentation: 'modal', title: 'Template' }}
          />
          <Stack.Screen
            name="modals/exercise-detail"
            options={{ presentation: 'modal', title: 'Oefening' }}
          />
          <Stack.Screen
            name="modals/auth"
            options={{ presentation: 'modal', title: 'Account' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
