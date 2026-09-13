import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env } from '@/lib/env';
import type { Database } from '@/types/database';

const isWeb = Platform.OS === 'web';

/**
 * Cliente único do Supabase. `pkce` para o OAuth não expor tokens na URL, e
 * AsyncStorage no nativo para a sessão sobreviver ao fechar o app.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: isWeb ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,
    flowType: 'pkce',
  },
});

/**
 * O refresh automático de token só deve rodar com o app em primeiro plano.
 * Sem isso o Supabase tenta renovar a sessão com o app em background e gera
 * erros de rede/uso de bateria desnecessário.
 */
if (!isWeb) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
