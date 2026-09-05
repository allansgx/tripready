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
    const nativeAvailable =
      Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());

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
