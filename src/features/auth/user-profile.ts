import type { User } from '@supabase/supabase-js';

// O Supabase guarda o que o provedor devolveu em `user_metadata` e em
// `identities[].identity_data`, e cada um usa nomes de campo diferentes.
type Metadata = Record<string, unknown>;

function firstString(sources: Metadata[], keys: string[]): string | null {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
  }
  return null;
}

function metadataSources(user: User | null): Metadata[] {
  if (!user) return [];
  return [
    (user.user_metadata ?? {}) as Metadata,
    ...(user.identities ?? []).map((identity) => (identity.identity_data ?? {}) as Metadata),
  ];
}

/** URL da foto de perfil do provedor, ou `null` quando não houver. */
export function getAvatarUrl(user: User | null): string | null {
  return firstString(metadataSources(user), ['avatar_url', 'picture']);
}

/**
 * Foto como ícone de aba nativa: o `scale` é fixo porque a tab bar desenha a
 * imagem no tamanho declarado. Recebe a URL, e não o usuário, para o resultado
 * poder ser memoizado — identidade nova a cada render recarrega a imagem.
 */
export function getAvatarIconSource(url: string | null, pixelSize = 96) {
  if (!url) return null;

  const sized = url.includes('googleusercontent.com')
    ? `${url.replace(/=s\d+(-c)?$/, '')}=s${pixelSize}-c`
    : url;

  return { uri: sized, scale: 3 } as const;
}

/**
 * O nome cadastrado, ou `null`. Ao contrário de `getDisplayName`, não cai no
 * e-mail: é o valor certo para preencher um campo "Nome" editável.
 */
export function getStoredName(user: User | null): string | null {
  return firstString(metadataSources(user), [
    'display_name',
    'full_name',
    'name',
    'preferred_username',
  ]);
}

/**
 * Nome de exibição, com o e-mail como segundo recurso. `fallback` é o texto do
 * idioma ativo para quando não há nome nem e-mail — este módulo não conhece
 * `t()`, então quem chama resolve a tradução.
 */
export function getDisplayName(user: User | null, fallback: string): string {
  return getStoredName(user) ?? user?.email ?? fallback;
}

export type AccountProvider = 'email' | 'google' | 'apple';

const KNOWN_PROVIDERS: readonly AccountProvider[] = ['google', 'apple'];

/**
 * `'email'` sempre que existir identidade de senha — é a única condição que
 * libera a troca de senha, e uma conta pode ter mais de uma identidade.
 */
export function getAccountProvider(user: User | null): AccountProvider {
  const identityProviders = (user?.identities ?? []).map((identity) => identity.provider);

  if (identityProviders.includes('email')) return 'email';

  const knownIdentity = identityProviders.find((provider): provider is AccountProvider =>
    KNOWN_PROVIDERS.includes(provider as AccountProvider),
  );
  if (knownIdentity) return knownIdentity;

  const appMetadataProvider = user?.app_metadata?.provider;
  if (KNOWN_PROVIDERS.includes(appMetadataProvider as AccountProvider)) {
    return appMetadataProvider as AccountProvider;
  }

  return 'email';
}

/**
 * Primeira letra para o avatar sem foto. Desestruturação em vez de `[0]`: um
 * emoji no início do nome partiria ao meio com indexação direta.
 */
export function getAvatarInitial(user: User | null): string | null {
  const source = getStoredName(user) ?? user?.email ?? null;
  if (!source) return null;

  const trimmed = source.trim();
  if (!trimmed) return null;

  const [first] = trimmed;
  return first.toLocaleUpperCase('pt-BR');
}
