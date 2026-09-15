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
  sendPasswordReset: (email: string) => Promise<void>;
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

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
      error,
      signInWithGoogle: () => run(() => authService.signInWithGoogle()),
      signInWithApple: () => run(() => authService.signInWithApple()),
      signInWithEmail: async (email, password) => {
        setError(null);
        await authService.signInWithEmail(email, password);
      },
      signUpWithEmail: (email, password, name) =>
        authService.signUpWithEmail(email, password, name),
      sendPasswordReset: (email) => authService.sendPasswordReset(email),
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
  }, [session, isLoading, isSigningIn, error]);

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
