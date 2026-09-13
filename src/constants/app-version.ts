import Constants from 'expo-constants';

/**
 * A versão de `app.json`, com o valor nativo como reserva. `null` sem nenhum
 * dos dois: um fallback fixo mentiria com confiança depois de um release.
 */
export const appVersion: string | null =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? null;

/** Rótulo pronto para exibição no rodapé do Perfil; `null` quando não há versão. */
export const appVersionLabel: string | null = appVersion ? `TripReady · v${appVersion}` : null;
