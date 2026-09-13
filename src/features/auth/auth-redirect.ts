import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** `true` quando o app roda dentro do Expo Go (e não em um build próprio). */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Host do dev server (`192.168.0.10:8081`, `abc.exp.direct`, `localhost:8081`...). */
export const devServerHost = Constants.expoConfig?.hostUri ?? null;

/**
 * URL de retorno do OAuth. No Expo Go o `expo-linking` ignora o `scheme` custom
 * e monta o link a partir do host do dev server, que muda com o IP/porta — daí
 * o allow list do Supabase precisar de `exp://**` além das URLs fixas.
 */
export const authRedirectUri = AuthSession.makeRedirectUri({
  scheme: 'tripready',
  path: 'auth/callback',
});

/**
 * Avisos de configuração detectáveis em tempo de execução. Só usados em `__DEV__`
 * — servem para mostrar na tela de login exatamente qual URL precisa estar
 * cadastrada no Supabase.
 */
export function getRedirectDiagnostics() {
  const isLoopback = Platform.OS !== 'web' && /:\/\/(localhost|127\.0\.0\.1)/.test(authRedirectUri);

  return {
    uri: authRedirectUri,
    isExpoGo,
    devServerHost,
    warning: isLoopback
      ? 'O redirect aponta para localhost. Em aparelho físico isso nunca volta para o app: ' +
        'inicie o servidor com `npx expo start --lan` (ou `--tunnel`).'
      : null,
  };
}

if (__DEV__) {
  const { uri, warning } = getRedirectDiagnostics();
  console.log(
    `[auth] redirect_to = ${uri}` + (isExpoGo ? ' (Expo Go — cadastre exp://** no Supabase)' : ''),
  );
  if (warning) {
    console.warn(`[auth] ${warning}`);
  }
}
