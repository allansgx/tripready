import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { AuthUiError } from '@/features/auth/auth-errors';
import { authRedirectUri } from '@/features/auth/auth-redirect';
import { DeleteAccountError, type DeleteAccountFailure } from '@/features/auth/delete-account';
import { normalizeEmail } from '@/features/auth/email';
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

// O mesmo redirect chega pelo `openAuthSessionAsync` e pelo deep link, e o
// `code` do PKCE só pode ser trocado uma vez.
const exchangedCodes = new Set<string>();

/** Cria a sessão a partir da URL de redirect do provedor. */
export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = getQueryParams(url);

  if (errorCode) {
    throw new AuthUiError('auth.error.callbackFailed', { code: errorCode });
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

/** Login OAuth pelo navegador, sem client secret no app. */
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
  if (!data.url) throw new AuthUiError('auth.error.missingAuthUrl');

  if (__DEV__) {
    // É esta string exata que precisa estar em Supabase → Redirect URLs.
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

// `401` é a única resposta que significa "sessão inválida": a função responde
// `200` quando a conta já havia sido excluída.
function classifyDeleteFailure(error: unknown): DeleteAccountFailure {
  if (error instanceof FunctionsFetchError) {
    return 'connection';
  }

  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response | undefined;
    return response?.status === 401 ? 'session' : 'unknown';
  }

  return 'unknown';
}

export const authService = {
  signInWithGoogle() {
    return signInWithOAuthBrowser('google');
  },

  /** No iOS, Sign in with Apple nativo (exigido pela App Store). */
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
        throw new AuthUiError('auth.error.missingAppleToken');
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

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) throw error;
    return data.session;
  },

  /** `'confirm-email'` quando o Supabase enviou o código e ainda não há sessão. */
  async signUpWithEmail(
    email: string,
    password: string,
    name: string,
  ): Promise<'signed-in' | 'confirm-email'> {
    const displayName = name.trim();

    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: {
        emailRedirectTo: authRedirectUri,
        // `display_name` é o que o painel do Supabase mostra; `full_name` é o
        // formato que o Google devolve.
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

  /**
   * Exclusão permanente da conta, pela Edge Function — o app não tem privilégio
   * para apagar `auth.users`. A sessão não é encerrada aqui: quem decide o
   * momento é a tela, com `signOutLocal`.
   */
  async deleteAccount(): Promise<void> {
    const { error } = await supabase.functions.invoke('delete-account');

    if (error) {
      throw new DeleteAccountError(classifyDeleteFailure(error), { cause: error });
    }
  },

  /** Encerra a sessão só no dispositivo, sem levantar erro: a conta já não existe. */
  async signOutLocal(): Promise<void> {
    await supabase.auth.signOut({ scope: 'local' });
  },

  /** Cria a sessão a partir do código de 6 dígitos enviado por e-mail. */
  async confirmSignUpCode(email: string, code: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizeEmail(email),
      token: code,
      type: 'signup',
    });
    if (error) throw error;
    return data.session;
  },

  async resendSignUpCode(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizeEmail(email),
    });
    if (error) throw error;
  },

  /**
   * Passa pela Edge Function, nunca por `resetPasswordForEmail` direto — é ela
   * quem decide se a conta é elegível (tem identidade de e-mail) antes de
   * disparar o envio nativo. A resposta chega sempre igual, elegível ou não.
   */
  async requestPasswordReset(email: string) {
    const { error } = await supabase.functions.invoke('request-password-reset', {
      body: { email: normalizeEmail(email) },
    });
    if (error) throw error;
  },

  /** Cria a sessão de recuperação a partir do código de 6 dígitos. */
  async verifyRecoveryCode(email: string, code: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizeEmail(email),
      token: code,
      type: 'recovery',
    });
    if (error) throw error;
    return data.session;
  },

  /**
   * Só chamável com a sessão de recuperação ativa — não pede a senha atual,
   * ao contrário de `changePassword`.
   */
  async setNewPasswordAfterRecovery(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  /** Os dois campos pelo mesmo motivo do cadastro; `getDisplayName` lê ambos. */
  async updateDisplayName(name: string): Promise<void> {
    const displayName = name.trim();
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName, full_name: displayName },
    });
    if (error) throw error;
  },

  /**
   * `current_password` é conferido pelo GoTrue quando "Secure password change"
   * está ligada; o erro correspondente é tratado em `toAuthMessage`.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
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
