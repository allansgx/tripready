import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormLayout } from '@/components/ui/form-layout';
import { FormMessage } from '@/components/ui/form-message';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-context';
import { toAuthMessage } from '@/features/auth/auth-errors';
import { isPasswordValid, MIN_PASSWORD_LENGTH } from '@/features/auth/password';
import { PasswordField } from '@/features/auth/password-field';
import { t } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/**
 * Fora dos grupos protegidos de propósito (`_layout.tsx`, guard de `isRecovering`):
 * a sessão de recuperação já existe aqui, e sem essa exceção o app pularia
 * direto para dentro antes da senha nova ser definida. Sem gesto de voltar —
 * a essa altura não há para onde voltar, só para a frente.
 */
export default function NewPasswordScreen() {
  const { setNewPasswordAfterRecovery } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = isPasswordValid(password) && password === confirmation;

  async function submit() {
    if (!isPasswordValid(password)) {
      setError(t('auth.changePassword.error.invalidNew'));
      return;
    }
    if (password !== confirmation) {
      setError(t('auth.changePassword.error.mismatch'));
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await setNewPasswordAfterRecovery(password);
      // `isRecovering` já caiu: os guards do layout raiz agora liberam o app
      // normalmente, exatamente como um login comum.
      router.replace('/');
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormLayout>
      <ProgressBar percent={100} />

      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t('auth.resetPassword.newPassword.title')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.resetPassword.newPassword.subtitle', { min: MIN_PASSWORD_LENGTH })}
        </Text>
      </View>

      <View style={styles.form}>
        <PasswordField
          label={t('auth.changePassword.field.new.label')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.password.placeholder.minLength', { min: MIN_PASSWORD_LENGTH })}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
        />
        <TextField
          label={t('auth.changePassword.field.confirmNew.label')}
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder={t('auth.changePassword.field.confirmNew.placeholder')}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {error ? <FormMessage text={error} /> : null}

        <Button
          label={t('auth.resetPassword.newPassword.submit')}
          onPress={submit}
          loading={busy}
          disabled={!canSubmit}
        />
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
});
