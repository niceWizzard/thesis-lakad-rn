import { createClient } from '@supabase/supabase-js';
import 'expo-sqlite/localStorage/install';
import { AppState } from 'react-native';
import { mmkvStorage } from './mmkv';


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;


const MMKVAdapter = {
  getItem: (key: string) => {
    const value = mmkvStorage.getString(key);
    // Return null if undefined (important for Supabase)
    return value === undefined ? null : value;
  },
  setItem: (key: string, value: string) => {
    mmkvStorage.set(key, value)
  },
  removeItem: (key: string) => {
    mmkvStorage.remove(key)
  },
}

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: MMKVAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
