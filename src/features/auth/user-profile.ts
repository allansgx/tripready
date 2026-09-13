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
 * O nome cadastrado, ou `null` quando não há nenhum.
 *
 * `display_name` vem do cadastro por e-mail (é o campo que o painel do Supabase
 * mostra com esse nome); `full_name` e `name` vêm dos provedores OAuth. Ao
 * contrário de `getDisplayName`, não cai no e-mail — é o valor certo para
 * preencher um campo "Nome" editável, onde mostrar o e-mail faria a pessoa
 * salvar o próprio e-mail como nome sem perceber.
 */
export function getStoredName(user: User | null): string | null {
  return firstString(metadataSources(user), [
    'display_name',
    'full_name',
    'name',
    'preferred_username',
  ]);
}

/** Nome de exibição, com o e-mail e por fim "Usuário" como últimos recursos. */
export function getDisplayName(user: User | null): string {
  return getStoredName(user) ?? user?.email ?? 'Usuário';
}

export type AccountProvider = 'email' | 'google' | 'apple';

const KNOWN_PROVIDERS: readonly AccountProvider[] = ['google', 'apple'];

/** Rótulo de exibição de cada provedor externo, para textos como "Gerenciado pela conta Google". */
export const PROVIDER_LABELS: Record<Exclude<AccountProvider, 'email'>, string> = {
  google: 'Google',
  apple: 'Apple',
};

/**
 * Provedor de login da conta.
 *
 * `'email'` sempre que existir uma identidade de senha — é a única condição que
 * libera a troca de senha, e ela é conferida antes das outras porque uma conta
 * pode ter mais de uma identidade vinculada. Na ausência de `identities`, cai no
 * `app_metadata.provider`. Sem nenhuma informação, o padrão é `'email'`: é o
 * formato que só mostra campos, sem prometer uma configuração em conta externa
 * que talvez não exista.
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
 * Primeira letra do nome (ou do e-mail, na falta dele) para o avatar sem foto.
 *
 * `[...value]` em vez de `value[0]`: um caractere fora do plano básico (emoji,
 * por exemplo) no início do nome partiria ao meio com indexação direta. A
 * maiúscula é aplicada aqui, no valor, e não via `textTransform` no estilo.
 */
export function getAvatarInitial(user: User | null): string | null {
  const source = getStoredName(user) ?? user?.email ?? null;
  if (!source) return null;

  const trimmed = source.trim();
  if (!trimmed) return null;

  const [first] = trimmed;
  return first.toLocaleUpperCase('pt-BR');
}
