/**
 * Só chaves `EXPO_PUBLIC_*`: elas são embutidas no bundle. Nenhum secret
 * (service_role, JWT secret, client secret) entra aqui nem no resto do app.
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
