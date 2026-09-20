import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormLayout } from '@/components/ui/form-layout';
import { FormMessage } from '@/components/ui/form-message';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-context';
import { toAuthMessage } from '@/features/auth/auth-errors';
import { normalizeEmail, validateEmail, type EmailIssue } from '@/features/auth/email';
import { getRecoveryCooldownSeconds, markRecoverySent } from '@/features/auth/recovery-cooldown';
import { t } from '@/i18n';
import { spacing } from '@/theme/tokens';

/** Traduz o descritivo de `validateEmail` no idioma ativo. */
function emailIssueMessage(issue: EmailIssue | null): string | null {
  if (!issue) return null;
  if (issue.kind === 'typo') return t('auth.email.error.typo', { suggestion: issue.suggestion });
  return t(issue.kind === 'empty' ? 'auth.email.error.empty' : 'auth.email.error.invalid');
}

export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    getRecoveryCooldownSeconds().then(setCooldown);
  }, []);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit() {
    const emailProblem = validateEmail(email);
    if (emailProblem) {
      setError(emailIssueMessage(emailProblem));
      return;
    }

    setError(null);
    const normalized = normalizeEmail(email);

    // Já existe um código pendente dentro do cooldown: só volta para a tela
    // de código, sem acionar outro envio — impede clicar aqui em loop para
    // contornar a espera de "reenviar" da tela seguinte.
    if (cooldown > 0) {
      router.push({ pathname: '/reset-password', params: { email: normalized } });
      return;
    }

    setBusy(true);
    try {
      // Sempre avança, exista ou não a conta — o Supabase não revela isso, e a
      // tela não deve revelar também. Só um erro de transporte de verdade
      // impede o avanço.
      await requestPasswordReset(normalized);
      await markRecoverySent();
      router.push({ pathname: '/reset-password', params: { email: normalized } });
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormLayout>
      <ScreenHeader
        title={t('auth.forgotPassword.title')}
        subtitle={t('auth.forgotPassword.subtitle')}
      />

      <View style={styles.form}>
        <TextField
          label={t('common.field.email.label')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('common.field.email.placeholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {error ? <FormMessage text={error} /> : null}
        {cooldown > 0 ? (
          <FormMessage
            tone="success"
            text={t('auth.forgotPassword.cooldown', { seconds: cooldown })}
          />
        ) : null}

        <Button label={t('auth.forgotPassword.submit')} onPress={submit} loading={busy} />
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
});
