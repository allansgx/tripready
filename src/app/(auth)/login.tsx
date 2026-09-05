import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { SectionLabel } from '@/components/ui/section-label';
import { useAuth } from '@/features/auth/auth-context';
import { getRedirectDiagnostics } from '@/features/auth/auth-redirect';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple, isSigningIn, error } = useAuth();
  const [pending, setPending] = useState<'google' | 'apple' | null>(null);
  const redirect = __DEV__ ? getRedirectDiagnostics() : null;

  async function handle(provider: 'google' | 'apple') {
    setPending(provider);
    try {
      await (provider === 'google' ? signInWithGoogle() : signInWithApple());
    } finally {
      setPending(null);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="airplane" size={34} color={colors.contrastText} />
          </View>
          <Text style={styles.title}>TripReady</Text>
          <Text style={styles.subtitle}>
            Tudo o que você precisa antes de viajar, organizado em um só lugar.
          </Text>
        </View>

        <View style={styles.section}>
          <SectionLabel>Entrar</SectionLabel>
          <Card>
            <ListRow
              label="Continuar com Google"
              icon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
              iconBackground="#EFF3FE"
              onPress={() => handle('google')}
              loading={pending === 'google'}
              disabled={isSigningIn && pending !== 'google'}
            />
            <ListRow
              label="Continuar com Apple"
              icon={<Ionicons name="logo-apple" size={18} color={colors.contrastText} />}
              iconBackground={colors.contrast}
              onPress={() => handle('apple')}
              loading={pending === 'apple'}
              disabled={isSigningIn && pending !== 'apple'}
            />
          </Card>

          {error ? (
            <View style={styles.error}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.footer}>
          Ao continuar, você concorda com os <Text style={styles.footerLink}>Termos de uso</Text> e
          com a <Text style={styles.footerLink}>Política de privacidade</Text>.
        </Text>

        {/* Bloco só de desenvolvimento: mostra a URL exata que precisa estar em
            Supabase → Authentication → URL Configuration → Redirect URLs. */}
        {redirect ? (
          <View style={styles.debug}>
            <Text style={styles.debugLabel}>
              DEV · redirect_to{redirect.isExpoGo ? ' (Expo Go)' : ''}
            </Text>
            <Text style={styles.debugValue} selectable>
              {redirect.uri}
            </Text>
            {redirect.warning ? <Text style={styles.debugWarning}>{redirect.warning}</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl - spacing.xs,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.xxl,
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    flex: 1,
  },
  footer: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: Platform.OS === 'web' ? spacing.lg : 0,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  debug: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  debugLabel: {
    ...typography.sectionLabel,
    color: colors.textSecondary,
  },
  debugValue: {
    fontFamily: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
    fontSize: 11,
    color: colors.text,
  },
  debugWarning: {
    ...typography.caption,
    fontSize: 11,
    color: colors.danger,
  },
});
