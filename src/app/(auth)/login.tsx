import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { SectionLabel } from '@/components/ui/section-label';
import { useAuth } from '@/features/auth/auth-context';
import { getRedirectDiagnostics } from '@/features/auth/auth-redirect';
import { LegalConsentNotice } from '@/features/legal/components/legal-consent-notice';
import { t } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const BRAND_LOGO = require('@/assets/images/splash-icon.png');

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple, isSigningIn, error } = useAuth();
  const router = useRouter();
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
          <Image source={BRAND_LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>TripReady</Text>
          <Text style={styles.subtitle}>{t('auth.login.tagline')}</Text>
        </View>

        <View style={styles.section}>
          <SectionLabel>{t('auth.login.section.signIn')}</SectionLabel>
          <Card>
            <ListRow
              label={t('auth.login.continueWithGoogle')}
              icon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
              iconBackground="#EFF3FE"
              onPress={() => handle('google')}
              loading={pending === 'google'}
              disabled={isSigningIn && pending !== 'google'}
            />
            <ListRow
              label={t('auth.login.continueWithApple')}
              icon={<Ionicons name="logo-apple" size={18} color={colors.contrastText} />}
              iconBackground={colors.contrast}
              onPress={() => handle('apple')}
              loading={pending === 'apple'}
              disabled={isSigningIn && pending !== 'apple'}
            />
            {/* TEMPORÁRIO — caminho de e-mail/senha para testar o app
                autenticado no Expo Go. Remover junto com as telas
                email-login / sign-up / forgot-password. */}
            <ListRow
              label={t('auth.login.continueWithEmail')}
              icon={<Ionicons name="mail" size={18} color={colors.primary} />}
              onPress={() => router.push('/email-login')}
              disabled={isSigningIn}
            />
          </Card>

          {error ? (
            <View style={styles.error}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        <LegalConsentNotice variant="continue" />

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
