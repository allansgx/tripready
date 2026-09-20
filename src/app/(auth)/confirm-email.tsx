import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormLayout } from '@/components/ui/form-layout';
import { FormMessage } from '@/components/ui/form-message';
import { useAuth } from '@/features/auth/auth-context';
import { toAuthMessage } from '@/features/auth/auth-errors';
import { CodeField } from '@/features/auth/code-field';
import {
  getSignupCodeCooldownSeconds,
  markSignupCodeSent,
} from '@/features/auth/signup-code-cooldown';
import {
  isVerificationCodeComplete,
  VERIFICATION_CODE_LENGTH,
} from '@/features/auth/verification-code';
import { t } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function ConfirmEmailScreen() {
  const { confirmSignUpCode, resendSignUpCode } = useAuth();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  // Começa em 0: o valor real (herdado do cadastro que já mandou o primeiro
  // código) só é conhecido depois de ler o cooldown persistido, no efeito
  // abaixo.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    getSignupCodeCooldownSeconds().then(setCooldown);
  }, []);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function changeCode(value: string) {
    setCode(value);
    if (error) setError(null);
  }

  async function submit() {
    if (!isVerificationCodeComplete(code)) {
      setError(t('auth.confirmEmail.error.incomplete'));
      return;
    }

    setError(null);
    setBusy(true);
    try {
      // Em caso de sucesso não há navegação manual: a sessão muda, o layout
      // raiz libera o onboarding e a tela sai de cena sozinha.
      await confirmSignUpCode(email, code);
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    setResendMessage(null);
    setResending(true);
    try {
      await resendSignUpCode(email);
      await markSignupCodeSent();
      setResendMessage(t('auth.confirmEmail.resendSuccess'));
      setCooldown(await getSignupCodeCooldownSeconds());
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <FormLayout>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.action.back')}
        hitSlop={12}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="mail-outline" size={24} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t('auth.confirmEmail.title')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.confirmEmail.subtitle', { email, length: VERIFICATION_CODE_LENGTH })}
        </Text>
      </View>

      <View style={styles.form}>
        <CodeField
          value={code}
          onChangeText={changeCode}
          length={VERIFICATION_CODE_LENGTH}
          error={!!error}
          autoFocus
          onSubmitEditing={submit}
        />

        {error ? <FormMessage text={error} /> : null}
        {!error && resendMessage ? <FormMessage tone="success" text={resendMessage} /> : null}

        <Button
          label={t('auth.confirmEmail.confirm')}
          onPress={submit}
          loading={busy}
          disabled={!isVerificationCodeComplete(code)}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendQuestion}>{t('auth.confirmEmail.resendQuestion')}</Text>
          {cooldown > 0 ? (
            <Text style={styles.resendCountdown}>
              {t('auth.confirmEmail.resendCountdown', { seconds: cooldown })}
            </Text>
          ) : resending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Pressable onPress={resend} hitSlop={8}>
              <Text style={styles.resendLink}>{t('auth.confirmEmail.resend')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 36,
    height: 36,
    marginLeft: -spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: colors.primarySoft,
  },
  header: {
    gap: spacing.md,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.lg,
  },
  resendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  resendQuestion: {
    ...typography.body,
    color: colors.textSecondary,
  },
  resendCountdown: {
    ...typography.body,
    color: colors.textSecondary,
  },
  resendLink: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
});
