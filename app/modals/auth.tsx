// app/modals/auth.tsx
//
// Aanmelden / registreren met e-mail + wachtwoord (Supabase).

import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { KeyboardAvoider } from '@/components/shared/KeyboardAvoider';
import { useAuthStore } from '@/store/authStore';
import { colors, fontSize, radius, spacing } from '@/constants/colors';

type Mode = 'signin' | 'signup';

export default function AuthModal() {
  const { signIn, signUp } = useAuthStore();

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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {mode === 'signin' ? 'Aanmelden' : 'Account aanmaken'}
        </Text>
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
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Pressable
          style={[styles.submit, !canSubmit && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={styles.submitText}>
              {mode === 'signin' ? 'Aanmelden' : 'Registreren'}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.toggle}
          onPress={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            setError(null);
            setInfo(null);
          }}
        >
          <Text style={styles.toggleText}>
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
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginTop: spacing.sm,
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
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: '700',
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
