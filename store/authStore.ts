// store/authStore.ts
//
// Authenticatiestatus rond de Supabase-client. Werkt alleen wanneer Supabase
// geconfigureerd is; anders blijft de status 'signedOut' en doet niets.

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/db/sync/client';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthResult {
  error?: string;
  /** True na signUp wanneer de gebruiker eerst zijn e-mail moet bevestigen. */
  needsConfirmation?: boolean;
}

interface AuthStore {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  configured: boolean;

  /** Laadt de bestaande sessie en luistert naar wijzigingen. */
  init: () => () => void;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: isSupabaseConfigured ? 'loading' : 'signedOut',
  session: null,
  user: null,
  configured: isSupabaseConfigured,

  init: () => {
    if (!supabase) {
      set({ status: 'signedOut' });
      return () => {};
    }

    supabase.auth.getSession().then(({ data }) => {
      set({
        session: data.session,
        user: data.session?.user ?? null,
        status: data.session ? 'signedIn' : 'signedOut',
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        status: session ? 'signedIn' : 'signedOut',
      });
    });

    return () => sub.subscription.unsubscribe();
  },

  signUp: async (email, password) => {
    if (!supabase) return { error: 'Supabase is niet geconfigureerd.' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) return { error: error.message };
    // Geen sessie terug → e-mailbevestiging staat aan in het project.
    return { needsConfirmation: !data.session };
  },

  signIn: async (email, password) => {
    if (!supabase) return { error: 'Supabase is niet geconfigureerd.' };
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return error ? { error: error.message } : {};
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  },
}));
