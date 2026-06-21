// store/prefsStore.ts
// Gebruikersvoorkeuren die de app-look bepalen. Vandaag enkel de accentkleur,
// persistent bewaard zodat de keuze app-herstarts overleeft.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  accentPresetById,
  DEFAULT_ACCENT_ID,
  type AccentPreset,
} from '@/constants/colors';

/** Standaard rusttijd tussen sets (seconden). 150 = 2:30. */
export const DEFAULT_REST_SECONDS = 150;

interface PrefsStore {
  accentId: string;
  setAccent: (id: string) => void;
  restSeconds: number;
  setRestSeconds: (seconds: number) => void;
}

export const usePrefsStore = create<PrefsStore>()(
  persist(
    (set) => ({
      accentId: DEFAULT_ACCENT_ID,
      setAccent: (id) => set({ accentId: id }),
      restSeconds: DEFAULT_REST_SECONDS,
      setRestSeconds: (seconds) =>
        // Klem tussen 15s en 10min, afgerond op 5s.
        set({ restSeconds: Math.max(15, Math.min(600, Math.round(seconds / 5) * 5)) }),
    }),
    {
      name: 'fittrack-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Live accent + gradient-partner op basis van de gekozen preset.
 * Componenten die een accentelement tekenen lezen dit en passen de kleur
 * inline toe (een runtime-kleur kan niet in een statische StyleSheet zitten).
 */
export function useAccent(): { accent: string; partner: string } {
  const accentId = usePrefsStore((s) => s.accentId);
  const preset = accentPresetById(accentId);
  return { accent: preset.accent, partner: preset.partner };
}

/** Niet-reactieve resolver (handig in tests / buiten React). */
export function resolveAccent(id: string | undefined): AccentPreset {
  return accentPresetById(id);
}
