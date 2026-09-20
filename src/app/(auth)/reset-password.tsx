import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormLayout } from '@/components/ui/form-layout';
import { FormMessage } from '@/components/ui/form-message';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useAuth } from '@/features/auth/auth-context';
import { toAuthMessage } from '@/features/auth/auth-errors';
import { CodeField } from '@/features/auth/code-field';
import { getRecoveryCooldownSeconds, markRecoverySent } from '@/features/auth/recovery-cooldown';
import {
  isVerificationCodeComplete,
  VERIFICATION_CODE_LENGTH,
} from '@/features/auth/verification-code';
import { t } from '@/i18n';
import {
  colors,
  prioritySoftColors,
  priorityColors,
  radius,
  spacing,
  typography,
} from '@/theme/tokens';

export default function ResetPasswordScreen() {
  const { verifyRecoveryCode, requestPasswordReset } = useAuth();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  // Começa em 0: o valor real (herdado do pedido feito na tela anterior) só
  // é conhecido depois de ler o cooldown persistido, no efeito abaixo.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    getRecoveryCooldownSeconds().then(setCooldown);
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
      setError(t('auth.resetPassword.code.error.incomplete'));
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await verifyRecoveryCode(email, code);
      // Navegação explícita, não automática: com `isRecovering`, nenhum grupo
      // protegido tem guard verdadeiro, então não há para onde o layout raiz
      // levar a tela sozinho.
      router.replace('/auth/new-password');
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
      await requestPasswordReset(email);
      await markRecoverySent();
      setResendMessage(t('auth.resetPassword.code.resendSuccess'));
      setCooldown(await getRecoveryCooldownSeconds());
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <FormLayout>
      <ProgressBar percent={50} color={priorityColors.recommended} />

      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="shield-checkmark-outline" size={24} color={priorityColors.recommended} />
        </View>
        <Text style={styles.title}>{t('auth.resetPassword.code.title')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.resetPassword.code.subtitle', { email, length: VERIFICATION_CODE_LENGTH })}
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
          label={t('auth.resetPassword.code.verify')}
          onPress={submit}
          loading={busy}
          disabled={!isVerificationCodeComplete(code)}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendQuestion}>{t('auth.resetPassword.code.resendQuestion')}</Text>
          {cooldown > 0 ? (
            <Text style={styles.resendCountdown}>
              {t('auth.resetPassword.code.resendCountdown', { seconds: cooldown })}
            </Text>
          ) : resending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Pressable onPress={resend} hitSlop={8}>
              <Text style={styles.resendLink}>{t('auth.resetPassword.code.resend')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: prioritySoftColors.recommended,
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
