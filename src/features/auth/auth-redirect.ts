import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** `true` quando o app roda dentro do Expo Go (e não em um build próprio). */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Host do dev server (`192.168.0.10:8081`, `abc.exp.direct`, `localhost:8081`...). */
export const devServerHost = Constants.expoConfig?.hostUri ?? null;

/**
 * URL de retorno do OAuth.
 *
 * Atenção ao comportamento do Expo Go: `expo-linking` ignora silenciosamente o
 * `scheme` custom quando `executionEnvironment === StoreClient`
 * (ver `resolveScheme` em expo-linking/build/Schemes.js) e monta o link a partir
 * do host do dev server. Ou seja:
 *
 * - Expo Go:            `exp://<host-do-dev-server>/--/auth/callback`
 * - Build nativo:       `tripready://auth/callback`
 * - Web (dev):          `http://localhost:8081/auth/callback`
 *
 * No Expo Go a URL muda junto com o IP/porta da máquina, por isso o allow list
 * do Supabase precisa de um padrão com curinga (`exp://**`) além das URLs fixas.
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
  const isLoopback =
    Platform.OS !== 'web' && /:\/\/(localhost|127\.0\.0\.1)/.test(authRedirectUri);

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
    `[auth] redirect_to = ${uri}` +
      (isExpoGo ? ' (Expo Go — cadastre exp://** no Supabase)' : ''),
  );
  if (warning) {
    console.warn(`[auth] ${warning}`);
  }
}
