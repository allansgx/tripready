import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Destino do deep link `.../auth/callback` do OAuth.
 *
 * Normalmente o `WebBrowser` intercepta o redirect e esta tela nem aparece; ela
 * existe para o caso em que o sistema entrega o link ao app (comum no Expo Go
 * no Android), evitando cair na rota "Unmatched Route". A troca do `code` por
 * sessão é feita uma única vez no `AuthProvider`; aqui só aguardamos.
 */
export default function AuthCallbackScreen() {
  const { session, error } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 10_000);
    return () => clearTimeout(timer);
  }, []);

  if (session) {
    return <Redirect href="/" />;
  }

  if (error || timedOut) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>Concluindo login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
