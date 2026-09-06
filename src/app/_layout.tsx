import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { PassportsProvider, usePassports } from '@/features/passports/passports-context';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

/** Rota âncora para onde o router volta quando um grupo é desprotegido. */
export const unstable_settings = {
  anchor: '(app)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <PassportsProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </PassportsProvider>
    </AuthProvider>
  );
}

/**
 * Proteção de rotas em duas etapas.
 *
 * 1. Sem sessão, só existe o grupo `(auth)`.
 * 2. Com sessão mas sem nenhum passaporte, só existe o onboarding — é o que
 *    garante a pergunta sobre o passaporte antes da Home, sem depender de flag
 *    ou de armazenamento local: a própria ausência de passaporte é o estado.
 *
 * Como os grupos são montados condicionalmente, não há tela intermediária
 * piscando nem como burlar por deep link.
 */
function RootNavigator() {
  const { session, isLoading: isLoadingSession } = useAuth();
  const { hasPassport, isLoading: isLoadingPassports } = usePassports();

  const isReady = !isLoadingSession && !(session && isLoadingPassports);

  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    // Acontece na entrada do app e logo após o login, enquanto os passaportes
    // decidem entre onboarding e área principal. Sem isso a tela ficaria em
    // branco nesse intervalo.
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Protected guard={!!session && hasPassport}>
        <Stack.Screen name="(app)" />
        {/* `modal` usa o card nativo do iOS (o pai fica visível atrás, cantos
            arredondados) e entrega altura definida ao conteúdo. `formSheet`
            com detents deixava a lista sem altura e a tela saía em branco. */}
        <Stack.Screen
          name="passport-picker"
          options={{
            presentation: 'modal',
            contentStyle: { backgroundColor: colors.surface },
          }}
        />
        <Stack.Screen
          name="trip-new"
          options={{
            presentation: 'modal',
            contentStyle: { backgroundColor: colors.surface },
          }}
        />
        <Stack.Screen
          name="trip-edit"
          options={{
            presentation: 'modal',
            contentStyle: { backgroundColor: colors.surface },
          }}
        />
        {/* Sem gesto de fechar: a preparação da checklist é curta e termina
            navegando sozinha para a viagem. */}
        <Stack.Screen
          name="trip-preparing"
          options={{
            presentation: 'modal',
            gestureEnabled: false,
            contentStyle: { backgroundColor: colors.surface },
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !hasPassport}>
        <Stack.Screen name="onboarding" />
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
