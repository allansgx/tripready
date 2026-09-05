import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  AuthCancelledError,
  authService,
  createSessionFromUrl,
} from '@/features/auth/auth-service';
import { supabase } from '@/lib/supabase/client';

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
      signOut: async () => {
        setError(null);
        try {
          await authService.signOut();
        } catch (err) {
          setError(toMessage(err));
        }
      },
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
  return error instanceof Error ? error.message : 'Erro inesperado na autenticação.';
}
