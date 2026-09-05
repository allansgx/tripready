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

/**
 * Fonte de imagem da foto para uso como ícone de aba nativa.
 *
 * A tab bar nativa desenha a imagem no tamanho que ela declara, então o
 * `scale` é fixado: uma foto de 96px vira ~32pt, próximo do tamanho padrão de
 * um ícone de aba. URLs do Google aceitam o sufixo `=s<px>-c` (quadrado e
 * recortado), então o tamanho é pedido direto na origem em vez de baixar a
 * imagem cheia. Retorna `null` quando não há foto.
 *
 * Recebe a URL (e não o usuário) para o resultado poder ser memoizado por uma
 * string estável: o objeto devolvido vira prop de ícone da aba nativa, e uma
 * identidade nova a cada render reconfigura a aba e recarrega a imagem.
 */
export function getAvatarIconSource(url: string | null, pixelSize = 96) {
  if (!url) return null;

  const sized = url.includes('googleusercontent.com')
    ? `${url.replace(/=s\d+(-c)?$/, '')}=s${pixelSize}-c`
    : url;

  return { uri: sized, scale: 3 } as const;
}

/**
 * Nome de exibição, com o e-mail como último recurso.
 *
 * `display_name` vem do cadastro por e-mail (é o campo que o painel do Supabase
 * mostra com esse nome); `full_name` e `name` vêm dos provedores OAuth.
 */
export function getDisplayName(user: User | null): string {
  return (
    firstString(metadataSources(user), [
      'display_name',
      'full_name',
      'name',
      'preferred_username',
    ]) ??
    user?.email ??
    'Usuário'
  );
}
