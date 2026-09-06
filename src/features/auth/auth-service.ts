import * as AppleAuthentication from 'expo-apple-authentication';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { authRedirectUri } from '@/features/auth/auth-redirect';
import { supabase } from '@/lib/supabase/client';

// Fecha a janela de autenticação quando o redirect volta (necessário no web).
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

export { authRedirectUri };

/** Erro lançado quando o usuário fecha a tela de login do provedor. */
export class AuthCancelledError extends Error {
  constructor() {
    super('Login cancelado pelo usuário.');
    this.name = 'AuthCancelledError';
  }
}

/**
 * Códigos PKCE já trocados por sessão.
 *
 * O mesmo redirect pode chegar por dois caminhos — o resultado do
 * `openAuthSessionAsync` e o deep link que abre o app — e o `code` do PKCE só
 * pode ser usado uma vez. Sem isso a segunda troca falha e mostra um erro na
 * tela mesmo com o login tendo dado certo.
 */
const exchangedCodes = new Set<string>();

/**
 * Cria a sessão a partir da URL de redirect do provedor.
 * Com PKCE vem um `code`, que é trocado por sessão; o fallback trata o formato
 * antigo com tokens direto na URL.
 */
export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = getQueryParams(url);

  if (errorCode) {
    throw new Error(`Falha na autenticação: ${errorCode}`);
  }

  const { code, access_token, refresh_token } = params;

  if (code) {
    if (exchangedCodes.has(code)) {
      return null;
    }
    exchangedCodes.add(code);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      exchangedCodes.delete(code);
      throw error;
    }
    return data.session;
  }

  if (access_token && refresh_token) {
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
    return data.session;
  }

  return null;
}

/**
 * Login OAuth pelo navegador (ASWebAuthenticationSession no iOS,
 * Custom Tabs no Android). Não exige client secret no app.
 */
async function signInWithOAuthBrowser(provider: OAuthProvider) {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: authRedirectUri },
    });
    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: authRedirectUri, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('O Supabase não retornou a URL de autenticação.');

  if (__DEV__) {
    // Mostra o `redirect_to` realmente embutido na URL de autorização — é essa
    // string exata que precisa estar em Supabase → Redirect URLs.
    const sent = new URL(data.url).searchParams.get('redirect_to');
    console.log(`[auth] authorize url = ${data.url}`);
    console.log(`[auth] redirect_to enviado ao Supabase = ${sent}`);
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUri);
  if (result.type !== 'success') {
    throw new AuthCancelledError();
  }

  return createSessionFromUrl(result.url);
}

export const authService = {
  signInWithGoogle() {
    return signInWithOAuthBrowser('google');
  },

  /**
   * No iOS usa o Sign in with Apple nativo (exigido pela App Store) e envia o
   * identity token para o Supabase. Nas demais plataformas cai no fluxo OAuth.
   */
  async signInWithApple() {
    const nativeAvailable = Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());

    if (!nativeAvailable) {
      return signInWithOAuthBrowser('apple');
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('A Apple não retornou o identity token.');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
      return data.session;
    } catch (error) {
      if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
        throw new AuthCancelledError();
      }
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // TEMPORÁRIO — login por e-mail/senha.
  //
  // Existe para conseguir usar o app autenticado no Expo Go (iPhone) enquanto o
  // retorno do OAuth não funciona nesse ambiente. É JS puro sobre o Supabase
  // Auth, sem módulo nativo, então roda no Expo Go sem build.
  // Para remover: apague estes três métodos, as telas em `src/app/(auth)/`
  // (email-login, sign-up, forgot-password) e a linha "Entrar com e-mail" da
  // tela de login.
  // ---------------------------------------------------------------------------

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data.session;
  },

  /**
   * Retorna `'signed-in'` quando a sessão já veio pronta (confirmação de e-mail
   * desligada no projeto) e `'confirm-email'` quando o Supabase enviou o link
   * de confirmação e ainda não há sessão.
   */
  async signUpWithEmail(
    email: string,
    password: string,
    name: string,
  ): Promise<'signed-in' | 'confirm-email'> {
    const displayName = name.trim();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: authRedirectUri,
        // Vira `raw_user_meta_data` em auth.users. `display_name` é o campo que
        // o painel do Supabase mostra na coluna "Display name"; `full_name`
        // mantém o mesmo formato que o Google devolve, para o app ler o nome
        // do mesmo jeito nos dois provedores.
        data: { display_name: displayName, full_name: displayName },
      },
    });
    if (error) throw error;

    // Quando o e-mail já existe, o Supabase devolve um usuário com `identities`
    // vazio em vez de erro (proteção contra enumeração de contas).
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('User already registered');
    }

    return data.session ? 'signed-in' : 'confirm-email';
  },

  async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authRedirectUri,
    });
    if (error) throw error;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
};
