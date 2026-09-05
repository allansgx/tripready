/**
 * Variáveis de ambiente públicas do app.
 *
 * Apenas chaves `EXPO_PUBLIC_*` podem existir aqui: elas são embutidas no bundle
 * e, portanto, são públicas. Nenhuma chave secreta (service_role, JWT secret,
 * client secret de OAuth) deve entrar neste arquivo ou em qualquer código do app.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. ` +
        'Defina-a no arquivo .env na raiz do projeto e reinicie o bundler ' +
        '(npx expo start --clear).',
    );
  }
  return value.trim();
}

export const env = {
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: requireEnv(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
} as const;
