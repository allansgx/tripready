import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { toAuthMessage } from '@/features/auth/auth-errors';
import {
  AuthCancelledError,
  authService,
  createSessionFromUrl,
} from '@/features/auth/auth-service';
import { seedLocaleChoice } from '@/i18n';
import { supabase } from '@/lib/supabase/client';
import { profilesService } from '@/services';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  /** `true` enquanto a sessão persistida ainda não foi restaurada. */
  isLoading: boolean;
  /** `true` durante um login em andamento. */
  isSigningIn: boolean;
  /**
   * `true` a partir do momento em que o código de recuperação cria sessão, até
   * a senha nova ser definida. Enquanto isso, nenhum grupo protegido pode
   * assumir essa sessão — é o que impede o app de pular direto para dentro
   * antes da pessoa trocar a senha.
   */
  isRecovering: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Exclui a conta, sem encerrar a sessão. **Lança** `DeleteAccountError`: a
   * tela de confirmação mostra a mensagem no seu próprio contexto, e não no
   * erro global da tela de login.
   */
  deleteAccount: () => Promise<void>;
  /**
   * Encerra a sessão só no dispositivo, fechando o fluxo de exclusão depois que
   * a confirmação já foi mostrada. Nunca levanta erro.
   */
  signOutLocal: () => Promise<void>;
  /**
   * Métodos de e-mail/senha (temporários, para testes no Expo Go).
   * Diferente dos de OAuth, estes **lançam** o erro: cada tela de formulário
   * mostra a mensagem no seu próprio contexto, em vez do erro global.
   */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<'signed-in' | 'confirm-email'>;
  /** Cria a sessão a partir do código de 6 dígitos. **Lança** o erro. */
  confirmSignUpCode: (email: string, code: string) => Promise<void>;
  /** Pede um novo código de confirmação. **Lança** o erro. */
  resendSignUpCode: (email: string) => Promise<void>;
  /** Pede a recuperação — sempre silenciosa, nunca lança por e-mail inexistente. */
  requestPasswordReset: (email: string) => Promise<void>;
  /** Cria a sessão de recuperação a partir do código. **Lança** o erro. */
  verifyRecoveryCode: (email: string, code: string) => Promise<void>;
  /**
   * Define a senha nova com a sessão de recuperação ativa, e encerra
   * `isRecovering` — só depois disso os grupos protegidos voltam a valer.
   */
  setNewPasswordAfterRecovery: (password: string) => Promise<void>;
  /** Grava o nome de exibição. **Lança** o erro — a tela mostra a mensagem inline. */
  updateDisplayName: (name: string) => Promise<void>;
  /**
   * Troca a senha, conferindo a senha atual. **Lança** o erro; só chamável em
   * contas com identidade de e-mail (`getAccountProvider(user) === 'email'`).
   */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sessão persistida + eventos de login/logout/refresh vindos do Supabase.
  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // O código de recuperação cria sessão antes da senha nova existir — sem
      // marcar isso, o guard de `(app)` a trata como login normal e libera o
      // app inteiro no meio do fluxo.
      if (event === 'PASSWORD_RECOVERY') setIsRecovering(true);
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // O idioma escolhido acompanha a conta, e só serve a um aparelho que ainda
  // não tem escolha própria. Em paralelo com os passaportes, que já são
  // esperados aqui: nunca estende a entrada no app, e falhar não custa nada.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;

    let active = true;
    profilesService
      .getLocale(userId)
      .then((locale) => {
        if (active) return seedLocaleChoice(locale);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [userId]);

  // Deep link de retorno do OAuth quando o app é reaberto pelo link
  // (em vez de voltar pelo resultado do WebBrowser).
  const url = Linking.useURL();
  useEffect(() => {
    if (!url || !url.includes('auth/callback')) return;
    createSessionFromUrl(url).catch((err: unknown) => {
      setError(toMessage(err));
    });
  }, [url]);

  const value = useMemo<AuthContextValue>(() => {
    async function run(action: () => Promise<unknown>) {
      setError(null);
      setIsSigningIn(true);
      try {
        await action();
      } catch (err) {
        if (!(err instanceof AuthCancelledError)) {
          setError(toMessage(err));
        }
      } finally {
        setIsSigningIn(false);
      }
    }

    return {
      session,
      user: session?.user ?? null,
      isLoading,
      isSigningIn,
      isRecovering,
      error,
      signInWithGoogle: () => run(() => authService.signInWithGoogle()),
      signInWithApple: () => run(() => authService.signInWithApple()),
      signInWithEmail: async (email, password) => {
        setError(null);
        await authService.signInWithEmail(email, password);
      },
      signUpWithEmail: (email, password, name) =>
        authService.signUpWithEmail(email, password, name),
      confirmSignUpCode: async (email, code) => {
        setError(null);
        await authService.confirmSignUpCode(email, code);
      },
      resendSignUpCode: (email) => authService.resendSignUpCode(email),
      requestPasswordReset: (email) => authService.requestPasswordReset(email),
      verifyRecoveryCode: async (email, code) => {
        setError(null);
        await authService.verifyRecoveryCode(email, code);
      },
      setNewPasswordAfterRecovery: async (password) => {
        await authService.setNewPasswordAfterRecovery(password);
        setIsRecovering(false);
      },
      signOut: async () => {
        setError(null);
        try {
          await authService.signOut();
        } catch (err) {
          setError(toMessage(err));
        }
      },
      deleteAccount: async () => {
        setError(null);
        await authService.deleteAccount();
      },
      signOutLocal: () => authService.signOutLocal(),
      updateDisplayName: (name) => authService.updateDisplayName(name),
      changePassword: (currentPassword, newPassword) =>
        authService.changePassword(currentPassword, newPassword),
    };
  }, [session, isLoading, isSigningIn, isRecovering, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  }
  return context;
}

function toMessage(error: unknown) {
  return toAuthMessage(error);
}
