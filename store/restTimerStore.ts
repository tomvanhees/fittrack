// store/restTimerStore.ts
// Globale rust-timer tussen sets. We bewaren een absolute eindtijd (epoch ms)
// i.p.v. een aftellende teller, zodat de getoonde tijd accuraat blijft ook als
// JS even gethrottled wordt. Geen persistentie: een rust-timer hoort niet een
// app-herstart te overleven.

import { create } from 'zustand';
import { usePrefsStore } from './prefsStore';

interface RestTimerStore {
  active: boolean;
  running: boolean;        // false = gepauzeerd
  durationSec: number;     // duur waarmee deze timer startte (voor reset/progress)
  endsAt: number;          // epoch ms waarop de timer afloopt (geldig als running)
  remainingMs: number;     // resterende ms wanneer gepauzeerd

  start: (seconds?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  addTime: (deltaSec: number) => void;
  stop: () => void;
}

export const useRestTimerStore = create<RestTimerStore>((set, get) => ({
  active: false,
  running: false,
  durationSec: 0,
  endsAt: 0,
  remainingMs: 0,

  start: (seconds) => {
    const secs = seconds ?? usePrefsStore.getState().restSeconds;
    set({
      active: true,
      running: true,
      durationSec: secs,
      endsAt: Date.now() + secs * 1000,
      remainingMs: secs * 1000,
    });
  },

  pause: () => {
    if (!get().running) return;
    set({ running: false, remainingMs: Math.max(0, get().endsAt - Date.now()) });
  },

  resume: () => {
    if (get().running || !get().active) return;
    set({ running: true, endsAt: Date.now() + get().remainingMs });
  },

  reset: () => {
    const secs = get().durationSec || usePrefsStore.getState().restSeconds;
    set({
      active: true,
      running: true,
      durationSec: secs,
      endsAt: Date.now() + secs * 1000,
      remainingMs: secs * 1000,
    });
  },

  addTime: (deltaSec) => {
    const { running, endsAt, remainingMs, durationSec } = get();
    const delta = deltaSec * 1000;
    if (running) {
      const newEnds = Math.max(Date.now(), endsAt + delta);
      set({ endsAt: newEnds, durationSec: durationSec + deltaSec, remainingMs: newEnds - Date.now() });
    } else {
      set({ remainingMs: Math.max(0, remainingMs + delta), durationSec: durationSec + deltaSec });
    }
  },

  stop: () => set({ active: false, running: false, endsAt: 0, remainingMs: 0 }),
}));
