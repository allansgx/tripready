import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DialogHost } from '@/components/ui/dialog';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { PassportsProvider, usePassports } from '@/features/passports/passports-context';
import { SplashOverlay } from '@/features/splash/components/splash-overlay';
import { loadLocaleChoice, t, useLocale } from '@/i18n';
import { colors, spacing, typography } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

// O primeiro quadro do overlay repete o splash nativo: o fade curto é só seguro
// contra diferença de arredondamento entre o PNG e o SVG.
SplashScreen.setOptions({ fade: true, duration: 150 });

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
 * Enquanto sessão, passaportes e fonte não resolvem, só o splash é montado —
 * nenhuma rota pisca antes de se saber para onde o usuário vai.
 */
function RootNavigator() {
  const { session, isLoading: isLoadingSession } = useAuth();
  const { isLoading: isLoadingPassports } = usePassports();

  // Carregada em tempo de execução por causa do Expo Go. Um erro aqui não
  // segura o app: o nome da viagem sai na fonte do sistema.
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_700Bold: require('@/assets/fonts/Fraunces_700Bold.ttf'),
  });

  // Leitura local, dentro da espera que o splash já cobre: sem isso a primeira
  // tela sairia no idioma do aparelho e trocaria na frente de quem escolheu
  // outro. `loadLocaleChoice` não rejeita, então a espera sempre termina.
  const [localeLoaded, setLocaleLoaded] = useState(false);
  useEffect(() => {
    void loadLocaleChoice().finally(() => setLocaleLoaded(true));
  }, []);

  const isReady =
    !isLoadingSession &&
    !(session && isLoadingPassports) &&
    (fontsLoaded || fontError !== null) &&
    localeLoaded;

  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {isReady ? <AppContent /> : splashDone ? <Readying /> : null}
      {splashDone ? null : <SplashOverlay isAppReady={isReady} onFinish={handleSplashDone} />}
    </>
  );
}

/**
 * A espera depois do login, enquanto os passaportes decidem entre onboarding e
 * área principal. O splash não volta aqui: ele é a chegada ao app.
 */
function Readying() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

/**
 * Proteção de rotas: sem sessão só existe `(auth)`, e com sessão sem passaporte
 * só existe o onboarding. Os grupos são montados condicionalmente, então não há
 * tela piscando nem como burlar por deep link.
 */
function AppContent() {
  const { session, isRecovering } = useAuth();
  const { hasPassport, hasLoadError: passportsFailed, refresh: refreshPassports } = usePassports();

  // React Navigation embrulha cada tela em `StaticContainer`, que ignora
  // re-renderizações do pai quando só os `children` mudam — por isso trocar de
  // idioma não redesenhava as telas já montadas, só quem assinava por conta
  // própria (como o seletor de idioma). A `key` força o `Stack` inteiro a
  // remontar na troca, o mesmo efeito do reload manual que o problema exigia.
  const locale = useLocale();

  // Chutar "não tem passaporte" mandaria para o cadastro alguém que já tem.
  if (session && passportsFailed) {
    return (
      <View style={styles.center}>
        <Text style={styles.retryText}>{t('app.connectionError')}</Text>
        <Button
          label={t('common.action.retry')}
          onPress={() => void refreshPassports().catch(() => {})}
        />
      </View>
    );
  }

  return (
    <Stack
      key={locale}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Protected guard={!!session && hasPassport && !isRecovering}>
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
        {/* Sem gesto: a preparação termina navegando sozinha para a viagem. */}
        <Stack.Screen
          name="trip-preparing"
          options={{
            presentation: 'modal',
            gestureEnabled: false,
            contentStyle: { backgroundColor: colors.surface },
          }}
        />
        {/* Também sem gesto: no meio da exclusão não há o que cancelar. */}
        <Stack.Screen
          name="account-deleting"
          options={{
            presentation: 'modal',
            gestureEnabled: false,
            contentStyle: { backgroundColor: colors.surface },
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !hasPassport && !isRecovering}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* Fora dos grupos protegidos: o retorno do OAuth chega antes da sessão. */}
      <Stack.Screen name="auth/callback" options={{ animation: 'fade' }} />

      {/* Também fora: o código de recuperação cria sessão antes da senha nova
          existir. Sem isso aqui, os guards acima já teriam levado a pessoa
          para dentro do app assim que a sessão aparecesse. */}
      <Stack.Screen name="auth/new-password" />

      {/* Também fora: os documentos legais são alcançados com e sem sessão. */}
      <Stack.Screen name="legal/privacidade" />
      <Stack.Screen name="legal/termos" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: {
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
