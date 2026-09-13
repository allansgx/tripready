import Constants from 'expo-constants';

/**
 * A versão de `app.json` (a que vai para as lojas), com o valor nativo como
 * reserva. `null` quando nenhum dos dois está disponível — sem fallback fixo
 * no código, que continuaria dizendo a mesma versão depois de um release e
 * mentiria com confiança.
 */
export const appVersion: string | null =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? null;

/** Rótulo pronto para exibição no rodapé do Perfil; `null` quando não há versão. */
export const appVersionLabel: string | null = appVersion ? `TripReady · v${appVersion}` : null;
