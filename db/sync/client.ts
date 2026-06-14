// db/sync/client.ts
//
// Supabase-client (auth + Postgres). De keys komen uit env-variabelen
// (EXPO_PUBLIC_*), die veilig in de bundle mogen omdat Row Level Security de
// data afschermt. Zolang de keys ontbreken blijft `supabase` null en werkt de
// app gewoon lokaal door — sync/auth zijn dan simpelweg uitgeschakeld.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True wanneer beide env-keys aanwezig zijn. */
export const isSupabaseConfigured =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.length > 0 &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.length > 0;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        // Geen URL-detectie: in een native app komt de sessie niet uit de URL.
        detectSessionInUrl: false,
      },
    })
  : null;
