// app/modals/auth.tsx
//
// Aanmelden / registreren met e-mail + wachtwoord (Supabase).

import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { KeyboardAvoider } from '@/components/shared/KeyboardAvoider';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { SolidButton } from '@/components/shared/Button';
import { useAuthStore } from '@/store/authStore';
import { useAccent } from '@/store/prefsStore';
import { colors, fontSize, radius, spacing } from '@/constants/colors';

type Mode = 'signin' | 'signup';

export default function AuthModal() {
  const { signIn, signUp } = useAuthStore();
  const { accent } = useAccent();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);

    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === 'signup' && result.needsConfirmation) {
      setInfo('Account aangemaakt. Bevestig je e-mail om aan te melden.');
      setMode('signin');
      return;
    }
    // Bij succes vuurt onAuthStateChange en is de status 'signedIn'.
    router.back();
  }

  return (
    <KeyboardAvoider style={styles.screen} behavior="padding">
      <ScreenHeader
        kicker="Account"
        title={mode === 'signin' ? 'Aanmelden' : 'Registreren'}
        accent={accent}
        onBack={() => router.back()}
        backIcon="close"
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Meld je aan om je workouts in de cloud te bewaren en te synchroniseren.
        </Text>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="jij@voorbeeld.be"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={styles.input}
        />

        <Text style={styles.label}>Wachtwoord</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Minstens 6 tekens"
          placeholderTextColor={colors.textFaint}
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={[styles.info, { color: accent }]}>{info}</Text> : null}

        <SolidButton
          label={mode === 'signin' ? 'Aanmelden' : 'Registreren'}
          accent={accent}
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={submitting}
          style={styles.submit}
        />

        <Pressable
          style={styles.toggle}
          onPress={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            setError(null);
            setInfo(null);
          }}
        >
          <Text style={[styles.toggleText, { color: accent }]}>
            {mode === 'signin'
              ? 'Nog geen account? Registreren'
              : 'Al een account? Aanmelden'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  info: {
    color: colors.primary,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  submit: {
    marginTop: spacing.lg,
  },
  toggle: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  toggleText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
