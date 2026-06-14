// store/syncStore.ts
//
// Stuurt de cloud-sync aan: handmatig ("Nu synchroniseren") en automatisch
// (bij aanmelden en telkens de app naar de voorgrond komt).

import { AppState } from 'react-native';
import { create } from 'zustand';
import { isSupabaseConfigured } from '@/db/sync/client';
import { syncAll } from '@/db/sync/engine';
import { resetCursors } from '@/db/sync/state';
import { useAuthStore } from './authStore';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface SyncStore {
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  syncNow: () => Promise<void>;
  init: () => () => void;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  status: 'idle',
  lastSyncedAt: null,
  error: null,

  syncNow: async () => {
    if (!isSupabaseConfigured) return;
    if (useAuthStore.getState().status !== 'signedIn') return;
    if (get().status === 'syncing') return;

    set({ status: 'syncing', error: null });
    try {
      await syncAll();
      set({ status: 'idle', lastSyncedAt: Date.now() });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : 'Synchronisatie mislukt' });
    }
  },

  init: () => {
    if (!isSupabaseConfigured) return () => {};

    // Sync telkens de app naar de voorgrond komt.
    const appSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') get().syncNow();
    });

    // Sync zodra de gebruiker aanmeldt; cursors resetten bij afmelden zodat een
    // volgende login vers pullt.
    const unsubAuth = useAuthStore.subscribe((state, prev) => {
      if (state.status === 'signedIn' && prev.status !== 'signedIn') get().syncNow();
      if (state.status === 'signedOut' && prev.status === 'signedIn') resetCursors();
    });

    // Al aangemeld bij app-start? Meteen synchroniseren.
    if (useAuthStore.getState().status === 'signedIn') get().syncNow();

    return () => {
      appSub.remove();
      unsubAuth();
    };
  },
}));
