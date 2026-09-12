import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DialogHost } from '@/components/ui/dialog';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { PassportsProvider, usePassports } from '@/features/passports/passports-context';
import { colors, spacing, typography } from '@/theme/tokens';

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
        {/* Onde os alertas da web aparecem; no nativo não desenha nada. */}
        <DialogHost />
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
  const {
    hasPassport,
    isLoading: isLoadingPassports,
    hasLoadError: passportsFailed,
    refresh: refreshPassports,
  } = usePassports();

  /**
   * A serifada do dia do embarque, carregada em tempo de execução porque o app
   * roda no Expo Go, onde o plugin de build do `expo-font` não vale.
   *
   * Um erro aqui não segura o app: sem a fonte, o nome da viagem sai na fonte
   * do sistema, que é uma tela menos bonita e não uma tela quebrada.
   */
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_700Bold: require('@/assets/fonts/Fraunces_700Bold.ttf'),
  });

  const isReady =
    !isLoadingSession && !(session && isLoadingPassports) && (fontsLoaded || fontError !== null);

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

  /**
   * A leitura dos passaportes falhou. Sem ela não dá para escolher entre
   * onboarding e área principal, e chutar "não tem passaporte" mandaria para o
   * cadastro alguém que já tem — daí uma tela própria, com a saída na mão.
   */
  if (session && passportsFailed) {
    return (
      <View style={styles.loading}>
        <Text style={styles.retryText}>Sua conexão oscilou.</Text>
        <Button label="Tentar de novo" onPress={() => void refreshPassports().catch(() => {})} />
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
        {/* Também sem gesto: no meio da exclusão não há o que cancelar, e no
            fim a saída é o botão que leva para a entrada. */}
        <Stack.Screen
          name="account-deleting"
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

      {/* Também fora: os documentos legais são alcançados da tela de login,
          onde ainda não há sessão, e do Perfil, onde já há. */}
      <Stack.Screen name="legal/privacidade" />
      <Stack.Screen name="legal/termos" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  retryText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
});
