import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

/** Rota âncora para onde o router volta quando um grupo é desprotegido. */
export const unstable_settings = {
  anchor: '(app)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}

/**
 * Proteção de rotas: os grupos são montados conforme a sessão.
 * Sem sessão, `(app)` nem existe na árvore de navegação — não há como
 * navegar para dentro dela por link, deep link ou histórico.
 */
function RootNavigator() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* Fora dos grupos protegidos: o retorno do OAuth chega antes da sessão
          existir e precisa continuar acessível depois que ela existe. */}
      <Stack.Screen name="auth/callback" options={{ animation: 'fade' }} />
    </Stack>
  );
}
