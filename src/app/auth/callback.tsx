import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Destino do deep link do OAuth, para o caso em que o sistema entrega o link ao
 * app em vez do `WebBrowser`. A troca do `code` acontece no `AuthProvider`.
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
