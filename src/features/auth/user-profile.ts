import type { User } from '@supabase/supabase-js';

/**
 * Dados de exibição do usuário vindos do provedor de login.
 *
 * O Supabase guarda o que o provedor devolveu em `user_metadata` e em
 * `identities[].identity_data`. Cada provedor usa um nome de campo diferente
 * para a foto (`avatar_url` no Google via Supabase, `picture` no payload OIDC
 * cru), por isso a busca passa por ambos.
 *
 * A Apple não devolve foto — nesse caso o retorno é `null` e a tela mostra o
 * avatar padrão.
 */

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

/** Nome de exibição do provedor, com o e-mail como último recurso. */
export function getDisplayName(user: User | null): string {
  return (
    firstString(metadataSources(user), ['full_name', 'name', 'preferred_username']) ??
    user?.email ??
    'Usuário'
  );
}
